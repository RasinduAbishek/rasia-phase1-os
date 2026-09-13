import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors({origin: process.env.CORS_ORIGIN || "*"}));
app.use(express.json({limit:"1mb"}));

const client = process.env.OPENAI_API_KEY ? new OpenAI({apiKey:process.env.OPENAI_API_KEY}) : null;
const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const PORT = Number(process.env.PORT || 3000);

const tools = [
  {type:"function",name:"get_today_schedule",description:"Read the user's current day schedule from the context.",parameters:{type:"object",properties:{date:{type:"string"}},required:["date"],additionalProperties:false},strict:true},
  {type:"function",name:"get_free_blocks",description:"Find the user's explicit free blocks and help allocate them.",parameters:{type:"object",properties:{day:{type:"string"}},required:["day"],additionalProperties:false},strict:true},
  {type:"function",name:"get_goal_status",description:"Read current Phase 1 goal progress.",parameters:{type:"object",properties:{},additionalProperties:false},strict:true},
  {type:"function",name:"propose_plan_change",description:"Propose a timetable/task change. Never silently apply it. The frontend must ask the user for approval.",parameters:{type:"object",properties:{title:{type:"string"},reason:{type:"string"},date:{type:"string"},time:{type:"string"},task:{type:"string"}},required:["title","reason","date","time","task"],additionalProperties:false},strict:true},
  {type:"function",name:"propose_reminder",description:"Propose a reminder. Never silently create it.",parameters:{type:"object",properties:{text:{type:"string"},time:{type:"string"}},required:["text","time"],additionalProperties:false},strict:true}
];

const SYSTEM = `You are Rasia AI, the personal planning intelligence inside SECRET BASE OF RASIA, Phase 1.
Language: respond naturally in the language the user uses. Understand Sinhala, Singlish/transliterated Sinhala, and English. If the user writes mixed language, you may answer mixed language.
Role: planning + study coach + project organizer. Be practical, concise, encouraging, and honest.
Context includes timetable, free blocks, A/L study system, goals, changes, reminders and local completion state.
Priority: protect school/class commitments, avoid impossible schedules, preserve healthy sleep for a teenager, and avoid turning every free minute into work.
Study: use Class -> Main Note -> Weekly Recall -> Quiz -> Mistakes -> Retry.
When useful, create a concrete plan with times and priorities.
You can call read-only tools for schedule/goals. You may propose reminders or changes, but NEVER claim that a mutation happened. Any change/reminder requires explicit user approval in the UI.
Do not expose API keys or secrets. Do not claim the GitHub Pages frontend login is strong security.
For cybersecurity requests, keep guidance ethical and legal.`;

function contextText(c={}) {
  return JSON.stringify(c).slice(0,45000);
}

function executeTool(name,args,ctx){
  if(name==="get_today_schedule"){
    const day = new Date(args.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"});
    return {day,date:args.date,events:(ctx.timetable?.events||[]).filter(e=>e[0]===day),free:(ctx.timetable?.free_blocks||{})[day]||[]};
  }
  if(name==="get_free_blocks"){
    return {day:args.day,free:(ctx.timetable?.free_blocks||{})[args.day]||[]};
  }
  if(name==="get_goal_status") return {goals:ctx.goals||[]};
  if(name==="propose_plan_change") return {proposal:true,type:"plan_change",...args,requires_user_approval:true};
  if(name==="propose_reminder") return {proposal:true,type:"reminder",...args,requires_user_approval:true};
  return {error:"Unknown tool"};
}

app.get("/health",(req,res)=>res.json({ok:true,service:"rasia-super-ai",model:MODEL,tools:tools.map(t=>t.name)}));

app.post("/api/chat",async(req,res)=>{
  if(!client) return res.status(503).json({error:"OPENAI_API_KEY is not configured on the backend."});
  const {message,history=[],context={}}=req.body||{};
  if(!message) return res.status(400).json({error:"message is required"});
  try{
    const prior = history.slice(-12).map(x=>({role:x.role==="user"?"user":"assistant",content:String(x.text||"").slice(0,5000)}));
    let input = [
      {role:"developer",content:SYSTEM+"\nUSER CONTEXT:\n"+contextText(context)},
      ...prior,
      {role:"user",content:message}
    ];
    let response = await client.responses.create({model:MODEL,input,tools,tool_choice:"auto"});
    const proposals=[];
    let guard=0;
    while(response.output?.some(x=>x.type==="function_call") && guard<3){
      guard++;
      const outputs=[];
      for(const call of response.output.filter(x=>x.type==="function_call")){
        let args={};try{args=JSON.parse(call.arguments||"{}")}catch{}
        const result=executeTool(call.name,args,context);
        if(result.proposal) proposals.push(result);
        outputs.push({type:"function_call_output",call_id:call.call_id,output:JSON.stringify(result)});
      }
      response = await client.responses.create({model:MODEL,input:[...input,...response.output,...outputs],tools,tool_choice:"auto"});
    }
    res.json({response:response.output_text||"I couldn't produce a response.",proposals,model:MODEL});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"AI request failed.",detail:err?.message||String(err)});
  }
});

app.listen(PORT,()=>console.log(`Rasia AI backend running on :${PORT}`));
