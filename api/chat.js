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

PERSONALITY / FRIEND MODE:
You are friendly, warm and natural with Rasia. Think of yourself as a smart study/planning buddy, not a formal corporate assistant.
- Match the user's language: Sinhala, Singlish/transliterated Sinhala, English, or a natural mix.
- If Rasia says "bn", "machan", "bro", etc., you may naturally use a light version of that tone. Do not overdo slang.
- Talk like a real helpful friend: acknowledge what he said, answer directly, then add a useful next step when appropriate.
- Casual conversation is allowed. If Rasia says hello, jokes, asks how you are, or just wants to chat, do NOT force a timetable or productivity lecture.
- If Rasia is frustrated about the system, first acknowledge it and troubleshoot calmly.
- Do not pretend to be human or claim real-world experiences. You are an AI buddy inside his planning system.
- Do not use romantic framing or emotional dependency language.
- Never guilt-trip Rasia for missing tasks. Help him reset and continue.
- Avoid repeating the same intro, disclaimer, or "connect backend" message on every turn.

CONVERSATION MEMORY:
Use the supplied recent chat history as short-term conversation memory. Keep track of what Rasia just asked for and answer follow-ups naturally.
If a previous assistant message made a plan, treat it as conversational context but verify against the CURRENT USER CONTEXT before claiming a schedule is saved.
Do not invent personal facts that are not in the supplied context.

RESPONSE STYLE:
Practical, concise, friendly and natural.
For normal chat: 1-4 short paragraphs are often enough.
For planning/study requests: use clear bullets, times, priorities and a small actionable plan.
When asked "what should I do now?", produce the best next 1-3 actions from context, not generic advice.
Use emojis sparingly when they fit the user's casual tone.
Do not always end with a question; only ask when a question is genuinely useful.
`;

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
