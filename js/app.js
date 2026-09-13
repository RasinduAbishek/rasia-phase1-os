const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const S={page:"dashboard",calMode:"weekly",selectedDate:new Date(),config:null,timetable:null,goals:null,study:null,changes:null,completed:{},reminders:[],chat:[],backendOnline:false};
const START=new Date("2026-09-14T00:00:00"),END=new Date("2026-12-31T23:59:59");

async function boot(){
  try{
    for(const f of ["config","timetable","goals","study","changes"]){S[f]=await fetch(`data/${f}.json`).then(r=>r.json())}
    S.completed=JSON.parse(localStorage.getItem("rasia_completed")||"{}");
    S.goals=JSON.parse(localStorage.getItem("rasia_goals")||"null")||S.goals;
    S.changes=JSON.parse(localStorage.getItem("rasia_changes")||"null")||S.changes;
    S.reminders=JSON.parse(localStorage.getItem("rasia_reminders")||"[]");
    S.chat=JSON.parse(localStorage.getItem("rasia_chat")||"[]");
    $("#loginBtn").onclick=login;$("#loginPass").onkeydown=e=>{if(e.key==="Enter")login()};
    $("#logout").onclick=()=>{localStorage.removeItem("rasia_auth");location.reload()};
    $("#mobileMenu").onclick=()=>document.body.classList.toggle("menu-open");
    if(localStorage.getItem("rasia_auth")==="1")enter();
    checkBackend();
  }catch(e){$("#loginMsg").textContent="System files could not load. Use GitHub Pages or a local web server.";console.error(e)}
}
async function login(){
  const u=$("#loginUser").value.trim(),p=$("#loginPass").value;
  const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(p));
  const h=[...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,"0")).join("");
  if(u===S.config.username&&h===S.config.password_sha256){localStorage.setItem("rasia_auth","1");enter()}
  else{$("#loginMsg").textContent="Access denied. Check username/password."}
}
function enter(){ $("#login").classList.add("hidden");$("#app").classList.remove("hidden");nav();clock();render();setInterval(reminderTick,15000)}
function nav(){$$("[data-page]").forEach(b=>b.onclick=()=>{S.page=b.dataset.page;render();document.body.classList.remove("menu-open")})}
function save(){localStorage.setItem("rasia_completed",JSON.stringify(S.completed));localStorage.setItem("rasia_goals",JSON.stringify(S.goals));localStorage.setItem("rasia_changes",JSON.stringify(S.changes));localStorage.setItem("rasia_reminders",JSON.stringify(S.reminders));localStorage.setItem("rasia_chat",JSON.stringify(S.chat))}
function iso(d){return new Date(d).toISOString().slice(0,10)}
function today(){return iso(new Date())}
function dayName(d=new Date()){return["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(d).getDay()]}
function phaseDay(){let n=Math.floor((new Date()-START)/86400000)+1;return Math.max(0,Math.min(109,n))}
function daysLeft(){return Math.max(0,Math.ceil((END-new Date())/86400000))}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(t){const x=document.createElement("div");x.className="toast";x.textContent=t;$("#toast").append(x);setTimeout(()=>x.remove(),2800)}
function clock(){const tick=()=>$("#clock").textContent=new Date().toLocaleString("en-LK",{weekday:"short",hour:"2-digit",minute:"2-digit"});tick();setInterval(tick,30000)}
function render(){
  $$("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===S.page));
  $("#phaseProgress").textContent=`DAY ${phaseDay()} / 109`;$("#sideProg").style.width=`${phaseDay()/109*100}%`;$("#sideDays").textContent=`${daysLeft()} days remaining`;
  const map={dashboard,calendar,daily,weekly,monthly,alltime,free,study:studyPage,goals:goalsPage,reminders:remindersPage,changes:changesPage,ai:aiPage,help:helpPage,secret:secretPage};
  $("#main").innerHTML=map[S.page]();bind();
}
function taskRow(id,label){let c=!!S.completed[id];return `<label class="task ${c?"done":""}"><input type="checkbox" data-task="${esc(id)}" ${c?"checked":""}><span>${esc(label)}</span></label>`}
function dailyTasks(){return S.timetable.events.filter(e=>e[0]===dayName()).slice(0,8).map((e,i)=>taskRow(`${today()}-${i}`,e[3])).join("")}
function goalMini(){return S.goals.map(g=>{let p=g.unit==="LKR"?Math.min(100,g.value/g.target*100):Math.min(100,g.value);return `<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:11px"><span>${esc(g.title)}</span><span class="mono">${g.unit==="LKR"?`Rs. ${Number(g.value).toLocaleString()}`:`${g.value}%`}</span></div><div class="bar" style="margin-top:7px"><i style="width:${p}%"></i></div></div>`}).join("")}
function dashboard(){
  const done=Object.values(S.completed).filter(Boolean).length;
  return `<div class="hero"><span class="phase-chip">SECRET BASE · PHASE 1 · ${phaseDay()}/109</span><h1>Think it.<br><span>Schedule it.</span><br>Execute it.</h1><p>Your private-style command center for A/L, SPS, Rivex, coding, free time, changes, reminders and an AI planner. Sinhala + English conversations supported when the AI backend is connected.</p></div>
  <div class="grid g4"><div class="card kpi"><div class="label">PHASE DAYS LEFT</div><div class="stat">${daysLeft()}</div><p class="muted">until 31 Dec</p></div>
  <div class="card kpi"><div class="label">PHASE PROGRESS</div><div class="stat">${Math.round(phaseDay()/109*100)}%</div><div class="bar"><i style="width:${phaseDay()/109*100}%"></i></div></div>
  <div class="card kpi"><div class="label">TASKS DONE</div><div class="stat">${done}</div><p class="muted">local progress</p></div>
  <div class="card kpi"><div class="label">RASIA AI</div><div class="stat" style="font-size:20px">${S.backendOnline?"ONLINE":"LOCAL"}</div><p class="muted">${S.backendOnline?"Advanced planner + tools":"Offline fallback ready"}</p></div></div>
  <div class="grid g2" style="margin-top:14px"><div class="card"><div class="section-head"><div><div class="eyebrow">TODAY</div><h2>${dayName()}</h2></div><span class="pill">${today()}</span></div>${dailyTasks()}</div>
  <div class="card"><div class="section-head"><div><div class="eyebrow">MISSION PULSE</div><h2>Goals</h2></div><button class="btn" data-go="goals">OPEN</button></div>${goalMini()}</div></div>
  <div class="grid g3" style="margin-top:14px"><div class="card"><div class="eyebrow">QUICK AI</div><h2>Plan my day</h2><p class="muted">Open Rasia AI and ask naturally.</p><button class="btn primary" data-go="ai">ASK RASIA AI →</button></div><div class="card"><div class="eyebrow">CALENDAR</div><h2>All time views</h2><p class="muted">Daily · Weekly · Monthly · All Time</p><button class="btn" data-go="calendar">OPEN CALENDAR</button></div><div class="card"><div class="eyebrow">PRIVATE FEEL</div><h2>Secret Base</h2><p class="muted">Help, rules, architecture and privacy notes.</p><button class="btn" data-go="secret">OPEN BASE</button></div></div>`;
}

function mins(t){let[a,b]=t.split(":").map(Number);return a*60+b}
function eventHtml(e){let top=(mins(e[1])-360)/60*54,ht=(mins(e[2])-mins(e[1]))/60*54;return `<div class="event ${e[5]}" style="top:${top}px;height:${Math.max(30,ht-3)}px"><b>${esc(e[3])}</b><small>${esc(e[4])}<br>${e[1]}–${e[2]}</small></div>`}
function freeEvent(f){let top=(mins(f[0])-360)/60*54,ht=(mins(f[1])-mins(f[0]))/60*54;return `<div class="event free" style="top:${top}px;height:${Math.max(26,ht-3)}px"><b>FREE</b><small>${esc(f[2])}</small></div>`}
function weeklyCalendar(){const times=[];for(let h=6;h<=23;h++)times.push(`${String(h).padStart(2,"0")}:00`);let head=`<div class="week-grid"><div class="dayhead">TIME</div>${S.timetable.days.map(d=>`<div class="dayhead">${d.slice(0,3).toUpperCase()}</div>`).join("")}`;let tc=`<div class="timecol">${times.map(t=>`<div class="timecell">${t}</div>`).join("")}</div>`;let cols=S.timetable.days.map(d=>`<div class="daycol">${S.timetable.events.filter(e=>e[0]===d).map(eventHtml).join("")}${S.timetable.free_blocks[d].map(freeEvent).join("")}</div>`).join("");return `<div class="calendar-wrap">${head}${tc}${cols}</div>`}
function dailyCalendar(){const d=new Date(S.selectedDate),dn=dayName(d),ev=S.timetable.events.filter(e=>e[0]===dn),fr=S.timetable.free_blocks[dn];return `<div class="calendar-toolbar"><button class="btn" data-shift="-1">←</button><input id="calDate" type="date" class="field" value="${iso(d)}"><button class="btn" data-shift="1">→</button><span class="pill">${dn}</span></div><div class="card"><div class="timeline">${ev.map(e=>`<div class="slot color-${e[5]}"><time>${e[1]}–${e[2]}</time><div><strong>${esc(e[3])}</strong><small>${esc(e[4])}</small></div></div>`).join("")}${fr.map(f=>`<div class="slot color-free"><time>${f[0]}–${f[1]}</time><div><strong>FREE</strong><small>${esc(f[2])}</small></div></div>`).join("")}</div></div>`}
function monthlyCalendar(){let out=`<div class="card"><div class="section-head"><div><h2>September → December 2026</h2><p class="muted">Phase 1 long-horizon calendar.</p></div><span class="pill">109 DAYS</span></div><div class="month-grid">`;for(let m=8;m<=11;m++){let first=new Date(2026,m,1),last=new Date(2026,m+1,0),off=(first.getDay()+6)%7;out+=`<div class="month-card"><h3>${first.toLocaleString("en",{month:"long"})} 2026</h3><div class="month">${["MON","TUE","WED","THU","FRI","SAT","SUN"].map(x=>`<div class="mh">${x}</div>`).join("")}${Array(off).fill("<div></div>").join("")}`;for(let n=1;n<=last.getDate();n++){let d=new Date(2026,m,n),inside=d>=START&&d<=END,t=iso(d)===today(),dn=dayName(d),tags=S.timetable.events.filter(e=>e[0]===dn).slice(0,1).map(e=>e[3]).join("");out+=`<div class="md ${inside?"in":""} ${t?"today":""}"><span class="num">${n}</span>${inside?`<div class="phase">P1 · ${Math.floor((d-START)/86400000)+1}</div><div class="tag">${esc(tags.slice(0,20))}</div>`:""}</div>`}out+=`</div></div>`}return out+`</div></div>`}
function allTimeCalendar(){let out=`<div class="grid g2">`;for(let m=8;m<=11;m++){let first=new Date(2026,m,1),last=new Date(2026,m+1,0);let inDays=0;for(let n=1;n<=last.getDate();n++){let d=new Date(2026,m,n);if(d>=START&&d<=END)inDays++}out+=`<div class="card"><div class="section-head"><div><div class="eyebrow">PHASE 1</div><h2>${first.toLocaleString("en",{month:"long"})} 2026</h2></div><span class="pill">${inDays} PHASE DAYS</span></div><div class="timeline">${Array.from({length:last.getDate()},(_,i)=>i+1).map(n=>{let d=new Date(2026,m,n);if(d<START||d>END)return "";let dn=dayName(d),events=S.timetable.events.filter(e=>e[0]===dn).slice(0,3);return `<div class="slot ${iso(d)===today()?"today-slot":""}"><time>${iso(d)}</time><div><strong>${dn}</strong><small>${events.map(e=>esc(e[3])).join(" · ")||"Flexible / recovery"}</small></div></div>`}).join("")}</div></div>`}return out+`</div>`}
function calendar(){return `<div class="section-head"><div><div class="eyebrow">CALENDAR CONTROL</div><h1>Calendar</h1><p class="muted">Daily · Weekly · Monthly · All Time. One place for the full Phase 1 map.</p></div><span class="pill">${S.calMode.toUpperCase()}</span></div><div class="calendar-tabs">${["daily","weekly","monthly","alltime"].map(m=>`<button class="cal-tab ${S.calMode===m?"active":""}" data-cal="${m}">${m==="alltime"?"ALL TIME":m.toUpperCase()}</button>`).join("")}</div><div class="calendar-view">${S.calMode==="daily"?dailyCalendar():S.calMode==="monthly"?monthlyCalendar():S.calMode==="alltime"?allTimeCalendar():weeklyCalendar()}</div>`}
function daily(){const dn=dayName(),ev=S.timetable.events.filter(e=>e[0]===dn),fr=S.timetable.free_blocks[dn];return `<div class="section-head"><div><div class="eyebrow">DAILY CONTROL</div><h1>${dn}</h1><p class="muted">${today()} · execution mode</p></div><span class="pill">DAY ${phaseDay()}</span></div><div class="grid g2"><div class="card"><h2>Timeline</h2><div class="timeline">${ev.map(e=>`<div class="slot color-${e[5]}"><time>${e[1]}–${e[2]}</time><div><strong>${esc(e[3])}</strong><small>${esc(e[4])}</small></div></div>`).join("")}</div></div><div class="card"><h2>Free + execution</h2>${fr.map(f=>`<div class="slot color-free"><time>${f[0]}–${f[1]}</time><div><strong>FREE BLOCK</strong><small>${esc(f[2])}</small></div></div>`).join("")}${ev.map((e,i)=>taskRow(`${today()}-${i}`,e[3])).join("")}</div></div>`}
function weekly(){return `<div class="section-head"><div><div class="eyebrow">WEEKLY COMMAND</div><h1>Weekly timetable</h1><p class="muted">Fixed commitments + free blocks.</p></div></div><div class="grid g2">${S.timetable.days.map(d=>`<div class="card"><div class="section-head"><h2>${d}</h2><span class="pill">${S.timetable.events.filter(e=>e[0]===d).length} blocks</span></div><div class="timeline">${S.timetable.events.filter(e=>e[0]===d).map(e=>`<div class="slot color-${e[5]}"><time>${e[1]}–${e[2]}</time><div><strong>${esc(e[3])}</strong><small>${esc(e[4])}</small></div></div>`).join("")}</div><div style="margin-top:9px">${S.timetable.free_blocks[d].map(f=>`<span class="pill" style="margin:3px 3px 0 0">FREE ${f[0]}–${f[1]}</span>`).join("")}</div></div>`).join("")}</div>`}
function monthly(){S.calMode="monthly";return calendar()}function alltime(){S.calMode="alltime";return calendar()}
function free(){return `<div class="section-head"><div><div class="eyebrow">TIME BUDGET</div><h1>Free-time engine</h1><p class="muted">The OS shows usable blocks instead of pretending every minute is available.</p></div></div><div class="grid g3">${S.timetable.days.map(d=>`<div class="card"><h2>${d}</h2>${S.timetable.free_blocks[d].map(f=>`<div class="slot color-free"><time>${f[0]}–${f[1]}</time><div><strong>FREE</strong><small>${esc(f[2])}</small></div></div>`).join("")}</div>`).join("")}</div>`}
function studyPage(){return `<div class="section-head"><div><div class="eyebrow">LEARNING ENGINE</div><h1>Study OS</h1><p class="muted">Class → Main Note → Weekly Recall → Quiz → Mistakes → Retry.</p></div></div><div class="card"><div class="grid g3">${S.study.subjects&&Object.entries(S.study.subjects).map(([s,steps])=>`<div><h2>${s}</h2>${steps.map((x,i)=>`<div class="task"><span class="pill">${String(i+1).padStart(2,"0")}</span><span>${esc(x)}</span></div>`).join("")}</div>`).join("")}</div></div>`}
function goalsPage(){return `<div class="section-head"><div><div class="eyebrow">MISSION CONTROL</div><h1>Goals</h1><p class="muted">Move progress only when real progress happens.</p></div></div><div class="grid g2">${S.goals.map(g=>{let p=Math.min(100,g.value/g.target*100);return `<div class="card"><div class="section-head"><div><h2>${esc(g.title)}</h2><span class="pill">${esc(g.area)}</span></div><b class="mono">${g.unit==="LKR"?"Rs. "+Number(g.value).toLocaleString():g.value+"%"}</b></div><input class="goalrange" data-goal="${g.id}" type="range" min="0" max="${g.target}" step="${g.unit==="LKR"?1000:1}" value="${g.value}" style="width:100%"><div class="bar" style="margin-top:12px"><i style="width:${p}%"></i></div></div>`}).join("")}</div>`}
function changesPage(){return `<div class="section-head"><div><div class="eyebrow">VERSION HISTORY</div><h1>Changes</h1><p class="muted">The plan can evolve. Log what changed and why.</p></div></div><div class="grid g2"><div class="card"><h2>Add change</h2><div class="formrow"><input id="ct" class="field" placeholder="Change title"><input id="cd" class="field" type="date" value="${today()}"></div><textarea id="cx" class="field" rows="5" placeholder="What changed? Why? What should the timetable/AI know?"></textarea><button id="addChange" class="btn primary" style="width:100%;margin-top:8px">ADD CHANGE</button></div><div class="card"><h2>Change log</h2>${S.changes.slice().reverse().map(c=>`<div class="change-item"><small>${esc(c.date)}</small><br><b>${esc(c.title)}</b><p>${esc(c.details)}</p></div>`).join("")}<button id="exportChanges" class="btn" style="margin-top:10px">EXPORT changes.json</button></div></div>`}
function remindersPage(){return `<div class="section-head"><div><div class="eyebrow">AUTOMATION</div><h1>Reminders</h1><p class="muted">Browser reminders are local to this device/browser.</p></div></div><div class="card"><div class="formrow"><input id="rt" class="field" placeholder="Reminder text"><input id="rd" class="field" type="datetime-local"><button id="addRem" class="btn primary">ADD</button></div><button id="notify" class="btn" style="margin-top:10px">ENABLE BROWSER NOTIFICATIONS</button></div><div class="card" style="margin-top:14px"><h2>Saved reminders</h2>${S.reminders.length?S.reminders.map((r,i)=>`<div class="task"><span class="pill">${new Date(r.time).toLocaleString()}</span><span>${esc(r.text)}</span><button class="btn" data-delrem="${i}" style="margin-left:auto">×</button></div>`).join(""):`<p class="muted">No reminders yet.</p>`}</div>`}

function aiPage(){
  const msgs=S.chat.length?S.chat.map((m,i)=>m.role==="proposal"
  ? `<div class="bubble ai"><b>${esc(m.text)}</b><div class="action-actions"><button class="btn primary" data-approve="${i}">APPROVE</button><button class="btn" data-reject="${i}">REJECT</button></div></div>`
  : `<div class="bubble ${m.role==="user"?"user":"ai"}">${esc(m.text)}</div>`).join(""):`<div class="bubble ai">Ayubowan Rasia 👋<br><br>I’m your Phase 1 planning AI. You can type in Sinhala, Singlish or English.<br><br>Try: <b>“ada mata monawada karanna oni?”</b> / “plan tomorrow” / “mage free time eka kohomada use karanne?”</div>`;
  return `<div class="section-head"><div><div class="eyebrow">INTELLIGENCE LAYER</div><h1>Rasia AI</h1><p class="muted">Friendly Sinhala + Singlish + English AI buddy · context-aware · tool-ready.</p></div><span class="pill">${S.backendOnline?"BACKEND ONLINE":"OFFLINE FALLBACK"}</span></div>
  <div class="chat-shell"><div class="card chat-card"><div class="chat-head"><div><b>RASIA AI CORE</b><div class="muted">${S.backendOnline?"Connected to AI backend":"Local rule engine — backend optional"}</div></div><button id="clearChat" class="btn">CLEAR</button></div><div id="chatMessages" class="chat-messages">${msgs}</div><div class="quick"><button class="btn" data-prompt="ada mata monawada karanna oni?">Today plan</button><button class="btn" data-prompt="mama tomorrow full plan ekak hadaganna oni">Tomorrow</button><button class="btn" data-prompt="mage free time blocks tika balala best work plan ekak denna">Free time</button><button class="btn" data-prompt="weekly review karanna mata help karanna">Weekly review</button></div><div class="chat-input"><textarea id="chatInput" class="field" placeholder="Type in Sinhala / Singlish / English..."></textarea><button id="sendAI" class="btn primary">SEND →</button></div></div>
  <div class="card ai-side"><h3>AI capabilities</h3><div class="ai-feature"><b>01 · Understand</b><small>Sinhala, Singlish and English intent.</small></div><div class="ai-feature"><b>02 · Context</b><small>Reads timetable, goals, study system, changes and local progress.</small></div><div class="ai-feature"><b>03 · Plan</b><small>Can propose daily/weekly study and project plans.</small></div><div class="ai-feature"><b>04 · Tools</b><small>Backend can read schedule/free time/goals and propose actions.</small></div><div class="ai-feature"><b>05 · Safety</b><small>Mutating actions use approval flow instead of silently changing your plan.</small></div><div class="ai-feature"><b>06 · Offline</b><small>Basic planner still works if backend/API is unavailable.</small></div></div></div>`;
}
function helpPage(){return `<div class="section-head"><div><div class="eyebrow">HELP FOR RASIA</div><h1>Help for Rasia</h1><p class="muted">Simple guide to using the free personal edition.</p></div></div><div class="help-grid"><div class="card help-card"><h3>Calendar</h3><p>Use Calendar for four views:</p><ul><li>Daily — one day timeline</li><li>Weekly — full timetable grid</li><li>Monthly — Sep to Dec Phase map</li><li>All Time — every Phase 1 day</li></ul></div><div class="card help-card"><h3>Rasia AI</h3><p>Talk naturally. Sinhala, Singlish or English. Examples:</p><ul><li>“ada plan eka denna”</li><li>“tomorrow 2 hours physics plan”</li><li>“free time eka use karala Rivex task ekak danna”</li><li>“weekly review karamu”</li></ul></div><div class="card help-card"><h3>Progress</h3><p>Goals, completed tasks, reminders and chat history are saved in this browser using local storage.</p></div><div class="card help-card"><h3>Changes</h3><p>If class times or priorities change, add a change. AI can use the change as context on the next planning request.</p></div><div class="card help-card"><h3>AI Backend</h3><p>GitHub Pages can host the frontend. The advanced AI backend needs a separate Node.js server. Never put an OpenAI API key in frontend JavaScript.</p></div><div class="card help-card"><h3>Free Edition</h3><p>The UI and offline planner are free. If you connect an external AI API, that API may have its own usage charges.</p></div></div>`}
function secretPage(){return `<div class="secret-banner"><div class="eyebrow">PRIVATE FEEL · NOT A SECURITY PROMISE</div><h1>SECRET BASE <span>OF RASIA</span></h1><p class="muted">A private-style command center for your Phase 1 mission. The frontend login is a gate, not enterprise authentication.</p></div><div class="grid g2"><div class="card"><h2>Base status</h2><div class="vault-row"><b>Phase</b><small>14 Sep → 31 Dec 2026</small></div><div class="vault-row"><b>Calendar</b><small>Daily / Weekly / Monthly / All Time</small></div><div class="vault-row"><b>AI</b><small>${S.backendOnline?"Backend connected":"Offline fallback"}</small></div><div class="vault-row"><b>Storage</b><small>Browser local storage for personal progress</small></div><div class="vault-row"><b>Frontend</b><small>Static + GitHub Pages compatible</small></div></div><div class="card"><h2>Base rules</h2><p class="muted">1. Protect API keys.<br>2. Do not put SPS customer data into a public frontend repo.<br>3. Use approval before AI changes the plan.<br>4. Log important timetable changes.<br>5. Keep the system useful, not overcomplicated.</p></div></div>`}

function localAI(msg){
  const m=msg.toLowerCase().trim();
  if(/^(hi|hello|hey|ayo|ayubowan|kohomada|කොහොමද)/.test(m))
    return `Ayubowan bn 👋\n\nRasia AI local mode eke innawa 😄. Mata plan, study, free time, SPS/Rivex tasks wage dewal kiyanna puluwan.`;
  if(/(thanks|thank you|tnx|thx|stuti|ස්තුති)/.test(m))
    return `Anytime bn 😎\n\nNext task eka kiyanna, api eka set karamu.`;
  if(/(today|ada|dawas|අද)/.test(m))
    return `Ada ${dayName()} bn.\n\nNext FREE block eka balala highest-priority A/L task eka start karanna. Daily view eken fixed commitments check karanna.`;
  if(/(tomorrow|heta|හෙට)/.test(m))
    return `Heta ${dayName(new Date(Date.now()+86400000))} bn.\n\nFixed commitments → A/L priority → short project/coding block → review kiyala structure ekak hondai. Backend online unama mama full context ekka exact plan ekak hadannam.`;
  if(/(free|nidahas|free time|වේලාව)/.test(m))
    return `Free blocks tika already OS eke thiyenawa bn. “Free Time” page eka open karala loku block eka highest-impact task ekata use karanna. Random tasks walata yanna epa.`;
  if(/(weekly|review|sathiya|සතිය)/.test(m))
    return `Weekly review eka simple karamu: A/L progress → mistakes → SPS/Rivex progress → unfinished work → next-week top 3.`;
  return `Mata basic planning/chat requests offline mode eke handle karanna puluwan bn. Full natural Sinhala/Singlish conversation + timetable/goal reasoning walata AI backend eka connect karanna one.`;
}
async function sendAI(msg){
  msg=msg.trim();if(!msg)return;
  S.chat.push({role:"user",text:msg});save();render();setTimeout(()=>$("#chatMessages")?.scrollTo(0,999999),20);
  if(!S.backendOnline){const r=localAI(msg);S.chat.push({role:"assistant",text:r});save();render();return}
  const box=$("#chatMessages");const loading=document.createElement("div");loading.className="bubble ai";loading.textContent="Thinking…";box.append(loading);box.scrollTop=box.scrollHeight;
  try{
    const r=await fetch(resolveApi("/api/chat"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg,history:S.chat.slice(-12),context:buildContext()})});
    if(!r.ok)throw new Error(await r.text());
    const data=await r.json();loading.remove();
    S.chat.push({role:"assistant",text:data.response||"No response."});
    if(data.proposals?.length){
      data.proposals.forEach((p)=>{
        const label=p.type==="reminder"?`Reminder: ${p.text} @ ${p.time}`:`Plan change: ${p.title} · ${p.date} · ${p.time}`;
        S.chat.push({role:"proposal",text:`ACTION PROPOSAL\n${label}\nApproval is required before anything is changed.`});
      });
    }
    save();render();
  }catch(e){loading.remove();S.chat.push({role:"assistant",text:"Backend error. Switching to local planner.\n\n"+localAI(msg)});save();render()}
}
function buildContext(){return {today:today(),day:dayName(),phaseDay:phaseDay(),daysLeft:daysLeft(),timetable:S.timetable,goals:S.goals,study:S.study,changes:S.changes,completed:S.completed,reminders:S.reminders}}
function resolveApi(path){const custom=localStorage.getItem("rasia_api_base")||S.config?.ai?.api_base||"";return (custom?custom.replace(/\/$/,""):"")+path}
async function checkBackend(){try{const r=await fetch(resolveApi("/health"),{cache:"no-store"});S.backendOnline=r.ok;updateAIStatus()}catch{S.backendOnline=false;updateAIStatus()}}
function updateAIStatus(){const x=$("#aiBadge");if(x){x.textContent=S.backendOnline?"AI ONLINE":"AI LOCAL";x.style.color=S.backendOnline?"#55e59b":"#48e5ff"}}
function bind(){
  $$("[data-task]").forEach(x=>x.onchange=()=>{S.completed[x.dataset.task]=x.checked;save();render()});
  $$("[data-go]").forEach(x=>x.onclick=()=>{S.page=x.dataset.go;render()});
  $$("[data-cal]").forEach(x=>x.onclick=()=>{S.calMode=x.dataset.cal;render()});
  $$("[data-shift]").forEach(x=>x.onclick=()=>{S.selectedDate=new Date(S.selectedDate);S.selectedDate.setDate(S.selectedDate.getDate()+Number(x.dataset.shift));render()});
  $("#calDate")?.addEventListener("change",e=>{S.selectedDate=new Date(e.target.value+"T12:00:00");render()});
  $$(".goalrange").forEach(x=>x.oninput=()=>{let g=S.goals.find(a=>a.id===x.dataset.goal);g.value=Number(x.value);save()});
  $("#addChange")?.addEventListener("click",()=>{let title=$("#ct").value.trim(),details=$("#cx").value.trim();if(!title||!details)return toast("Add title + details.");S.changes.push({date:$("#cd").value||today(),title,details});save();render();toast("Change added.")});
  $("#exportChanges")?.addEventListener("click",()=>downloadJSON(S.changes,"changes.json"));
  $("#notify")?.addEventListener("click",async()=>{if(!("Notification"in window))return toast("Notifications are not supported here.");let p=await Notification.requestPermission();toast(p==="granted"?"Notifications enabled.":"Permission not granted.")});
  $("#addRem")?.addEventListener("click",()=>{let text=$("#rt").value.trim(),time=$("#rd").value;if(!text||!time)return toast("Add reminder + time.");S.reminders.push({text,time,done:false});save();render();toast("Reminder saved.")});
  $$("[data-delrem]").forEach(x=>x.onclick=()=>{S.reminders.splice(Number(x.dataset.delrem),1);save();render()});
  $$("[data-prompt]").forEach(x=>x.onclick=()=>{S.page="ai";render();$("#chatInput").value=x.dataset.prompt;sendAI(x.dataset.prompt)});
  $("#sendAI")?.addEventListener("click",()=>sendAI($("#chatInput").value));
  $("#chatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAI(e.target.value)}});
  $("#clearChat")?.addEventListener("click",()=>{S.chat=[];save();render()});
  $$("[data-approve]").forEach(x=>x.onclick=()=>{const i=Number(x.dataset.approve);const m=S.chat[i];if(!m)return;S.chat[i]={...m,text:m.text+"\\n\\n✓ Approved by Rasia. Apply the proposed change/reminder manually in the relevant module."};save();render();toast("Proposal approved — review/apply in the relevant module.")});
  $$("[data-reject]").forEach(x=>x.onclick=()=>{const i=Number(x.dataset.reject);const m=S.chat[i];if(!m)return;S.chat[i]={...m,text:m.text+"\\n\\n✕ Rejected by Rasia."};save();render();toast("Proposal rejected.")});
}
function downloadJSON(data,name){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
function reminderTick(){const now=Date.now();for(const r of S.reminders){if(!r.done&&new Date(r.time).getTime()<=now){r.done=true;if("Notification"in window&&Notification.permission==="granted")new Notification("Rasia Reminder",{body:r.text})}}save()}
boot();