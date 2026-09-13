const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const S={page:"dashboard",config:null,timetable:null,goals:null,study:null,changes:null,completed:{},reminders:[],chat:[]};
const START=new Date("2026-09-14T00:00:00"), END=new Date("2026-12-31T23:59:59");

async function boot(){
 for(const f of ["config","timetable","goals","study","changes"]){S[f]=await fetch(`data/${f}.json`).then(r=>r.json())}
 S.completed=JSON.parse(localStorage.getItem("rasia_completed")||"{}");
 S.goals=JSON.parse(localStorage.getItem("rasia_goals")||"null")||S.goals;
 S.changes=JSON.parse(localStorage.getItem("rasia_changes")||"null")||S.changes;
 S.reminders=JSON.parse(localStorage.getItem("rasia_reminders")||"[]");
 S.chat=JSON.parse(localStorage.getItem("rasia_chat")||"[]");
 $("#loginBtn").onclick=login;
 $("#loginPass").onkeydown=e=>{if(e.key==="Enter")login()};
 $("#logout").onclick=()=>{localStorage.removeItem("rasia_auth");location.reload()};
 $("#mobileMenu").onclick=()=>document.body.classList.toggle("menu-open");
 if(localStorage.getItem("rasia_auth")==="1")enter();
}
async function login(){
 const u=$("#loginUser").value.trim(), p=$("#loginPass").value;
 const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(p));
 const h=[...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,"0")).join("");
 if(u===S.config.username&&h===S.config.password_sha256){localStorage.setItem("rasia_auth","1");enter()}
 else {$("#loginMsg").textContent="Invalid login.";$("#loginMsg").className="login-msg"}
}
function enter(){$("#login").classList.add("hidden");$("#app").classList.remove("hidden");nav();clock();render();setInterval(reminderTick,15000)}
function nav(){$$("[data-page]").forEach(b=>b.onclick=()=>{S.page=b.dataset.page;render();document.body.classList.remove("menu-open")})}
function save(){localStorage.setItem("rasia_completed",JSON.stringify(S.completed));localStorage.setItem("rasia_goals",JSON.stringify(S.goals));localStorage.setItem("rasia_changes",JSON.stringify(S.changes));localStorage.setItem("rasia_reminders",JSON.stringify(S.reminders));localStorage.setItem("rasia_chat",JSON.stringify(S.chat))}
function iso(d){return d.toISOString().slice(0,10)}
function today(){return iso(new Date())}
function dayName(d=new Date()){return["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]}
function phaseDay(){return Math.max(0,Math.min(109,Math.floor((new Date()-START)/86400000)+1))}
function daysLeft(){return Math.max(0,Math.ceil((END-new Date())/86400000))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(t){const x=document.createElement("div");x.className="toast";x.textContent=t;$("#toast").append(x);setTimeout(()=>x.remove(),2400)}
function render(){
 $$("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===S.page));
 $("#phaseProgress").textContent=`DAY ${phaseDay()} / 109`;
 $("#sideProg").style.width=`${phaseDay()/109*100}%`;$("#sideDays").textContent=`${daysLeft()} days remaining`;
 const map={dashboard:dashboard,calendar:calendar,daily:daily,weekly:weekly,monthly:monthly,free:free,study:studyPage,goals:goalsPage,reminders:remindersPage,changes:changesPage,ai:aiPage};
 $("#main").innerHTML=map[S.page]();
 bind();
}
function dashboard(){
 const done=Object.values(S.completed).filter(Boolean).length;
 return `<div class="hero"><span class="phase-chip">PHASE 1 · ${phaseDay()}/109</span><h1>Think it.<br><span>Schedule it.</span><br>Execute it.</h1><p>One control center for your A/L work, SPS operations, Rivex development, projects, free time, changes and reminders.</p></div>
 <div class="grid g4" style="margin-top:16px"><div class="card kpi"><div class="label">Phase days left</div><div class="stat">${daysLeft()}</div><p class="muted">until 31 Dec</p></div><div class="card kpi"><div class="label">Phase progress</div><div class="stat">${Math.round(phaseDay()/109*100)}%</div><div class="bar"><i style="width:${phaseDay()/109*100}%"></i></div></div><div class="card kpi"><div class="label">Tasks completed</div><div class="stat">${done}</div><p class="muted">saved locally</p></div><div class="card kpi"><div class="label">AI status</div><div class="stat" style="font-size:20px">READY</div><p class="muted">offline planner + optional AI API</p></div></div>
 <div class="grid g2" style="margin-top:16px"><div class="card"><div class="section-head"><div><div class="eyebrow">TODAY</div><h2>${dayName()}</h2></div><span class="pill">${today()}</span></div>${dailyTasks().join("")}</div><div class="card"><div class="section-head"><div><div class="eyebrow">MISSION</div><h2>Goal pulse</h2></div><button class="btn" data-go="goals">Open</button></div>${goalMini()}</div></div>`;
}
function dailyTasks(){
 const dn=dayName(), ev=S.timetable.events.filter(e=>e[0]===dn);
 return ev.slice(0,7).map((e,i)=>taskRow(`${today()}-${i}`,e[3])).join("");
}
function taskRow(id,label){let c=!!S.completed[id];return `<label class="task ${c?"done":""}"><input type="checkbox" data-task="${esc(id)}" ${c?"checked":""}><span>${esc(label)}</span></label>`}
function goalMini(){return S.goals.map(g=>{let p=g.unit==="LKR"?Math.min(100,g.value/g.target*100):Math.min(100,g.value);return `<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:11px"><span>${esc(g.title)}</span><span class="mono">${g.unit==="LKR"?`Rs. ${Number(g.value).toLocaleString()}`:`${g.value}%`}</span></div><div class="bar" style="margin-top:7px"><i style="width:${p}%"></i></div></div>`}).join("")}
function calendar(){
 const times=[];for(let h=6;h<=23;h++)times.push(`${String(h).padStart(2,"0")}:00`);
 let head=`<div class="week-grid"><div class="dayhead">TIME</div>${S.timetable.days.map(d=>`<div class="dayhead">${d.slice(0,3).toUpperCase()}<b>${new Date().getDay()===S.timetable.days.indexOf(d)+1?"":" "}</b></div>`).join("")}`;
 let tc=`<div class="timecol">${times.map(t=>`<div class="timecell">${t}</div>`).join("")}</div>`;
 let cols=S.timetable.days.map(d=>`<div class="daycol">${S.timetable.events.filter(e=>e[0]===d).map(eventHtml).join("")}${S.timetable.free_blocks[d].map(f=>freeEvent(f)).join("")}</div>`).join("");
 return `<div class="section-head"><div><div class="eyebrow">TIME GRID</div><h1>Calendar timetable</h1><p class="muted">Google-calendar-style week view. Colour = type. Drag/edit can be added later without changing the data model.</p></div><span class="pill">06:00 — 24:00</span></div><div class="calendar-wrap">${head}${tc}${cols}</div>`;
}
function mins(t){let [h,m]=t.split(":").map(Number);return h*60+m}
function eventHtml(e){let top=(mins(e[1])-360)/60*54, ht=(mins(e[2])-mins(e[1]))/60*54;return `<div class="event ${e[5]}" style="top:${top}px;height:${Math.max(30,ht-3)}px"><b>${esc(e[3])}</b><small>${esc(e[4])}<br>${e[1]}–${e[2]}</small></div>`}
function freeEvent(f){let top=(mins(f[0])-360)/60*54,ht=(mins(f[1])-mins(f[0]))/60*54;return `<div class="event free" style="top:${top}px;height:${Math.max(26,ht-3)}px"><b>FREE</b><small>${esc(f[2])}</small></div>`}
function daily(){
 const dn=dayName(), ev=S.timetable.events.filter(e=>e[0]===dn), fr=S.timetable.free_blocks[dn];
 return `<div class="section-head"><div><div class="eyebrow">DAILY CONTROL</div><h1>${dn}</h1><p class="muted">${today()} · execution mode</p></div><span class="pill">DAY ${phaseDay()}</span></div><div class="grid g2"><div class="card"><h2>Timeline</h2><div class="timeline">${ev.map(e=>`<div class="slot color-${e[5]}"><time>${e[1]}–${e[2]}</time><div><strong>${esc(e[3])}</strong><small>${esc(e[4])}</small></div></div>`).join("")}</div></div><div class="card"><h2>Free + execution</h2>${fr.map(f=>`<div class="slot color-free" style="margin-bottom:7px"><time>${f[0]}–${f[1]}</time><div><strong>FREE BLOCK</strong><small>${esc(f[2])}</small></div></div>`).join("")}${ev.map((e,i)=>taskRow(`${today()}-${i}`,e[3])).join("")}</div></div>`;
}
function weekly(){
 return `<div class="section-head"><div><div class="eyebrow">WEEKLY COMMAND</div><h1>Weekly timetable</h1><p class="muted">The full weekly rhythm, including fixed commitments and flexible blocks.</p></div></div><div class="grid g2">${S.timetable.days.map(d=>`<div class="card"><div class="section-head"><h2>${d}</h2><span class="pill">${S.timetable.events.filter(e=>e[0]===d).length} blocks</span></div><div class="timeline">${S.timetable.events.filter(e=>e[0]===d).map(e=>`<div class="slot color-${e[5]}"><time>${e[1]}–${e[2]}</time><div><strong>${esc(e[3])}</strong><small>${esc(e[4])}</small></div></div>`).join("")}</div><div style="margin-top:9px">${S.timetable.free_blocks[d].map(f=>`<span class="pill" style="margin:3px 3px 0 0">FREE ${f[0]}–${f[1]}</span>`).join("")}</div></div>`).join("")}</div>`;
}
function monthly(){
 let out=`<div class="section-head"><div><div class="eyebrow">PHASE CALENDAR</div><h1>September → December 2026</h1><p class="muted">Every day inside Phase 1 is marked. Use the calendar to see the long horizon.</p></div></div>`;
 for(let m=8;m<=11;m++){let first=new Date(2026,m,1),last=new Date(2026,m+1,0),off=(first.getDay()+6)%7;out+=`<div class="card" style="margin-bottom:16px"><h2>${first.toLocaleString("en",{month:"long"})} 2026</h2><div class="month">${["MON","TUE","WED","THU","FRI","SAT","SUN"].map(x=>`<div class="mh">${x}</div>`).join("")}${Array(off).fill("<div></div>").join("")}`;
 for(let n=1;n<=last.getDate();n++){let d=new Date(2026,m,n),inside=d>=START&&d<=END,t=iso(d)===today(),dn=dayName(d),tags=S.timetable.events.filter(e=>e[0]===dn).slice(0,2).map(e=>e[3]).join(" · ");out+=`<div class="md ${inside?"in":""} ${t?"today":""}"><span class="num">${n}</span>${inside?`<div class="phase">P1 · ${Math.floor((d-START)/86400000)+1}</div><div class="tag">${esc(tags.slice(0,24))}</div>`:""}</div>`}out+=`</div></div>`}return out;
}
function free(){
 return `<div class="section-head"><div><div class="eyebrow">TIME BUDGET</div><h1>Free-time engine</h1><p class="muted">Free blocks are visible instead of pretending every minute is productive.</p></div></div><div class="grid g3">${S.timetable.days.map(d=>`<div class="card"><h2>${d}</h2>${S.timetable.free_blocks[d].map(f=>`<div class="slot color-free" style="margin-bottom:7px"><time>${f[0]}–${f[1]}</time><div><strong>FREE</strong><small>${esc(f[2])}</small></div></div>`).join("")}</div>`).join("")}</div><div class="card" style="margin-top:16px"><h2>Starting priority allocation</h2><div class="grid g3">${[["A/L","40%","Highest academic priority"],["SPS","25%","Systems + business support"],["Money","15%","Ethical, age-appropriate work"],["Tech / Rivex","15%","Coding + products"],["Fitness / Personal","5%","Consistency + recovery"]].map(x=>`<div><div style="display:flex;justify-content:space-between"><b>${x[0]}</b><span class="pill">${x[1]}</span></div><p class="muted" style="font-size:10px">${x[2]}</p></div>`).join("")}</div></div>`;
}
function studyPage(){
 return `<div class="section-head"><div><div class="eyebrow">LEARNING ENGINE</div><h1>Study OS</h1><p class="muted">Class → note → recall → test → mistakes → retry.</p></div></div><div class="card"><div class="grid g3">${S.study.subjects&&Object.entries(S.study.subjects).map(([s,steps])=>`<div><h2>${s}</h2>${steps.map((x,i)=>`<div class="task"><span class="pill">${String(i+1).padStart(2,"0")}</span><span>${esc(x)}</span></div>`).join("")}</div>`).join("")}</div></div>`;
}
function goalsPage(){
 return `<div class="section-head"><div><div class="eyebrow">MISSION CONTROL</div><h1>Goals</h1><p class="muted">Move these only when real progress happens.</p></div></div><div class="grid g2">${S.goals.map(g=>{let max=g.target,p=Math.min(100,g.value/max*100);return `<div class="card"><div class="section-head"><div><h2>${esc(g.title)}</h2><span class="pill">${esc(g.area)}</span></div><b class="mono">${g.unit==="LKR"?"Rs. "+Number(g.value).toLocaleString():g.value+"%"}</b></div><input class="goalrange" data-goal="${g.id}" type="range" min="0" max="${max}" step="${g.unit==="LKR"?1000:1}" value="${g.value}" style="width:100%"><div class="bar" style="margin-top:12px"><i style="width:${p}%"></i></div></div>`}).join("")}</div>`;
}
function changesPage(){
 return `<div class="section-head"><div><div class="eyebrow">VERSION HISTORY</div><h1>Changes</h1><p class="muted">If the plan changes, log why. The OS evolves with you.</p></div></div><div class="grid g2"><div class="card"><h2>Add change</h2><div class="formrow"><input id="ct" class="field" placeholder="Change title"><input id="cd" class="field" type="date" value="${today()}"></div><textarea id="cx" class="field" rows="5" placeholder="What changed? Why? What should the timetable do differently?"></textarea><button id="addChange" class="btn primary" style="width:100%;margin-top:8px">ADD CHANGE</button></div><div class="card"><h2>Change log</h2>${S.changes.slice().reverse().map(c=>`<div class="change-item"><small>${c.date}</small><br><b>${esc(c.title)}</b><p>${esc(c.details)}</p></div>`).join("")}<button id="exportChanges" class="btn" style="margin-top:10px">EXPORT changes.json</button></div></div>`;
}
function remindersPage(){
 return `<div class="section-head"><div><div class="eyebrow">AUTOMATION</div><h1>Reminders</h1><p class="muted">Browser notifications + saved reminder list.</p></div></div><div class="card"><div class="formrow"><input id="rt" class="field" placeholder="Reminder text"><input id="rd" class="field" type="datetime-local"><button id="addRem" class="btn primary">ADD</button></div><button id="notify" class="btn">ENABLE BROWSER NOTIFICATIONS</button></div><div class="card" style="margin-top:16px"><h2>Saved</h2>${S.reminders.length?S.reminders.map((r,i)=>`<div class="task"><span class="pill">${new Date(r.time).toLocaleString()}</span><span>${esc(r.text)}</span><button class="btn" data-rem="${i}" style="margin-left:auto">×</button></div>`).join(""):"<p class='muted'>No reminders yet.</p>"}</div>`;
}
function aiPage(){
 const welcome=S.chat.length?S.chat:([{role:"ai",text:"Hey Rasia 👋 I’m your Phase 1 planning assistant. Try: “What should I do today?”, “Make me a paper session”, “How much free time do I have?”, or “Add a change.”"}]);
 return `<div class="section-head"><div><div class="eyebrow">PERSONAL COPILOT</div><h1>Rasia AI</h1><p class="muted">Local planner intelligence now. Optional real AI backend can be connected later without exposing an API key.</p></div><span class="pill">OFFLINE CORE · READY</span></div><div class="chat"><div class="chat-side"><button id="newChat" class="btn new">＋ New chat</button><h3>Quick actions</h3><div class="suggestions"><button class="btn quick">Today</button><button class="btn quick">Paper session</button><button class="btn quick">Free time</button><button class="btn quick">Weekly review</button></div><p class="hint">The local assistant reads your timetable and phase dates. It does not send your private data anywhere.</p></div><div class="chat-main"><div id="messages" class="messages">${welcome.map(m=>`<div class="msg ${m.role==="user"?"user":""}"><div class="avatar">${m.role==="user"?"YOU":"AI"}</div><div class="bubble">${esc(m.text).replace(/\\n/g,"<br>")}</div></div>`).join("")}</div><div class="composer"><textarea id="chatInput" rows="2" placeholder="Tell Rasia AI what you want to plan..."></textarea><button id="send">↑</button></div></div></div>`;
}
function bind(){
 $$("[data-task]").forEach(x=>x.onchange=()=>{S.completed[x.dataset.task]=x.checked;save();render()});
 $$(".goalrange").forEach(x=>x.oninput=()=>{let g=S.goals.find(g=>g.id===x.dataset.goal);g.value=+x.value;save();render()});
 $$("[data-go]").forEach(x=>x.onclick=()=>{S.page=x.dataset.go;render()});
 $("#addChange")?.addEventListener("click",()=>{let title=$("#ct").value.trim(),details=$("#cx").value.trim();if(!title)return toast("Add a title");S.changes.push({date:$("#cd").value||today(),title,details});save();render();toast("Change added")});
 $("#exportChanges")?.addEventListener("click",()=>download("changes.json",S.changes));
 $("#notify")?.addEventListener("click",async()=>{if(!("Notification"in window))return toast("Browser notifications unsupported");let p=await Notification.requestPermission();toast(p==="granted"?"Notifications enabled":"Permission denied")});
 $("#addRem")?.addEventListener("click",()=>{let text=$("#rt").value.trim(),time=$("#rd").value;if(!text||!time)return toast("Enter text + time");S.reminders.push({text,time,done:false});save();render();toast("Reminder added")});
 $$("[data-rem]").forEach(x=>x.onclick=()=>{S.reminders.splice(+x.dataset.rem,1);save();render()});
 $("#newChat")?.addEventListener("click",()=>{S.chat=[];save();render()});
 $$(".quick").forEach(x=>x.onclick=()=>sendChat(x.textContent));
 $("#send")?.addEventListener("click",()=>sendChat($("#chatInput").value));
 $("#chatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat(e.target.value)}});
}
function sendChat(text){
 text=(text||"").trim();if(!text)return;S.chat.push({role:"user",text});let reply=localAI(text);S.chat.push({role:"ai",text:reply});save();render();setTimeout(()=>{$("#messages")?.scrollTo({top:999999,behavior:"smooth"})},30)
}
function localAI(q){
 const l=q.toLowerCase(),dn=dayName(),ev=S.timetable.events.filter(e=>e[0]===dn),free=S.timetable.free_blocks[dn];
 if(l.includes("today")||l.includes("what should"))return `Today is ${dn}. Start with your fixed commitments, then protect the highest-priority free block for A/L. Your current planned blocks are ${ev.map(e=>e[3]).join(", ")}. Free blocks: ${free.map(f=>f[0]+"–"+f[1]).join(", ")}.`;
 if(l.includes("paper"))return `Paper-session mode: 1) 10 min setup, 2) timed paper, 3) mark it, 4) put every error into the mistake book, 5) retry the missed questions, 6) record the score. I would schedule this in your next suitable free block rather than sacrificing sleep.`;
 if(l.includes("free time"))return `For ${dn}, your editable free blocks are: ${free.map(f=>f[0]+"–"+f[1]+" ("+f[2]+")").join("; ")}. Use flexible time for recovery first, then A/L, SPS or Rivex according to the week's priorities.`;
 if(l.includes("weekly")||l.includes("review"))return `Weekly review checklist: class coverage → main notes → recall → papers/quizzes → mistake book → retry → update goals → log timetable changes → prepare next week.`;
 if(l.includes("change"))return `Open Changes in the sidebar and log the change with its date, reason and the new decision. The log stays in this browser until you export it.`;
 if(l.includes("remind"))return `Open Reminders and add the time + message. Browser notifications require permission and are not a substitute for a phone alarm.`;
 return `I can help plan your Phase 1. Try “today”, “paper session”, “free time”, “weekly review”, “reminder”, or “change”. For full generative AI, connect the optional backend using your own server-side API key — never put the key in this frontend.`;
}
function reminderTick(){const now=Date.now();let changed=false;S.reminders.forEach(r=>{if(!r.done&&new Date(r.time).getTime()<=now){r.done=true;changed=true;if("Notification"in window&&Notification.permission==="granted")new Notification("RASIA Reminder",{body:r.text})}});if(changed)save()}
function clock(){setInterval(()=>{$("#clock").textContent="· "+new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})},1000)}
function download(name,obj){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
boot();
