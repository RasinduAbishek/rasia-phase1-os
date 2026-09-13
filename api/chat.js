import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

const tools = [
  {
    type:"function", name:"get_today_schedule",
    description:"Read today's schedule from the user context.",
    parameters:{type:"object",properties:{date:{type:"string"}},required:["date"],additionalProperties:false},
    strict:true
  },
  {
    type:"function", name:"get_free_blocks",
    description:"Read explicit free-time blocks from the user context.",
    parameters:{type:"object",properties:{day:{type:"string"}},required:["day"],additionalProperties:false},
    strict:true
  },
  {
    type:"function", name:"get_goal_status",
    description:"Read current Phase 1 goal progress from the user context.",
    parameters:{type:"object",properties:{},additionalProperties:false},
    strict:true
  },
  {
    type:"function", name:"propose_plan_change",
    description:"Propose a timetable/task change. Never silently apply it.",
    parameters:{
      type:"object",
      properties:{
        title:{type:"string"},reason:{type:"string"},date:{type:"string"},
        time:{type:"string"},task:{type:"string"}
      },
      required:["title","reason","date","time","task"],additionalProperties:false
    },
    strict:true
  },
  {
    type:"function", name:"propose_reminder",
    description:"Propose a reminder. Never silently create it.",
    parameters:{
      type:"object",properties:{text:{type:"string"},time:{type:"string"}},
      required:["text","time"],additionalProperties:false
    },
    strict:true
  }
];

const SYSTEM=`You are Rasia AI inside SECRET BASE OF RASIA, Phase 1.
You are a personal planning intelligence, not a generic chatbot.

LANGUAGE:
Understand Sinhala, Singlish/transliterated Sinhala and English.
Reply in the user's language/style. Mixed language is okay.
Examples: "ada mata monawada karanna oni?", "heta physics 2h plan ekak denna", "mage free time eka kohomada use karanne?"

YOUR JOB:
1. Understand what Rasia actually wants.
2. Read the supplied timetable, free blocks, goals, study system, changes and completion state.
3. Give concrete plans with realistic times and priorities.
4. Help with A/L Physics, Chemistry and Combined Maths study workflow.
5. Help organize SPS, Rivex, coding and personal projects.
6. When a timetable change or reminder is useful, PROPOSE it; never pretend it was saved.
7. Never expose secrets or API keys.
8. Do not make every free minute work. Protect school, recovery and healthy sleep.
9. If a request is unclear, make the best reasonable interpretation and say what you assumed.
10. For a teen, do not encourage chronic sleep deprivation.

STUDY SYSTEM:
Class -> Main Note -> Weekly Recall -> Quiz -> Mistakes -> Retry.

RESPONSE STYLE:
Practical, concise, friendly. Use bullets/tables/times when useful.
When asked "what should I do now?", produce the best next 1-3 actions from context, not generic advice.`;

function jsonText(x){try{return JSON.stringify(x).slice(0,50000)}catch{return "{}"}}
function execute(name,args,ctx){
  if(name==="get_today_schedule"){
    const date=new Date(args.date+"T12:00:00");
    const day=date.toLocaleDateString("en-US",{weekday:"long"});
    return {date:args.date,day,events:(ctx.timetable?.events||[]).filter(e=>e[0]===day),free:(ctx.timetable?.free_blocks||{})[day]||[]};
  }
  if(name==="get_free_blocks") return {day:args.day,free:(ctx.timetable?.free_blocks||{})[args.day]||[]};
  if(name==="get_goal_status") return {goals:ctx.goals||[]};
  if(name==="propose_plan_change") return {requires_user_approval:true,type:"plan_change",...args};
  if(name==="propose_reminder") return {requires_user_approval:true,type:"reminder",...args};
  return {error:"unknown tool"};
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS"){res.status(204).end();return}
  if(req.method!=="POST"){res.status(405).json({error:"POST only"});return}
  if(!process.env.OPENAI_API_KEY){res.status(503).json({error:"OPENAI_API_KEY is not configured in Vercel Environment Variables."});return}

  const {message,history=[],context={}}=req.body||{};
  if(!message){res.status(400).json({error:"message is required"});return}

  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const prior=Array.isArray(history)?history.slice(-12).map(x=>({
      role:x.role==="user"?"user":"assistant",
      content:String(x.text||"").slice(0,6000)
    })):[];
    let input=[
      {role:"developer",content:SYSTEM+"\n\nCURRENT USER CONTEXT:\n"+jsonText(context)},
      ...prior,
      {role:"user",content:String(message).slice(0,10000)}
    ];

    let response=await client.responses.create({
      model:MODEL,
      input,
      tools,
      tool_choice:"auto"
    });

    const proposals=[];
    for(let round=0;round<3;round++){
      const calls=(response.output||[]).filter(x=>x.type==="function_call");
      if(!calls.length) break;

      const outputs=[];
      for(const call of calls){
        let args={};
        try{args=JSON.parse(call.arguments||"{}")}catch{}
        const result=execute(call.name,args,context);
        if(result.requires_user_approval) proposals.push(result);
        outputs.push({
          type:"function_call_output",
          call_id:call.call_id,
          output:JSON.stringify(result)
        });
      }
      input=[...input,...response.output,...outputs];
      response=await client.responses.create({
        model:MODEL,input,tools,tool_choice:"auto"
      });
    }

    res.status(200).json({
      response:response.output_text||"I couldn't produce a response.",
      proposals,
      model:MODEL
    });
  }catch(err){
    console.error(err);
    res.status(500).json({
      error:"AI request failed.",
      detail:process.env.NODE_ENV==="development"?err.message:"Check the Vercel Function logs."
    });
  }
}
