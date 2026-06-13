const KEY='grounded90Coach.v2';
let audioCtx=null;

let wakeLock=null;
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator){
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener?.('release',()=>{});
      return true;
    }
  }catch(e){}
  return false;
}
async function releaseWakeLock(){
  try{ if(wakeLock){ await wakeLock.release(); wakeLock=null; } }catch(e){ wakeLock=null; }
}
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && state?.keepAwake){ requestWakeLock(); }});

function beep(freq=660,dur=0.08,type='sine',gain=0.055){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended') audioCtx.resume(); const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=gain; o.connect(g); g.connect(audioCtx.destination); const t=audioCtx.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.stop(t+dur+0.02);}catch(e){}}
function phaseSound(phase){ if(phase==='inhale'){beep(520,0.07,'sine',0.045); setTimeout(()=>beep(660,0.07,'sine',0.04),90)} else if(phase==='exhale'){beep(360,0.09,'sine',0.045)} else {beep(760,0.08,'triangle',0.05); setTimeout(()=>beep(920,0.09,'triangle',0.05),120)} }

const $=s=>document.querySelector(s);
const todayKey=()=>new Date().toISOString().slice(0,10);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const initial={profile:null,startDate:null,entries:{},floods:[],activeTab:'home',breath:null,keepAwake:false};
let state=load();
function load(){try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return structuredClone(initial)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function daysSinceStart(){if(!state.startDate)return 1;let a=new Date(state.startDate+'T00:00:00'),b=new Date(todayKey()+'T00:00:00');return clamp(Math.floor((b-a)/86400000)+1,1,90)}
function entry(d=todayKey()){return state.entries[d]||(state.entries[d]={date:d,morningDone:false,middayDone:false,nightDone:false,sliders:{energia:5,calma:5,esperanca:5,presenca:5,reatividade:5,proximidade:5},vivo:{},rel:{},victory:'',notes:'',intention:'',journal:{morningBody:'',urgePlan:'',activated:'',response:'',didWell:'',seedTomorrow:''}})}
const missions=[
 ['Regular antes de resolver','Hoje o treino não é encontrar respostas. É ensinar o corpo que podes sentir desconforto sem agir imediatamente.'],
 ['Notar a urgência','Quando surgir vontade de perguntar, explicar ou resolver, diz: “isto é urgência, não é necessariamente sabedoria”.'],
 ['Voltar ao corpo','Durante 10 minutos, a tarefa é simples: respirar, sentir pés/mãos/peito, e deixar o pensamento passar.'],
 ['Criar espaço','Entre estímulo e resposta, treina uma pausa de 3 segundos. Isto é neuroplasticidade relacional em versão prática.'],
 ['Presença sem pedido','Procura uma interação em que estejas presente sem tentar obter garantia, resposta ou proximidade em troca.'],
 ['Leveza mínima','Faz uma coisa pequena que te lembre o Pedro Vivo: música, humor, caminhada, café, improviso.'],
 ['Sem avaliação global','Hoje não avalias o casamento. Avalias se plantaste a semente do dia.']
];
function mission(){return missions[(daysSinceStart()-1)%missions.length]}
function render(){ if(!state.profile) return renderOnboarding(); const tab=state.activeTab||'home'; const app=$('#app'); app.innerHTML=`<main class="wrap">${tab==='home'?home():tab==='coach'?coach():tab==='vivo'?vivo():tab==='rel'?rel():tab==='radar'?radar():learn()}</main>${nav()}`; wire(); }
function renderOnboarding(){ $('#app').innerHTML=`<main class="wrap onboarding"><section class="card hero"><div class="eyebrow">Primeira configuração</div><div class="h1">Voltar a estar inteiro.</div><p class="p">Esta app não é apenas um diário. É um programa guiado de 90 dias: manhã para regular, dia para agir melhor, noite para aprender com a tendência.</p><div class="grid"><label><b>O teu nome</b><input id="name" class="input" value="Pedro Nunes"></label><label><b>Anos de relação</b><input id="relYears" class="input" value="19"></label><label><b>Anos de casamento</b><input id="marYears" class="input" value="16"></label><label><b>Filhos / contexto</b><input id="kids" class="input" value="2 filhos, 14 e 9 anos"></label><label><b>Objetivo principal</b><textarea id="goal">Voltar a estar inteiro e criar condições para maior proximidade, intimidade e segurança emocional.</textarea></label><button class="btn" id="start">Começar 90 dias</button></div></section></main>`; $('#start').onclick=()=>{state.profile={name:$('#name').value.trim(),relYears:$('#relYears').value.trim(),marYears:$('#marYears').value.trim(),kids:$('#kids').value.trim(),goal:$('#goal').value.trim()};state.startDate=todayKey();save();render()}}
function home(){const e=entry();const day=daysSinceStart();let pct=Math.round(day/90*100);let m=mission();let done=[e.morningDone,e.middayDone,e.nightDone].filter(Boolean).length;return `<section class="card hero"><div class="row"><div><div class="eyebrow">Dia ${day} / 90</div><div class="h1">Bom dia${state.profile?.name?' , '+state.profile.name.split(' ')[0]:''}.</div></div><span class="pill">${pct}%</span></div><div class="progress"><div class="bar" style="width:${pct}%"></div></div><p class="quote">Não procures voltar atrás. Procura voltar a estar inteiro.</p><p class="p">Hoje o objetivo é processo, não resultado.</p></section><section class="card"><div class="eyebrow">Missão do dia</div><div class="h2">${m[0]}</div><p class="p">${m[1]}</p><button class="btn" data-tab="coach">Iniciar prática da manhã</button></section><section class="card"><div class="row"><div><div class="h2">Ritmo diário</div><p class="small">A app guia-te em três momentos. O registo vem depois do treino.</p></div><span class="pill">${done}/3</span></div><div class="grid"><button class="btn ${e.morningDone?'secondary':''}" data-tab="coach">${e.morningDone?'✓ Manhã feita':'Manhã: regular 5-10 min'}</button><button class="btn secondary" id="midQuick">${e.middayDone?'✓ Pausa do dia feita':'Dia: pausa de 60 segundos'}</button><button class="btn secondary" data-tab="rel">Noite: diário guiado</button></div></section>`}
function coach(){const e=entry();return `<section class="card hero"><div class="eyebrow">Prática da manhã</div><div class="h1">Reset do sistema nervoso</div><p class="p">Não é meditação perfeita. É treino de não reagir. Faz antes de tentar resolver qualquer coisa.</p></section><section class="card"><div class="h2">1. Respiração 4–6</div><p class="p">Inspira 4 segundos. Expira 6 segundos. O som marca a mudança de fase. Usa auscultadores ou volume baixo. Enquanto a prática estiver ativa, a app tenta manter o ecrã ligado.</p><div class="breathTimer" id="breathTimer">05:00</div><div class="breathCircle" id="circle"><span class="phase">pronto</span><small id="phaseCount">toca para começar</small></div><div class="grid2"><button class="btn" id="breathStart">Iniciar 5 minutos</button><button class="btn secondary hidden" id="breathStop">Terminar</button></div><p class="small center">Sinal duplo = inspira. Sinal grave = expira. Sinal final = completo.</p></section><section class="card"><div class="h2">2. Observar sem resolver</div>${slider('energia','Energia',e.sliders.energia)}${slider('calma','Calma interna',e.sliders.calma)}${slider('reatividade','Urgência para agir / resolver',e.sliders.reatividade)}<label><b>Pensamento dominante</b><textarea id="thought" placeholder="Ex: Tenho de resolver isto hoje...">${e.thought||''}</textarea></label><p class="small">ACT: escreve mentalmente “Estou a notar o pensamento de que…”. O pensamento perde autoridade.</p></section><section class="card"><div class="h2">3. Intenção do dia</div><p class="p">Escolhe uma qualidade observável. Pequena. Executável.</p><div class="grid2">${['calma','leveza','humor','presença','curiosidade','não pressionar'].map(x=>`<button class="btn ${e.intention===x?'':'secondary'}" data-intention="${x}">${x}</button>`).join('')}</div><label><b>Onde sinto isto no corpo?</b><textarea id="morningBody" placeholder="Ex: peito apertado, garganta, estômago, ombros...">${e.journal?.morningBody||''}</textarea></label><label><b>Se surgir urgência hoje, faço primeiro...</b><textarea id="urgePlan" placeholder="Ex: 3 respirações, caminhar 5 min, não enviar mensagem, não iniciar conversa decisiva.">${e.journal?.urgePlan||''}</textarea></label><button class="btn" id="saveMorning">Guardar prática da manhã</button></section><section class="card"><div class="h2">Protocolo de urgência</div><p class="p">Se hoje surgir vontade de ter “a conversa decisiva”, primeiro faz 20 minutos.</p><button class="btn danger" id="flood">Preciso de pausa de 20 minutos</button></section>`}
function vivo(){const e=entry();const items=['Ri genuinamente','Fiz algo espontâneo','Fiz algo só para mim','Senti-me vivo','Fui curioso','Fui sedutor','Estive presente sem otimizar'];return `<section class="card hero"><div class="eyebrow">Pedro Vivo</div><div class="h1">Quanto de ti apareceu hoje?</div><p class="p">Não é performance. É recuperação de vitalidade.</p></section><section class="card"><div class="grid">${items.map(i=>check('vivo',i,e.vivo?.[i])).join('')}</div><label><b>Pequena ação de vitalidade</b><textarea id="vivoNote" placeholder="O que fiz hoje que me fez sentir mais eu?">${e.vivoNote||''}</textarea></label><button class="btn" id="saveVivo">Guardar</button></section>`}
function rel(){const e=entry();const items=['Conversa significativa','Contacto espontâneo','Afeto','Tempo juntos sem tensão','Discussão','Reparação após discussão','Evitei pressionar','Validei antes de explicar'];return `<section class="card hero"><div class="eyebrow">Noite</div><div class="h1">Diário guiado: rever sem ruminar</div><p class="p">5 minutos. Não é para resolver a relação. É para treinar honestidade, groundedness e tendência.</p></section><section class="card"><div class="h2">1. Sinais observáveis</div><div class="grid">${items.map(i=>check('rel',i,e.rel?.[i])).join('')}</div>${slider('proximidade','Proximidade sentida',e.sliders.proximidade)}${slider('esperanca','Esperança realista',e.sliders.esperanca)}</section><section class="card"><div class="h2">2. Diário breve</div><label><b>O que me ativou hoje?</b><textarea id="activated" placeholder="Facto observável, não julgamento. Ex: recusa, silêncio, tom de voz, cansaço...">${e.journal?.activated||''}</textarea></label><label><b>Como respondi?</b><textarea id="response" placeholder="Ex: respirei, pressionei, expliquei, calei-me, reparei...">${e.journal?.response||''}</textarea></label><label><b>O que fiz bem, mesmo pequeno?</b><textarea id="didWell" placeholder="Ex: não insisti, validei, brinquei com os miúdos, fiz algo por mim...">${e.journal?.didWell||''}</textarea></label><label><b>Que semente planto amanhã?</b><textarea id="seedTomorrow" placeholder="Uma ação pequena sob o meu controlo. Não uma estratégia para obter resposta dela.">${e.journal?.seedTomorrow||''}</textarea></label></section><section class="card"><div class="h2">3. Pequena vitória</div><label><b>Qual foi o melhor momento de hoje?</b><textarea id="victory" placeholder="Ex: rimo-nos 2 minutos; não escalei a discussão; fiz algo por mim">${e.victory||''}</textarea></label><label><b>Nota livre curta</b><textarea id="notes" placeholder="Máximo 3 linhas. Se começares a ruminar, para aqui.">${e.notes||''}</textarea></label><button class="btn" id="saveRel">Guardar diário da noite</button><p class="small center">Depois de guardar: fechar a app. O trabalho acabou por hoje.</p></section>`}
function radar(){const days=lastDays(14);return `<section class="card hero"><div class="eyebrow">Radar</div><div class="h1">Tendência, não momento isolado.</div><p class="p">Como numa UCIP: uma observação isolada engana. A trajetória importa mais.</p></section>${metricCard('Calma',days.map(d=>entry(d).sliders.calma))}${metricCard('Vitalidade',days.map(d=>scoreVivo(entry(d))))}${metricCard('Proximidade',days.map(d=>entry(d).sliders.proximidade))}<section class="card"><div class="h2">Dias praticados</div><div class="days">${lastDays(90).map(d=>`<span class="dot ${entry(d).morningDone?'done':''}"></span>`).join('')}</div><p class="small">Ponto preto = prática da manhã feita. O alvo é consistência imperfeita.</p><button class="btn secondary" id="exportData">Exportar JSON</button><button class="btn ghost" id="resetApp">Reiniciar app</button></section>`}
function learn(){return `<section class="card hero"><div class="eyebrow">Aprender</div><div class="h1">Ideias curtas para executar.</div><p class="p">A app usa conceitos de ACT, mindfulness, Gottman, EFT e NETR como treino prático, não como promessa de resultado.</p></section>${lesson('ACT','Não precisas de acreditar em todos os pensamentos. Treina: “Estou a notar o pensamento de que…”. Isto cria espaço entre emoção e ação.')}${lesson('Gottman','O alvo não é nunca discutir. É reduzir crítica, defensividade, desprezo e bloqueio; e aumentar tentativas de reparação.')}${lesson('EFT','Por baixo de muitas discussões há necessidades de ligação: sentir-se visto, importante, seguro e escolhido.')}${lesson('Diário','Escrever à mão aprofunda. A app serve para guiar e guardar tendência; o papel serve para descarregar emoção. Ideal: app 5 min + papel quando houver muita carga.')}${lesson('NETR útil','A regra operacional é: 90 dias de consistência antes de tirar conclusões globais. Sem usar o método como técnica para controlar o outro.')}`}
function nav(){let tabs=[['home','⌂','Hoje'],['coach','◌','Reset'],['vivo','✦','Eu'],['rel','♡','Relação'],['radar','▥','Radar']];return `<nav class="tabs">${tabs.map(t=>`<button class="tab ${state.activeTab===t[0]?'active':''}" data-tab="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join('')}</nav>`}
function slider(id,label,val){return `<div class="slider"><div class="top"><span>${label}</span><span id="v_${id}">${val}</span></div><input type="range" min="0" max="10" value="${val}" data-slider="${id}"></div>`}
function check(group,label,checked){return `<label class="check"><input type="checkbox" data-check-group="${group}" data-check="${label}" ${checked?'checked':''}><span>${label}</span></label>`}
function lesson(t,b){return `<section class="card lesson"><div class="h2">${t}</div><p class="p">${b}</p></section>`}
function lastDays(n){let arr=[];let now=new Date(todayKey()+'T00:00:00');for(let i=n-1;i>=0;i--){let d=new Date(now);d.setDate(now.getDate()-i);arr.push(d.toISOString().slice(0,10))}return arr}
function metricCard(title,vals){let avg=Math.round(vals.reduce((a,b)=>a+(Number(b)||0),0)/vals.length*10)/10;return `<section class="card"><div class="row"><div class="h2">${title}</div><span class="pill">média ${avg}</span></div><div class="chart">${vals.map(v=>`<div class="col" style="height:${Math.max(4,(Number(v)||0)*10)}%"></div>`).join('')}</div></section>`}
function scoreVivo(e){let total=Object.keys(e.vivo||{}).length;if(!total)return 0;return Math.round(Object.values(e.vivo).filter(Boolean).length/7*10)}
function wire(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.activeTab=b.dataset.tab;save();render()});document.querySelectorAll('[data-slider]').forEach(s=>s.oninput=ev=>{let e=entry();e.sliders[ev.target.dataset.slider]=Number(ev.target.value);let out=$('#v_'+ev.target.dataset.slider);if(out)out.textContent=ev.target.value;save()});document.querySelectorAll('[data-check]').forEach(c=>c.onchange=ev=>{let e=entry();let g=ev.target.dataset.checkGroup;e[g]=e[g]||{};e[g][ev.target.dataset.check]=ev.target.checked;save()});document.querySelectorAll('[data-intention]').forEach(b=>b.onclick=()=>{entry().intention=b.dataset.intention;save();render()});let sm=$('#saveMorning');if(sm)sm.onclick=()=>{let e=entry();e.thought=$('#thought')?.value||'';e.journal=e.journal||{};e.journal.morningBody=$('#morningBody')?.value||'';e.journal.urgePlan=$('#urgePlan')?.value||'';e.morningDone=true;save();state.activeTab='home';save();render();toast('Manhã guardada. Agora vive o dia.')} ;let sv=$('#saveVivo');if(sv)sv.onclick=()=>{entry().vivoNote=$('#vivoNote').value;save();toast('Guardado.')};let sr=$('#saveRel');if(sr)sr.onclick=()=>{let e=entry();e.journal=e.journal||{};e.journal.activated=$('#activated')?.value||'';e.journal.response=$('#response')?.value||'';e.journal.didWell=$('#didWell')?.value||'';e.journal.seedTomorrow=$('#seedTomorrow')?.value||'';e.victory=$('#victory')?.value||'';e.notes=$('#notes')?.value||'';e.nightDone=true;save();toast('Diário da noite guardado. Fecha a app.')} ;let mq=$('#midQuick');if(mq)mq.onclick=()=>{entry().middayDone=true;save();toast('Pausa registada. 3 respirações lentas agora.');render()};let bs=$('#breathStart');if(bs)bs.onclick=startBreathing;let stop=$('#breathStop');if(stop)stop.onclick=stopBreathing;let fl=$('#flood');if(fl)fl.onclick=startFlood;let ex=$('#exportData');if(ex)ex.onclick=()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='grounded90_dados.json';a.click()};let rs=$('#resetApp');if(rs)rs.onclick=()=>{if(confirm('Apagar todos os dados locais?')){localStorage.removeItem(KEY);state=structuredClone(initial);render()}}}
function startBreathing(){
  let c=$('#circle'),bs=$('#breathStart'),st=$('#breathStop'),bt=$('#breathTimer'),pc=$('#phaseCount');
  if(!c)return;
  // Prime o AudioContext during the user's tap, required on iPhone/Safari.
  beep(880,0.04,'sine',0.001);
  state.keepAwake=true; save(); requestWakeLock().then(ok=>{ if(!ok) toast('Neste navegador, mantém o ecrã ativo manualmente.'); });
  bs.classList.add('hidden');
  st.classList.remove('hidden');
  let end=Date.now()+5*60*1000;
  let phase='inhale';
  let phaseEnd=Date.now()+4000;
  phaseSound('inhale');
  function fmt(ms){let total=Math.max(0,Math.ceil(ms/1000));let m=String(Math.floor(total/60)).padStart(2,'0');let s=String(total%60).padStart(2,'0');return `${m}:${s}`}
  function tick(){
    if(!$('#circle'))return;
    let left=end-Date.now();
    if(left<=0){
      if(bt)bt.textContent='00:00';
      phaseSound('done');
      stopBreathing();
      entry().morningDone=true;
      save();
      toast('5 minutos completos. Prática da manhã registada.');
      render();
      return;
    }
    if(Date.now()>=phaseEnd){
      phase=phase==='inhale'?'exhale':'inhale';
      phaseEnd=Date.now()+(phase==='inhale'?4000:6000);
      phaseSound(phase);
    }
    let phaseLeft=Math.max(0,Math.ceil((phaseEnd-Date.now())/1000));
    if(bt)bt.textContent=fmt(left);
    c.classList.toggle('inhale',phase==='inhale');
    c.classList.toggle('exhale',phase==='exhale');
    const ph=c.querySelector('.phase');
    if(ph) ph.textContent=phase==='inhale'?'inspira':'expira';
    if(pc) pc.textContent=`${phaseLeft}s`;
    state.breath=setTimeout(tick,250);
  }
  tick();
}
function stopBreathing(){
  if(state.breath)clearTimeout(state.breath);
  state.breath=null;
  state.keepAwake=false; save(); releaseWakeLock();
  let c=$('#circle');
  if(c){c.className='breathCircle';c.innerHTML='<span class="phase">feito</span><small id="phaseCount">podes continuar</small>'}
  let bt=$('#breathTimer'); if(bt)bt.textContent='05:00';
  let bs=$('#breathStart'),st=$('#breathStop');
  if(bs)bs.classList.remove('hidden');
  if(st)st.classList.add('hidden');
}
function startFlood(){state.floods.push({at:new Date().toISOString()});state.keepAwake=true;save();requestWakeLock().then(ok=>{ if(!ok) setTimeout(()=>toast('Neste navegador, mantém o ecrã ativo manualmente.'),300); });$('#app').innerHTML=`<main class="wrap"><section class="card hero"><div class="eyebrow">Pausa de 20 minutos</div><div class="h1">Não continues agora.</div><p class="p">O objetivo é regressar regulado, não vencer a conversa.</p><div class="timer" id="timer">20:00</div><div class="grid"><div class="card"><b>1.</b> Sai fisicamente da discussão se possível.</div><div class="card"><b>2.</b> Respiração lenta ou caminhada. Não ensaiar argumentos.</div><div class="card"><b>3.</b> Regressar com uma frase simples: “Quero continuar isto melhor. Estou mais calmo.”</div></div><button class="btn" id="endFlood">Terminar e voltar</button></section></main>`;let end=Date.now()+20*60*1000;let int=setInterval(()=>{let left=Math.max(0,end-Date.now());let m=String(Math.floor(left/60000)).padStart(2,'0'),s=String(Math.floor((left%60000)/1000)).padStart(2,'0');let t=$('#timer');if(t)t.textContent=`${m}:${s}`;if(left<=0){clearInterval(int);state.keepAwake=false;save();releaseWakeLock();}},500);$('#endFlood').onclick=()=>{clearInterval(int);state.keepAwake=false;save();releaseWakeLock();render()}}
function toast(msg){let t=document.createElement('div');t.textContent=msg;t.style.cssText='position:fixed;left:18px;right:18px;bottom:90px;background:#111827;color:white;padding:14px 18px;border-radius:18px;text-align:center;font-weight:800;z-index:99';document.body.appendChild(t);setTimeout(()=>t.remove(),1600)}
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}
render();
