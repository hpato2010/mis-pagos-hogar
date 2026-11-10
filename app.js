(() => {
'use strict';
const KEY='mis-pagos-hogar-v1';
const defs=[{id:'arriendo',name:'Arriendo',icon:'🏠',day:5,amount:0},{id:'comun',name:'Gasto común',icon:'🏢',day:10,amount:0},{id:'agua',name:'Agua',icon:'💧',day:15,amount:0},{id:'luz',name:'Luz',icon:'⚡',day:20,amount:0},{id:'gas',name:'Gas',icon:'🔥',day:25,amount:0}];
const $=s=>document.querySelector(s);
const today=()=>new Date();
const ym=(y,m)=>`${y}-${String(m+1).padStart(2,'0')}`;
const getParts=key=>key.split('-').map(Number);
const fmt=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
const formatDate=d=>new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'short',year:'numeric'}).format(d);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaultState=()=>({version:1,defaults:structuredClone(defs),months:{},notified:{}});
let state;
try{const loaded=JSON.parse(localStorage.getItem(KEY));state=loaded&&Array.isArray(loaded.defaults)&&typeof loaded.months==='object'&&loaded.months?loaded:defaultState()}catch{state=defaultState()}
let selected=new Date(today().getFullYear(),today().getMonth(),1), editingId=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{alert('No se pudo guardar. Revisa el almacenamiento de tu navegador.')}}
function keyFor(date=selected){return ym(date.getFullYear(),date.getMonth())}
function ensureMonth(key){
 if(!state.months[key]||typeof state.months[key]!=='object')state.months[key]={};
 for(const def of state.defaults){
  if(!state.months[key][def.id])state.months[key][def.id]={amount:def.amount,day:def.day,paid:false,paidAt:null};
 }
 return state.months[key];
}
function getDue(key,day){const [y,m]=getParts(key);return new Date(y,m-1,Math.min(day,new Date(y,m,0).getDate()),9,0,0)}
function daysUntil(d){const a=new Date();a.setHours(0,0,0,0);const b=new Date(d);b.setHours(0,0,0,0);return Math.round((b-a)/86400000)}
function badge(p,key){if(p.paid)return '<span class="status paid">✓ Pagado</span>';const days=daysUntil(getDue(key,p.day));const current=key===keyFor(today());if(current&&days<0)return '<span class="status late">Vencido</span>';if(current&&days<=2)return '<span class="status soon">Por vencer</span>';return '<span class="status">Pendiente</span>'}
function render(){
 const key=keyFor(), data=ensureMonth(key), entries=state.defaults.map(d=>({...d,p:data[d.id]}));
 const total=entries.reduce((s,x)=>s+Number(x.p.amount),0), paid=entries.filter(x=>x.p.paid).reduce((s,x)=>s+Number(x.p.amount),0), count=entries.filter(x=>x.p.paid).length;
 $('#monthTitle').textContent=new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric'}).format(selected);
 $('#monthBadge').textContent=key;
 $('#totalAmount').textContent=fmt(total);$('#paidAmount').textContent=fmt(paid);$('#pendingAmount').textContent=fmt(total-paid);
 $('#paidCount').textContent=`${count} de 5 cuentas pagadas`;$('#pendingCount').textContent=`${5-count} cuentas pendientes`;
 $('#bills').innerHTML=entries.map(x=>`<div class="bill"><div class="bill-icon">${x.icon}</div><div><div class="bill-name">${x.name}</div><div class="bill-meta">Vence ${formatDate(getDue(key,x.p.day))}</div><div style="margin-top:7px">${badge(x.p,key)}</div></div><div class="bill-right"><div class="amount">${fmt(x.p.amount)}</div><div class="tools"><button class="btn small" data-edit="${x.id}">✎ Editar</button><button class="btn small ${x.p.paid?'':'primary'}" data-toggle="${x.id}">${x.p.paid?'↶ Deshacer':'✓ Pagué'}</button></div></div></div>`).join('');
 renderHistory();renderAlerts();save();
}
function renderHistory(){
 const keys=Object.keys(state.months).sort().reverse();
 $('#history').innerHTML=keys.map(key=>{const data=ensureMonth(key),arr=state.defaults.map(x=>data[x.id]),sum=arr.reduce((a,p)=>a+Number(p.amount),0),paid=arr.filter(x=>x.paid).reduce((a,p)=>a+Number(p.amount),0);const [y,m]=getParts(key);const label=new Intl.DateTimeFormat('es-CL',{month:'short',year:'numeric'}).format(new Date(y,m-1,1));return `<tr><td>${escapeHTML(label)}</td><td>${fmt(sum)}</td><td>${fmt(paid)}</td><td>${fmt(sum-paid)}</td></tr>`}).join('');
}
function currentAlerts(){const k=keyFor(today()),data=ensureMonth(k);return state.defaults.map(x=>({def:x,p:data[x.id],date:getDue(k,data[x.id].day),key:k})).filter(x=>!x.p.paid&&daysUntil(x.date)<=2).sort((a,b)=>a.date-b.date)}
function renderAlerts(){const items=currentAlerts();$('#alerts').innerHTML=items.length?items.map(x=>{const days=daysUntil(x.date);const label=days<0?`Venció hace ${-days} día${days===-1?'':'s'}`:days===0?'Vence hoy':days===1?'Vence mañana':'Vence en 2 días';return `<div class="notice">${x.def.icon} <strong>${x.def.name}</strong><br>${label} · ${fmt(x.p.amount)}</div>`}).join(''):'<div class="notice ok">✓ No tienes vencimientos pendientes en los próximos 2 días.</div>'}
function checkNotifications(){if(!('Notification'in window)||Notification.permission!=='granted')return;let changes=false;for(const x of currentAlerts()){const id=`${x.key}/${x.def.id}`;if(state.notified[id])continue;try{new Notification(`Recordatorio: ${x.def.name}`,{body:`${fmt(x.p.amount)} · vence ${formatDate(x.date)}`,icon:'icon.svg',tag:id});state.notified[id]=new Date().toISOString();changes=true}catch{}}
 if(changes)save();
}
$('#bills').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),toggle=e.target.closest('[data-toggle]');if(edit){editingId=edit.dataset.edit;const d=state.defaults.find(x=>x.id===editingId),p=ensureMonth(keyFor())[editingId];$('#editTitle').textContent=`Editar ${d.name}`;$('#editSubtitle').textContent=new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric'}).format(selected);$('#editAmount').value=p.amount;$('#editDay').value=p.day;$('#editDialog').showModal();}if(toggle){const p=ensureMonth(keyFor())[toggle.dataset.toggle];p.paid=!p.paid;p.paidAt=p.paid?new Date().toISOString():null;render();}});
$('#editForm').addEventListener('submit',e=>{e.preventDefault();const amount=Number($('#editAmount').value),day=Number($('#editDay').value);if(!Number.isSafeInteger(amount)||amount<0||!Number.isInteger(day)||day<1||day>31)return alert('Ingresa un monto válido y un día entre 1 y 31.');const p=ensureMonth(keyFor())[editingId];p.amount=amount;p.day=day;$('#editDialog').close();render();});
$('#cancelEdit').onclick=()=>$('#editDialog').close();
$('#settingsBtn').onclick=()=>{const html=state.defaults.map(x=>`<div><strong style="font-size:13px">${x.icon} ${x.name}</strong><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:7px"><label class="field">Monto (CLP)<input name="amount-${x.id}" type="number" min="0" step="1" value="${x.amount}" required></label><label class="field">Día de pago<input name="day-${x.id}" type="number" min="1" max="31" value="${x.day}" required></label></div></div>`).join('');$('#settingsFields').innerHTML=html;$('#settingsDialog').showModal();};
$('#cancelSettings').onclick=()=>$('#settingsDialog').close();
$('#settingsForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),updated=state.defaults.map(x=>({...x,amount:Number(f.get(`amount-${x.id}`)),day:Number(f.get(`day-${x.id}`))}));if(updated.some(x=>!Number.isSafeInteger(x.amount)||x.amount<0||!Number.isInteger(x.day)||x.day<1||x.day>31))return alert('Revisa los montos y las fechas.');state.defaults=updated;save();$('#settingsDialog').close();render();});
function moveMonth(n){selected=new Date(selected.getFullYear(),selected.getMonth()+n,1);render()}
$('#prevBtn').onclick=()=>moveMonth(-1);$('#nextBtn').onclick=()=>moveMonth(1);$('#currentBtn').onclick=()=>{selected=new Date(today().getFullYear(),today().getMonth(),1);render()};
$('#notificationsBtn').onclick=async()=>{if(!('Notification'in window))return alert('Este navegador no admite notificaciones. Usa la exportación al calendario para avisos con la app cerrada.');if(!window.isSecureContext)return alert('Las notificaciones requieren HTTPS o localhost. Al publicarla en Vercel funcionarán en navegadores compatibles.');try{const permission=await Notification.requestPermission();if(permission==='granted'){checkNotifications();alert('Avisos activados. Se mostrarán al abrir la app si falta 2 días o menos para un pago. Para avisos con la app cerrada, usa el calendario.')}else alert('No se concedió permiso. Puedes seguir usando los recordatorios dentro de la app.')}catch{alert('No fue posible activar notificaciones en este navegador.')}};
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
const icsEscape=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const icsTime=d=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T090000`;
const stamp=()=>new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
$('#exportCalendarBtn').onclick=()=>{
 const key=keyFor(), records=ensureMonth(key), now=new Date(), lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mis Pagos Hogar//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Mis pagos del hogar'];
 for(const def of state.defaults){const p=records[def.id],date=getDue(key,p.day);lines.push('BEGIN:VEVENT',`UID:${def.id}-${key}@mis-pagos-hogar`,`DTSTAMP:${stamp()}`,`DTSTART:${icsTime(date)}`,`DTEND:${icsTime(new Date(date.getTime()+30*60000))}`,`SUMMARY:${icsEscape('Pagar '+def.name)}`,`DESCRIPTION:${icsEscape('Monto estimado: '+fmt(p.amount)+'. Recordatorio de pago del hogar.')}`,'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${icsEscape('En 2 días vence '+def.name)}`,'TRIGGER:-P2D','END:VALARM','END:VEVENT')}
 lines.push('END:VCALENDAR');download(`mis-pagos-${key}.ics`,lines.join('\r\n')+'\r\n','text/calendar;charset=utf-8');alert('Se descargó el calendario del mes seleccionado con recordatorios 2 días antes. Ábrelo e impórtalo en tu calendario. Cada mes puedes exportar sus fechas actualizadas. Los avisos dependen de la aplicación de calendario que utilices.');
};
$('#backupBtn').onclick=()=>download(`respaldo-mis-pagos-${keyFor(today())}.json`,JSON.stringify(state,null,2),'application/json');
$('#restoreBtn').onclick=()=>$('#restoreFile').click();
$('#restoreFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const content=JSON.parse(await file.text());if(content.version!==1||!Array.isArray(content.defaults)||!content.months||typeof content.months!=='object'||defs.some(d=>!content.defaults.some(x=>x.id===d.id&&Number.isSafeInteger(x.amount)&&x.amount>=0&&Number.isInteger(x.day)&&x.day>=1&&x.day<=31)))throw Error('Formato inválido');if(!confirm('¿Restaurar este respaldo? Reemplazará los datos actuales.'))return;state={version:1,defaults:defs.map(d=>({...d,...content.defaults.find(x=>x.id===d.id)})),months:content.months,notified:content.notified||{}};render();alert('Respaldo restaurado.')}catch{alert('Archivo de respaldo inválido.')}finally{e.target.value=''}});
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();checkNotifications();document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderAlerts();checkNotifications()}});
})();