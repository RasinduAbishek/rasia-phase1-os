import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app=express();
app.use(cors());
app.use(express.json({limit:"32kb"}));

app.get("/health",(req,res)=>res.json({ok:true,service:"Rasia AI backend"}));

app.post("/api/chat",async(req,res)=>{
  const {message,context=""}=req.body||{};
  if(!message) return res.status(400).json({error:"message required"});
  // Keep the API key ONLY on the server. Set OPENAI_API_KEY in backend/.env.
  if(!process.env.OPENAI_API_KEY){
    return res.json({reply:"AI backend is installed but no API key is configured. The frontend offline planner can still work."});
  }
  try{
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||"gpt-5-mini",
        input:[
          {role:"system",content:[{type:"input_text",text:"You are Rasia's Phase 1 planning assistant. Help with scheduling, studying, project planning and ethical technology learning. Do not encourage sleep deprivation. Do not facilitate illegal hacking. Keep replies practical and concise."}]},
          {role:"user",content:[{type:"input_text",text:`Context:\\n${context}\\n\\nUser:\\n${message}`}]}
        ]
      })
    });
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data});
    const reply=data.output_text||"No response text returned.";
    res.json({reply});
  }catch(e){res.status(500).json({error:"AI request failed"});}
});
const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`Rasia AI backend on http://localhost:${port}`));
