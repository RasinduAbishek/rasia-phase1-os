const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={page:"dashboard",data:{},completed:JSON.parse(localStorage.getItem("r_completed")||"{}"),goals:JSON.parse(localStorage.getItem("r_goals")||"null"),changes:JSON.parse(localStorage.getItem("r_changes")||"null"),reminders:JSON.parse(localStorage.getItem("r_reminders")||"[]")};
const start=new Date("2026-09-14T00:00:00"), end=new Date("2026-12-31T23:59:59");

async function load(){const files=["timetable","study","config"];for(const f of files)state.data[f]=await fetch(`data/${f}.json`).then(r=>r.json());if(!state.goals)state.goals=await fetch("data/goals.json").then(r=>r.json());if(!state.changes)state.changes=await fetch("data/changes.json").then(r=>r.json());}
function save(){localStorage.setItem("r_completed",JSON.stringify(state.completed));localStorage.setItem("r_goals",JSON.stringify(state.goals));localStorage.setItem("r_changes",JSON.stringify(state.changes));localStorage.setItem("r_reminders",JSON.stringify(state.reminders))}
function todayISO(){let d=new Date();return d.toISOString().slice(0,10)}
function fmtDate(d){return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
function phaseDay(){const now=new Date();return Math.max(0,Math.floor((now-start)/86400000)+1)}
function toast(t){let x=document.createElement("div");x.className="toast";x.textContent=t;document.body.append(x);setTimeout(()=>x.remove(),2400)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function render(){
  $$("#sidebar nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===state.page));
  const fn={dashboard:dashboard,daily:daily,weekly:weekly,monthly:monthly,free:free,study:studyPage,goals:goalsPage,changes:changesPage,reminders:remindersPage,settings:settingsPage}[state.page];
  $("#content").innerHTML=fn();
  bindPage();
}
function dashboard(){
 const done=Object.values(state.completed).filter(Boolean).length, total=Object.keys(state.completed).length;
 const left=Math.max(0,Math.ceil((end-new Date())/86400000));
 return `<section class="hero"><div class="eyebrow">SYSTEM ONLINE • DAY ${phaseDay()}</div><h1>Build the system.<br>Then execute it.</h1><p class="muted">Phase 1 runs <b>14 Sep → 31 Dec 2026</b>. This workspace tracks study, business, coding, free time, changes and reminders.</p></section>
 <div class="grid grid4" style="margin-top:16px">
 <div class="card"><div class="label">Days remaining</div><div class="stat">${left}</div></div>
 <div class="card"><div class="label">Phase day</div><div class="stat">${phaseDay()}</div></div>
 <div class="card"><div class="label">Tasks checked</div><div class="stat">${done}</div></div>
 <div class="card"><div class="label">Goal items</div><div class="stat">${state.goals.length}</div></div></div>
 <div class="grid grid2" style="margin-top:16px"><div class="card"><h2>Today</h2>${todayTasks()}</div><div class="card"><h2>Goal pulse</h2>${goalMini()}</div></div>`;
}
function todayTasks(){
 const day=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
 const slots=state.data.timetable.weekly[day].fixed;
 return slots.slice(-5).map((x,i)=>taskRow(todayISO()+"-"+day+"-"+i,x[2])).join("");
}
function taskRow(id,label){
 const checked=!!state.completed[id];
 return `<label class="task ${checked?"done":""}"><input type="checkbox" data-task="${escapeHtml(id)}" ${checked?"checked":""}><span>${escapeHtml(label)}</span></label>`;
}
function goalMini(){return state.goals.map(g=>`<div style="margin:12px 0"><div class="week-title"><span>${escapeHtml(g.name)}</span><span class="mono">${g.progress}${g.unit==="LKR"?"":"/100"}</span></div><div class="bar"><i style="width:${g.unit==="LKR"?Math.min(100,g.progress/g.target*100):g.progress}%"></i></div></div>`).join("")}
function daily(){
 const day=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()], slots=state.data.timetable.weekly[day].fixed;
 return `<div class="week-title"><div><div class="eyebrow">DAILY CONTROL</div><h1>${day}</h1><p class="muted">${fmtDate(new Date())} • ${slots.length} planned blocks</p></div><span class="pill">PHASE DAY ${phaseDay()}</span></div>
 <div class="grid grid2"><div class="card"><h2>Schedule</h2><div class="timeline">${slots.map(x=>`<div class="slot"><b>${x[0]}–${x[1]}</b><span>${escapeHtml(x[2])}</span></div>`).join("")}</div></div>
 <div class="card"><h2>Daily execution</h2>${slots.map((x,i)=>taskRow(todayISO()+"-"+day+"-"+i,x[2])).join("")}</div></div>`;
}
function weekly(){
 return `<div class="eyebrow">WEEKLY COMMAND</div><h1>Weekly timetable</h1><p class="muted">Fixed commitments + execution blocks. Edit the JSON later if your class times change.</p>
 <div class="grid grid2">${Object.entries(state.data.timetable.weekly).map(([day,d])=>`<div class="card day-card"><div class="week-title"><h2>${day}</h2><span class="pill">${d.free_hours}h usable*</span></div><div class="timeline">${d.fixed.map(x=>`<div class="slot"><b>${x[0]}–${x[1]}</b><span>${escapeHtml(x[2])}</span></div>`).join("")}</div></div>`).join("")}</div>
 <p class="muted" style="font-size:10px">*Usable-hour figures are planning estimates, not promises. Protect sleep, meals and recovery.</p>`;
}
function monthly(){
 let out=`<div class="eyebrow">PHASE CALENDAR</div><h1>Monthly timetable</h1><p class="muted">Phase period: 14 September to 31 December 2026.</p>`;
 for(let m=8;m<=11;m++){let first=new Date(2026,m,1), last=new Date(2026,m+1,0);out+=`<div class="card" style="margin-top:16px"><h2>${first.toLocaleString("en",{month:"long"})} 2026</h2><div class="month">${["MON","TUE","WED","THU","FRI","SAT","SUN"].map(x=>`<div class="calhead">${x}</div>`).join("")}`;
 let offset=(first.getDay()+6)%7;for(let i=0;i<offset;i++)out+=`<div></div>`;
 for(let n=1;n<=last.getDate();n++){let d=new Date(2026,m,n), iso=d.toISOString().slice(0,10), inside=d>=start&&d<=end, today=iso===todayISO();out+=`<div class="calday ${inside?"phase-day":""} ${today?"today":""}"><span class="num">${n}</span>${inside?`<span class="dot">P1</span>`:""}</div>`}
 out+=`</div></div>`}return out;
}
function free(){
 return `<div class="eyebrow">TIME BUDGET</div><h1>Free-time map</h1><p class="muted">A practical estimate after fixed school/class/travel blocks. These values are editable in <code>data/timetable.json</code>.</p>
 <div class="grid grid3">${Object.entries(state.data.timetable.weekly).map(([d,x])=>`<div class="card"><div class="label">${d}</div><div class="stat">${x.free_hours}h</div><p class="muted">usable planning time</p></div>`).join("")}</div>
 <div class="card" style="margin-top:16px"><h2>Priority split for available time</h2><table class="table"><tr><th>Area</th><th>Starting allocation</th><th>Rule</th></tr><tr><td>A/L</td><td>40%</td><td>Highest academic priority</td></tr><tr><td>SPS</td><td>25%</td><td>Systems + business support</td></tr><tr><td>Money</td><td>15%</td><td>Only ethical, age-appropriate work</td></tr><tr><td>Tech / Rivex</td><td>15%</td><td>Coding + products</td></tr><tr><td>Fitness / personal</td><td>5%</td><td>Consistency, not extremes</td></tr></table></div>`;
}
function studyPage(){
 return `<div class="eyebrow">LEARNING ENGINE</div><h1>Study OS</h1><div class="card"><h2>${escapeHtml(state.data.study.system)}</h2><p class="muted">The point is not just watching classes — every class should end in retrieval, testing and error correction.</p></div>
 <div class="grid grid3" style="margin-top:16px">${Object.entries(state.data.study.subjects).map(([s,steps])=>`<div class="card"><h2>${s}</h2>${steps.map((x,i)=>`<div class="task"><span class="pill">${String(i+1).padStart(2,"0")}</span><span>${escapeHtml(x)}</span></div>`).join("")}</div>`).join("")}</div>`;
}
function goalsPage(){
 return `<div class="eyebrow">MISSION CONTROL</div><h1>Goals</h1><div class="grid grid2">${state.goals.map(g=>`<div class="card"><div class="week-title"><div><h2>${escapeHtml(g.name)}</h2><span class="pill">${g.area}</span></div><b class="mono">${g.unit==="LKR"?"LKR ":""}${g.progress}${g.unit==="LKR"?` / ${g.target}`:"%"}</b></div><input class="goalrange" data-goal="${g.id}" type="range" min="0" max="${g.unit==="LKR"?g.target:100}" step="${g.unit==="LKR"?1000:1}" value="${g.progress}" style="width:100%"><div class="bar"><i style="width:${g.unit==="LKR"?Math.min(100,g.progress/g.target*100):g.progress}%"></i></div></div>`).join("")}</div>`;
}
function changesPage(){
 return `<div class="eyebrow">VERSION HISTORY</div><h1>Changes</h1><div class="card"><h2>Add a change</h2><div class="inputrow"><input id="changeTitle" placeholder="What changed?"><input id="changeDate" type="date" value="${todayISO()}"></div><textarea id="changeDetails" rows="3" placeholder="Reason / new decision / timetable adjustment..."></textarea><button class="primary" id="addChange">ADD TO LOG</button></div>
 <div class="card" style="margin-top:16px"><h2>Change log</h2><table class="table">${state.changes.slice().reverse().map(c=>`<tr><td class="mono">${c.date}</td><td><b>${escapeHtml(c.title)}</b><br><span class="muted">${escapeHtml(c.details)}</span></td></tr>`).join("")}</table><button class="smallbtn" id="exportChanges">EXPORT changes.json</button></div>`;
}
function remindersPage(){
 return `<div class="eyebrow">AUTOMATION</div><h1>Reminders</h1><div class="card"><p class="muted">Browser reminders work only while this page/browser environment allows notifications. For reliable scheduled notifications, use a dedicated reminder service/ChatGPT automation.</p><button class="smallbtn" id="notifyBtn">ENABLE NOTIFICATIONS</button><div class="inputrow"><input id="remText" placeholder="Reminder text"><input id="remTime" type="datetime-local"><button class="smallbtn" id="addReminder">ADD</button></div></div>
 <div class="card" style="margin-top:16px"><h2>Saved reminders</h2>${state.reminders.length?state.reminders.map((r,i)=>`<div class="task"><span class="pill">${new Date(r.time).toLocaleString()}</span><span>${escapeHtml(r.text)}</span><button class="smallbtn" data-rem="${i}">×</button></div>`).join(""):"<p class='muted'>No reminders yet.</p>"}</div>`;
}
function settingsPage(){
 return `<div class="eyebrow">SYSTEM SETTINGS</div><h1>Settings</h1><div class="grid grid2"><div class="card"><h2>Phase</h2><p><span class="muted">Start:</span> 14 Sep 2026<br><span class="muted">End:</span> 31 Dec 2026</p><button class="smallbtn" id="lockBtn">LOCK SYSTEM</button></div><div class="card"><h2>Data</h2><p class="muted">Progress, goals, changes and reminders are stored locally in this browser.</p><button class="smallbtn" id="exportAll">EXPORT LOCAL DATA</button></div></div>`;
}
function bindPage(){
 $$("[data-task]").forEach(x=>x.onchange=()=>{state.completed[x.dataset.task]=x.checked;save();render()});
 $$(".goalrange").forEach(x=>x.oninput=()=>{let g=state.goals.find(a=>a.id===x.dataset.goal);g.progress=+x.value;save();render()});
 $("#addChange")?.addEventListener("click",()=>{let t=$("#changeTitle").value.trim(),d=$("#changeDetails").value.trim();if(!t)return toast("Add a title");state.changes.push({date:$("#changeDate").value||todayISO(),title:t,details:d});save();render();toast("Change added")});
 $("#exportChanges")?.addEventListener("click",()=>download("changes.json",state.changes));
 $("#notifyBtn")?.addEventListener("click",async()=>{if(!("Notification"in window))return toast("Notifications unsupported");let p=await Notification.requestPermission();toast(p==="granted"?"Notifications enabled":"Permission not granted")});
 $("#addReminder")?.addEventListener("click",()=>{let t=$("#remText").value.trim(),time=$("#remTime").value;if(!t||!time)return toast("Enter text + time");state.reminders.push({text:t,time});save();render();toast("Reminder saved")});
 $$("[data-rem]").forEach(b=>b.onclick=()=>{state.reminders.splice(+b.dataset.rem,1);save();render()});
 $("#lockBtn")?.addEventListener("click",lock);
 $("#exportAll")?.addEventListener("click",()=>download("rasia-local-data.json",{completed:state.completed,goals:state.goals,changes:state.changes,reminders:state.reminders}));
}
function download(name,obj){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
function lock(){localStorage.removeItem("r_auth");location.reload()}
function tickReminders(){const now=Date.now();state.reminders.forEach(r=>{if(!r.done&&new Date(r.time).getTime()<=now){r.done=true;if("Notification"in window&&Notification.permission==="granted")new Notification("RASIA Reminder",{body:r.text});}});save()}
function initNav(){$$("#sidebar nav button").forEach(b=>b.onclick=()=>{state.page=b.dataset.page;render();if(innerWidth<900)document.body.classList.remove("open")});$("#menuBtn").onclick=()=>document.body.classList.toggle("open")}
function login(){
 const u=$("#user").value,p=$("#pass").value;
 if(u===state.data.config.username && sha256(p)===state.data.config.password_sha256){localStorage.setItem("r_auth","1");$("#login").classList.add("hidden");$("#app").classList.remove("hidden");initNav();render();startClock();setInterval(tickReminders,15000)}else toast("Login failed");
}
function sha256(str){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(str)).then?null:""} // replaced below
async function doLogin(){const u=$("#user").value,p=$("#pass").value;const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(p));const h=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");if(u===state.data.config.username&&h===state.data.config.password_sha256){localStorage.setItem("r_auth","1");$("#login").classList.add("hidden");$("#app").classList.remove("hidden");initNav();render();startClock();setInterval(tickReminders,15000)}else toast("Login failed")}
function startClock(){setInterval(()=>{$("#liveClock").textContent=" • "+new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})},1000)}
(async()=>{await load();$("#loginBtn").onclick=doLogin;if(localStorage.getItem("r_auth")==="1"){ $("#login").classList.add("hidden");$("#app").classList.remove("hidden");initNav();render();startClock();setInterval(tickReminders,15000)}})();
