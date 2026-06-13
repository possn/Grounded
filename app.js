const STORE = 'grounded90.v1.1';
const $ = (s, root=document) => root.querySelector(s);
const todayKey = () => new Date().toISOString().slice(0, 10);
const defaultState = () => ({ profile: null, entries: {}, started: todayKey(), tab: 'today' });
let state;
try { state = JSON.parse(localStorage.getItem(STORE)) || defaultState(); } catch { state = defaultState(); }

function save(){ localStorage.setItem(STORE, JSON.stringify(state)); }
function entry(d=todayKey()){
  if(!state.entries[d]) state.entries[d] = { mood:{energia:5, calma:5, esperanca:5, presenca:5, eu:5}, vivo:{}, rel:{}, victory:'', notes:'', floods:0, saved:false };
  return state.entries[d];
}
function daysSinceStart(){ return Math.min(90, Math.max(1, Math.floor((new Date(todayKey()) - new Date(state.started))/(864e5)) + 1)); }
function pct(n,d){ return Math.round((n/d)*100) || 0; }
function completedDays(){ return Object.values(state.entries).filter(e => e.saved).length; }
function avg(arr){ const v = arr.filter(x => Number.isFinite(x)); return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : 0; }
function lastDays(n=14){ const out=[]; for(let i=n-1;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); out.push(d.toISOString().slice(0,10)); } return out; }
function esc(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function appShell(content){
  return `<div class="app"><main id="main">${content}</main>${nav()}</div>`;
}
function nav(){
  const tabs = [['today','Hoje'],['vivo','Eu'],['relation','Relação'],['pause','Pausa'],['radar','Radar']];
  return `<nav class="bottom-nav">${tabs.map(([id,label])=>`<button class="nav-btn ${state.tab===id?'active':''}" data-tab="${id}">${label}</button>`).join('')}</nav>`;
}
function header(title, sub=''){
  return `<div class="top"><div><div class="eyebrow">Grounded 90</div><h1>${title}</h1><div class="quote">${sub || 'Não procures voltar atrás. Procura voltar a estar inteiro.'}</div></div><span class="pill">Dia ${daysSinceStart()}/90</span></div>`;
}
function setup(){
  return `<main class="setup"><div class="card"><div class="eyebrow">Primeira configuração</div><h1>Voltar a estar inteiro.</h1><p class="muted">Dados opcionais. Tudo fica apenas neste dispositivo.</p>
  <div class="field"><label>O teu nome</label><input id="name" type="text" value="Pedro Nunes"></div>
  <div class="field"><label>Anos de relação</label><input id="years" type="number" value="19"></div>
  <div class="field"><label>Anos de casamento</label><input id="married" type="number" value="16"></div>
  <div class="field"><label>Filhos / contexto</label><input id="kids" type="text" value="2 filhos, 14 e 9 anos"></div>
  <div class="field"><label>Objetivo principal</label><input id="goal" type="text" value="Voltar a estar inteiro e criar condições para maior proximidade"></div>
  <button id="startBtn" class="primary" type="button">Começar 90 dias</button></div></main>`;
}
function finishSetup(){
  state.profile = { name: $('#name')?.value || 'Eu', years: $('#years')?.value || '', married: $('#married')?.value || '', kids: $('#kids')?.value || '', goal: $('#goal')?.value || '' };
  state.started = todayKey(); state.tab = 'today'; entry().saved = false; save(); render();
}
function slider(k,label){ const v = entry().mood[k] ?? 5; return `<div class="field"><label>${label}<small>${v}/10</small></label><input data-slider="${k}" type="range" min="0" max="10" value="${v}"></div>`; }
function today(){ const p = completedDays(); return header('Hoje','Foco no processo, não no resultado.') + `<div class="card"><h2>Estado interno</h2>${slider('energia','Energia')}${slider('calma','Calma')}${slider('esperanca','Esperança')}${slider('presenca','Presença')}${slider('eu','Quanto de mim esteve presente hoje?')}<button id="saveCheckin" class="primary" type="button">Guardar check-in</button></div><div class="grid"><div class="metric"><b>${p}</b><span>dias registados</span></div><div class="metric"><b>${pct(daysSinceStart(),90)}%</b><span>progresso temporal</span></div></div><div class="card"><div class="section-title">Semente de hoje</div><p class="muted">Não avalies a colheita. Avalia se plantaste a semente de hoje.</p></div>`; }
const vivoItems = ['Ri genuinamente','Fiz algo espontâneo','Fiz algo só para mim','Senti-me vivo','Fui curioso','Fui sedutor','Estive presente'];
const relItems = ['Conversa significativa','Afeto','Contacto espontâneo','Tempo juntos','Discussão','Reparação após discussão'];
function checks(group, items){ const e = entry(); return items.map(it => `<label class="check"><input type="checkbox" data-check-group="${group}" data-check-item="${esc(it)}" ${e[group][it]?'checked':''}><span>${it}</span></label>`).join(''); }
function vivo(){ const e = entry(); const score = pct(Object.values(e.vivo).filter(Boolean).length, vivoItems.length); return header('Pedro Vivo','O objetivo não é voltar atrás. É voltar a dar espaço ao que continua aí.') + `<div class="card"><h2>Hoje eu...</h2>${checks('vivo', vivoItems)}<div class="metric"><b>${score}%</b><span>Índice de vitalidade de hoje</span></div></div>`; }
function relation(){ const e = entry(); return header('Relação','Mede sinais observáveis, não garantias.') + `<div class="card"><h2>Hoje houve...</h2>${checks('rel', relItems)}<div class="field"><label>Pequena vitória do dia</label><input id="victory" type="text" value="${esc(e.victory||'')}" placeholder="Ex.: rimo-nos, conversámos, houve calma..."></div><div class="field"><label>Notas opcionais</label><textarea id="notes" rows="4" placeholder="Sem análise excessiva. Só factos e perceções breves.">${esc(e.notes||'')}</textarea></div></div>`; }
let timer = null, remaining = 20*60;
function fmt(s){ return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function pause(){ const e = entry(); return header('Pausa','Quando a urgência sobe, o primeiro tratamento é não piorar.') + `<div class="card"><h2>Protocolo 20 minutos</h2><p class="muted">Usa quando houver flooding: aceleração, vontade de responder, necessidade de resolver já.</p><div class="timer" id="timer">${fmt(remaining)}</div><button id="startPause" class="primary danger" type="button">Preciso de pausa</button><button id="resetPause" class="secondary" type="button">Reiniciar</button><p class="note">1. Parar. 2. Respirar. 3. Caminhar ou sair do estímulo. 4. Regressar mais tarde sem fugir ao tema.</p><div class="metric"><b>${e.floods||0}</b><span>pausas registadas hoje</span></div></div>`; }
function startPause(){ entry().floods = (entry().floods || 0) + 1; save(); clearInterval(timer); remaining = 20*60; render(); timer = setInterval(()=>{ remaining--; const el = $('#timer'); if(el) el.textContent = fmt(Math.max(0, remaining)); if(remaining<=0) clearInterval(timer); }, 1000); }
function resetPause(){ clearInterval(timer); remaining = 20*60; render(); }
function chart(vals){ const max = Math.max(10, ...vals); return `<div class="chart">${vals.map(v=>`<div class="col" title="${v}" style="height:${Math.max(3,(v/max)*120)}px"></div>`).join('')}</div>`; }
function radar(){ const ds = lastDays(14); const energia = ds.map(d => state.entries[d]?.mood?.energia ?? 0); const eu = ds.map(d => state.entries[d]?.mood?.eu ?? 0); const prox = ds.map(d => { const r = state.entries[d]?.rel || {}; return ['Conversa significativa','Afeto','Contacto espontâneo','Tempo juntos'].filter(x => r[x]).length * 2.5; }); const tension = ds.map(d => state.entries[d]?.rel?.['Discussão'] ? 10 : 0); return header('Radar','Tendências, não leituras isoladas.') + `<div class="card"><h2>Eu — últimos 14 dias</h2><p class="muted">Energia média: ${avg(energia)}/10 · Presença média: ${avg(eu)}/10</p>${chart(eu)}</div><div class="card"><h2>Relação — sinais observáveis</h2><p class="muted">Proximidade média: ${avg(prox)}/10 · Tensão média: ${avg(tension)}/10</p>${chart(prox)}</div><div class="card"><h2>Aprender</h2><p><b>Gottman:</b> reduz crítica, defensividade, desprezo e stonewalling. Usa pequenas tentativas de reparação.</p><p><b>ACT:</b> nota pensamentos sem obedecer automaticamente a eles.</p><p><b>EFT:</b> por baixo do conflito há necessidades de ligação, segurança e reconhecimento.</p><p><b>NETR:</b> consistência durante meses; não usar o método como técnica para obter garantias.</p></div>`; }
function content(){ return ({ today: today, vivo: vivo, relation: relation, pause: pause, radar: radar }[state.tab] || today)(); }
function render(){ const app = $('#app'); if(!state.profile){ app.innerHTML = setup(); return; } app.innerHTML = appShell(content()); }

document.addEventListener('click', (e) => {
  const start = e.target.closest('#startBtn'); if(start){ finishSetup(); return; }
  const navBtn = e.target.closest('.nav-btn'); if(navBtn){ state.tab = navBtn.dataset.tab; save(); render(); return; }
  if(e.target.closest('#saveCheckin')){ entry().saved = true; save(); render(); return; }
  if(e.target.closest('#startPause')){ startPause(); return; }
  if(e.target.closest('#resetPause')){ resetPause(); return; }
});
document.addEventListener('input', (e) => {
  const sl = e.target.closest('[data-slider]'); if(sl){ entry().mood[sl.dataset.slider] = +sl.value; save(); render(); return; }
  if(e.target.id === 'victory'){ entry().victory = e.target.value; save(); return; }
  if(e.target.id === 'notes'){ entry().notes = e.target.value; save(); return; }
});
document.addEventListener('change', (e) => {
  const cb = e.target.closest('[data-check-group]'); if(cb){ entry()[cb.dataset.checkGroup][cb.dataset.checkItem] = cb.checked; save(); render(); }
});
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
