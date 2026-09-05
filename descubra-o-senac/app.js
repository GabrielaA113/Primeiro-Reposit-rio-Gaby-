/* ==========================================================
   DESCUBRA O SENAC! — aplicação em JavaScript puro
   Estado, UI, missões, quiz, minigame, chat e persistência.
   ========================================================== */

const STORAGE_KEY = "descubraSenacStateV1";
const SOUND_KEY = "descubraSenacSoundV1";

const LEVELS = [
  { level: 1, title: "Candidato", next: 200 },
  { level: 2, title: "Matriculado", next: 300 },
  { level: 3, title: "Explorador do Campus", next: 500 },
  { level: 4, title: "Calouro", next: 700 },
  { level: 5, title: "Estudante Veterano", next: 1000 }
];

const COURSES = [
  { id:"tec", icon:"💻", iconPath:"assets/icones/xp.png", name:"Tecnologia", desc:"Desenvolva soluções, sistemas e habilidades digitais.", tag:"DIGITAL" },
  { id:"adm", icon:"📊", iconPath:"assets/icones/missao.png", name:"Administração", desc:"Organize projetos, processos e negócios com visão profissional.", tag:"GESTÃO" },
  { id:"sau", icon:"🩺", iconPath:"assets/cenarios/sala.png", name:"Saúde", desc:"Conheça carreiras voltadas ao cuidado e ao bem-estar.", tag:"CUIDADO" },
  { id:"com", icon:"📣", iconPath:"assets/icones/trofeu.png", name:"Comunicação", desc:"Crie mensagens, campanhas e experiências que conectam pessoas.", tag:"CRIATIVIDADE" },
  { id:"gas", icon:"🍳", iconPath:"assets/cenarios/laboratorio.png", name:"Gastronomia", desc:"Transforme ingredientes em experiências e novos sabores.", tag:"PRÁTICA" },
  { id:"mod", icon:"🧵", iconPath:"assets/cenarios/biblioteca.png", name:"Moda", desc:"Explore criação, produção e expressão por meio do design.", tag:"ESTILO" }
];

const MISSIONS = [
  { id:1, title:"MATRÍCULA", desc:"Confira um item básico para iniciar sua jornada.", reward:100, objective:"Identificar um documento obrigatório.", status:"available" },
  { id:2, title:"PRIMEIRO ACESSO", desc:"Aprenda a diferenciar login e senha.", reward:100, objective:"Identificar corretamente as credenciais de acesso.", status:"locked" },
  { id:3, title:"CONHECENDO O CAMPUS", desc:"Encontre espaços importantes da unidade.", reward:100, objective:"Visitar os quatro pontos do mapa.", status:"locked" },
  { id:4, title:"MONTANDO A GRADE", desc:"Organize disciplinas em horários.", reward:100, objective:"Distribuir as disciplinas sem conflitos.", status:"locked" },
  { id:5, title:"PRIMEIRO DIA DE AULA", desc:"Prepare a mochila com itens úteis.", reward:100, objective:"Escolher os objetos adequados.", status:"locked" }
];

const GAMES = [
  {id:"quiz", icon:"🧠", name:"QUIZ DO SENAC", desc:"Descubra qual área combina com seu perfil.", action:"quiz"},
  {id:"memory", icon:"🃏", name:"JOGO DA MEMÓRIA", desc:"Desafio de memória em uma futura expansão.", action:"memory"},
  {id:"quick", icon:"⚡", name:"DESAFIO RÁPIDO", desc:"Responda antes que o tempo acabe.", action:"quick"},
  {id:"grade", icon:"📅", name:"MONTE SUA GRADE", desc:"Organize seu dia de estudante.", action:"grade"},
  {id:"bag", icon:"🎒", name:"PREPARE SUA MOCHILA", desc:"Escolha itens essenciais para a aula.", action:"mission5"}
];

const QUIZ = [
  {q:"O que você mais gosta de fazer?", a:[['Criar coisas','gas'],['Trabalhar com tecnologia','tec'],['Ajudar pessoas','sau'],['Organizar projetos','adm'],['Trabalhar com comunicação','com']]},
  {q:"Qual desafio parece mais divertido?", a:[['Criar uma solução digital','tec'],['Planejar uma equipe','adm'],['Cuidar de alguém','sau'],['Criar uma campanha','com'],['Criar uma experiência gastronômica','gas']]},
  {q:"Em um trabalho em grupo você tende a...", a:[['Testar ferramentas','tec'],['Coordenar tarefas','adm'],['Apoiar colegas','sau'],['Apresentar ideias','com'],['Colocar a mão na massa','gas']]},
  {q:"Qual ambiente combina mais com você?", a:[['Computadores e laboratório','tec'],['Escritório e projetos','adm'],['Ambiente de atendimento','sau'],['Estúdio e criação','com'],['Cozinha e oficina','gas']]},
  {q:"O que mais te motiva?", a:[['Resolver problemas','tec'],['Fazer processos funcionarem','adm'],['Fazer a diferença para alguém','sau'],['Transmitir uma ideia','com'],['Transformar materiais em algo novo','gas']]}
];

const DEFAULT_STATE = {
  name:"Estudante", xp:300, level:3, energy:5,
  currentMission:3, completedMissions:[], achievements:[], discoveries:[], started:false,
  settings:{sound:true}
};

let state = loadState();
let quizIndex = 0;
let quizScores = {};
let lastFocusedElement = null;
let audioCtx = null;

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const ASSETS = {
  logo: "assets/logo/logo-descubra-senac.png",
  mascot: "assets/personagens/senaquinho.png",
  campus: "assets/cenarios/campus.png",
  biblioteca: "assets/cenarios/biblioteca.png",
  laboratorio: "assets/cenarios/laboratorio.png",
  sala: "assets/cenarios/sala.png",
  xp: "assets/icones/xp.png",
  trofeu: "assets/icones/trofeu.png",
  missao: "assets/icones/missao.png"
};

function escapeAttr(value){
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function assetMarkup(src, alt, fallback, className='asset-img'){
  return `<span class="asset-frame ${className}"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" onerror="this.hidden=true; this.nextElementSibling.hidden=false;"><span class="asset-fallback" aria-hidden="true" hidden>${fallback}</span></span>`;
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULT_STATE);
    return deepMerge(structuredClone(DEFAULT_STATE), JSON.parse(raw));
  }catch(err){ console.warn("Não foi possível restaurar o progresso.", err); return structuredClone(DEFAULT_STATE); }
}
function deepMerge(base, extra){
  Object.keys(extra || {}).forEach(k=>{
    if(extra[k] && typeof extra[k]==='object' && !Array.isArray(extra[k]) && typeof base[k]==='object') base[k]=deepMerge(base[k],extra[k]);
    else base[k]=extra[k];
  });
  return base;
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function levelInfo(){ return LEVELS.find(l=>l.level===state.level) || LEVELS[LEVELS.length-1]; }
function currentLevelBounds(){
  const current=LEVELS.find(l=>l.level===state.level);
  const previous=LEVELS.find(l=>l.level===state.level-1);
  const min=previous ? previous.next : 0;
  const max=current ? current.next : state.xp;
  return {min,max};
}
function formatStatus(m){
  if(state.completedMissions.includes(m.id)) return ['done','✓ CONCLUÍDA'];
  if(m.id===1 || state.completedMissions.includes(m.id-1)) return ['available','▶ DISPONÍVEL'];
  return ['locked','🔒 BLOQUEADA'];
}

function init(){
  renderCourses(); renderMissions(); renderGames(); renderEnergy(); updateHUD(); bindEvents(); animateHeroText();
}

function bindEvents(){
  document.addEventListener('click', handleGlobalClick);
  $('#menuToggle').addEventListener('click',()=>{
    const nav=$('#mobileNav'); const open=nav.classList.toggle('open'); $('#menuToggle').setAttribute('aria-expanded',String(open));
  });
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', e=>{if(e.target.id==='modalBackdrop') closeModal();});
  document.addEventListener('keydown', e=>{if(e.key==='Escape' && !$('#modalBackdrop').hidden) closeModal();});
  $('#chatOpen').addEventListener('click',openChat);
  $('#startJourney').addEventListener('click',startJourney);
  $('#startJourneySide').addEventListener('click',startJourney);
  $('#soundToggle').addEventListener('click',toggleSound);
  $('#settingsButton').addEventListener('click',openSettings);
  $('#profileButton').addEventListener('click',()=>openModal('Perfil do estudante', profileContent()));
  $('#mapsButton').addEventListener('click',()=>window.open('https://www.google.com/maps/search/?api=1&query=Senac+Largo+Treze+Rua+Dr.+Ant%C3%B4nio+Bento+393+S%C3%A3o+Paulo','_blank','noopener'));
  $$('.arcade-option').forEach(btn=>btn.addEventListener('click',()=>runQuickAnswer(btn.dataset.answer)));
}

function handleGlobalClick(e){
  const scrollBtn=e.target.closest('[data-scroll]');
  if(scrollBtn){ document.querySelector(scrollBtn.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  const open=e.target.closest('[data-open]');
  if(open){ openAction(open.dataset.open); return; }
  const course=e.target.closest('[data-course]');
  if(course){ openCourse(course.dataset.course); return; }
  const mission=e.target.closest('[data-mission]');
  if(mission){ openMission(Number(mission.dataset.mission)); return; }
  const game=e.target.closest('[data-game]');
  if(game){ openGame(game.dataset.game); return; }
  const loc=e.target.closest('[data-location]');
  if(loc){ visitLocation(loc.dataset.location); return; }
}

function openAction(action){
  if(action==='missions') openMissionsModal();
  if(action==='achievements') openAchievements();
  if(action==='howto') openModal('Como funciona?', `<div class="achievement-unlock"><div class="icon">🎮</div><h3>JORNADA DO ESTUDANTE</h3><p>Complete missões para ganhar XP, subir de nível e desbloquear conquistas.</p><p><strong>Missões:</strong> desafios educativos.<br><strong>XP:</strong> pontos para evoluir.<br><strong>Níveis:</strong> representam sua progressão.<br><strong>Conquistas:</strong> marcos especiais.<br><strong>Minijogos:</strong> atividades rápidas e divertidas.</p></div>`);
  if(action==='quiz') openQuiz();
  if(action==='quick') document.querySelector('#jogos')?.scrollIntoView({behavior:'smooth'});
  if(action==='memory') openMemoryPlaceholder();
  if(action==='grade') openGradeGame();
  if(action==='mission5') openMission(5);
}

function renderCourses(){
  $('#courseGrid').innerHTML=COURSES.map(c=>`<article class="course-card" data-course-card="${c.id}">${assetMarkup(c.iconPath, c.name, c.icon, 'course-asset')}<span class="course-tag">${c.tag}</span><h3>${c.name}</h3><p>${c.desc}</p><button class="pixel-button" data-course="${c.id}">EXPLORAR</button></article>`).join('');
}
function renderMissions(){
  $('#missionGrid').innerHTML=MISSIONS.map(m=>{
    const [cls,label]=formatStatus(m);
    const enabled=cls!=='locked';
    return `<article class="mission-card"><span class="status ${cls}">${label}</span><h3>${m.title}</h3><p>${m.desc}</p><p><strong>OBJETIVO:</strong> ${m.objective}</p><div class="reward">+${m.reward} XP</div><button class="pixel-button mission-action ${enabled?'':'secondary'}" data-mission="${m.id}" ${enabled?'':'disabled'}>${cls==='done'?'VER CONCLUÍDA':cls==='available'?'INICIAR MISSÃO':'BLOQUEADA'}</button></article>`;
  }).join('');
}
function renderGames(){
  const gameAssets={quiz:ASSETS.xp,memory:ASSETS.trofeu,quick:ASSETS.missao,grade:ASSETS.missao,mission5:ASSETS.trofeu};
  $('#gameGrid').innerHTML=GAMES.map(g=>`<article class="game-card">${assetMarkup(gameAssets[g.action], g.name, g.icon, 'game-asset')}<h3>${g.name}</h3><p>${g.desc}</p><button class="pixel-button" data-game="${g.action}">JOGAR</button></article>`).join('');
}
function renderEnergy(){ $('#energyIcons').innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<state.energy?'':'empty'}"></i>`).join(''); $('#energyText').textContent=`${state.energy} / 5`; }
function updateHUD(){
  const info=levelInfo(), bounds=currentLevelBounds();
  $('#playerNameLabel').textContent=state.name; $('#playerLevelLabel').textContent=`NÍVEL ${state.level}`; $('#playerClassLabel').textContent=info.title;
  $('#xpText').textContent=`${state.xp} / ${bounds.max}`;
  const pct=bounds.max===bounds.min?100:Math.max(0,Math.min(100,((state.xp-bounds.min)/(bounds.max-bounds.min))*100));
  $('#xpBar').style.width=`${pct}%`;
  const mission=MISSIONS.find(m=>m.id===state.currentMission); $('#currentMissionLabel').textContent=mission?.desc.includes('campus')?'Conhecer o Campus':(mission?.title || 'Concluída');
  $('#achievementText').textContent=`${state.achievements.length} / 8`; $('#achievementBar').style.width=`${Math.min(100,state.achievements.length/8*100)}%`;
  $('#dashboardXp').textContent=state.xp; $('#dashboardLevel').textContent=state.level; $('#dashboardMissions').textContent=`${state.completedMissions.length}/5`; $('#dashboardDiscoveries').textContent=`${state.discoveries.length}/4`;
  $('#soundToggle').textContent=state.settings.sound?'🔊':'🔇';
  renderEnergy(); renderMissions();
}

function startJourney(){
  state.started=true; saveState(); playTone('start');
  $('#heroSpeech').innerHTML='Boa! Nossa primeira missão está esperando!';
  $('#mascotWrap').animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:450});
  toast('JORNADA INICIADA!');
  openMission(1);
}

function animateHeroText(){
  const el=$('#heroSpeech'); const text='Oi! Eu sou o Senaquinho!\nVamos descobrir o Senac juntos?';
  let i=0; el.innerHTML=''; el.classList.add('typing-cursor');
  const tick=()=>{ if(i<=text.length){ el.innerHTML=text.slice(0,i).replace('\n','<br>'); i++; setTimeout(tick,24); } else el.classList.remove('typing-cursor'); };
  setTimeout(tick,300);
}

function openCourse(id){
  const c=COURSES.find(x=>x.id===id); if(!c)return;
  $('#heroSpeech').innerHTML=`Essa área parece interessante! Vamos olhar ${c.name}?`;
  playTone('click');
  openModal(c.name, `<div class="course-detail">${assetMarkup(c.iconPath, c.name, c.icon, 'course-asset large')}<span class="course-tag">${c.tag}</span><h3>${c.name}</h3><p>${c.desc}</p><p>Explore a área e use o quiz para descobrir qual perfil combina mais com você.</p><button class="pixel-button primary" id="courseQuizButton">FAZER QUIZ</button></div>`);
  $('#courseQuizButton').addEventListener('click',openQuiz);
}

function openMissionsModal(){
  openModal('Diário de Missões', `<div id="modalMissionList">${MISSIONS.map(m=>{
    const [cls,label]=formatStatus(m);
    return `<div class="mission-question"><span class="status ${cls}">${label}</span><h3>${m.title}</h3><p>${m.desc}</p><button class="pixel-button ${cls==='locked'?'secondary':''}" data-mission="${m.id}" ${cls==='locked'?'disabled':''}>${cls==='done'?'VER CONCLUÍDA':'ABRIR'}</button></div>`;
  }).join('')}</div>`);
}

function openMission(id){
  const m=MISSIONS.find(x=>x.id===id); if(!m)return;
  const [cls]=formatStatus(m);
  if(cls==='locked'){toast('MISSÃO BLOQUEADA');return;}
  if(cls==='done'){openModal(m.title, `<div class="achievement-unlock"><div class="icon">✅</div><h3>MISSÃO CONCLUÍDA</h3><p>Você já recebeu a recompensa desta missão.</p></div>`);return;}
  if(id===1) return mission1();
  if(id===2) return mission2();
  if(id===3) return mission3();
  if(id===4) return mission4();
  if(id===5) return mission5();
}
function mission1(){
  openModal('Missão 1 — Matrícula', `<div class="mission-question"><strong>QUAL DOCUMENTO É OBRIGATÓRIO?</strong></div><div class="choice-row">${['RG','Receita de bolo','Foto do cachorro'].map(x=>`<button class="answer-button" data-m1="${x}">${x}</button>`).join('')}</div>`);
  $$('.answer-button[data-m1]').forEach(btn=>btn.addEventListener('click',()=>{
    if(btn.dataset.m1==='RG') completeMission(1,'Mandou bem! Isso valeu 100 XP!'); else {$('#modalBody').insertAdjacentHTML('beforeend','<p><strong>Ops! Essa não. Tenta novamente!</strong></p>');toast('TENTE NOVAMENTE');playTone('wrong');}
  }));
}
function mission2(){
  openModal('Missão 2 — Primeiro Acesso', `<div class="mission-question"><strong>QUAL DUPLA REPRESENTA AS CREDENCIAIS DE ACESSO?</strong></div><div class="choice-row"><button class="answer-button" data-m2="ok">LOGIN + SENHA</button><button class="answer-button" data-m2="bad">NOME + COR FAVORITA</button><button class="answer-button" data-m2="bad">CURSO + CIDADE</button></div>`);
  $$('.answer-button[data-m2]').forEach(btn=>btn.addEventListener('click',()=>btn.dataset.m2==='ok'?completeMission(2,'Boa! Você já sabe o básico do primeiro acesso!'):wrongAnswer()));
}
function mission3(){
  let found=[];
openModal('Missão 3 — Conhecendo o Campus', `<p>Clique nos quatro locais corretos para concluir a exploração.</p><div class="map-panel pixel-border" style="height:340px"><button class="map-location loc-library" data-m3="Biblioteca">${assetMarkup(ASSETS.biblioteca,'Biblioteca','📚','map-thumb')}<strong>BIBLIOTECA</strong></button><button class="map-location loc-office" data-m3="Secretaria">${assetMarkup(ASSETS.missao,'Secretaria','🧾','map-thumb')}<strong>SECRETARIA</strong></button><button class="map-location loc-lab" data-m3="Laboratório">${assetMarkup(ASSETS.laboratorio,'Laboratório','🧪','map-thumb')}<strong>LABORATÓRIO</strong></button><button class="map-location loc-class" data-m3="Sala de aula">${assetMarkup(ASSETS.sala,'Sala de aula','🧑‍🏫','map-thumb')}<strong>SALA DE AULA</strong></button></div><p id="mission3Feedback">0 / 4 descobertos.</p>`);
  $$('[data-m3]').forEach(btn=>btn.addEventListener('click',()=>{ if(!found.includes(btn.dataset.m3)){found.push(btn.dataset.m3);btn.style.background='var(--green)';btn.style.color='#fff';$('#mission3Feedback').textContent=`${found.length} / 4 descobertos.`; playTone('click');} if(found.length===4) setTimeout(()=>completeMission(3,'Exploração completa! O campus já faz parte do seu mapa.'),350); }));
}
function mission4(){
  openModal('Missão 4 — Montando a Grade', `<p>Arraste cada disciplina para o horário correto.</p><div id="gradeBoard" style="display:grid;gap:10px"></div><p id="gradeFeedback"></p>`);
  const board=$('#gradeBoard'); const rows=[['08:00','Matemática'],['10:00','Tecnologia'],['13:00','Projeto']];
  const items=[...rows].sort(()=>Math.random()-.5);
  board.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap" id="dragItems">${items.map((r,i)=>`<div class="answer-button" draggable="true" data-discipline="${r[1]}">${r[1]}</div>`).join('')}</div><div style="display:grid;gap:8px">${rows.map(r=>`<div class="pixel-border" style="padding:10px;background:#f5f8fc"><strong>${r[0]}</strong><div class="dropzone answer-button" data-slot="${r[1]}" style="margin-top:6px">SOLTE A DISCIPLINA AQUI</div></div>`).join('')}</div>`;
  let correct=0;
  $$('.answer-button[draggable]').forEach(item=>{item.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',item.dataset.discipline));});
  $$('.dropzone').forEach(zone=>{zone.addEventListener('dragover',e=>e.preventDefault());zone.addEventListener('drop',e=>{const d=e.dataTransfer.getData('text/plain');if(d===zone.dataset.slot){zone.textContent='✓ '+d;zone.style.background='var(--green)';zone.style.color='#fff';zone.dataset.done='1';correct=$$('.dropzone[data-done="1"]').length;if(correct===3)setTimeout(()=>completeMission(4,'Grade organizada! Você ganhou prática com planejamento.'),300);}else{$('#gradeFeedback').textContent='Esse horário não combina com a disciplina. Tente outra vez.';playTone('wrong');}});});
}
function mission5(){
  const items=[['Notebook',true,'💻'],['Caderno',true,'📓'],['Caneta',true,'🖊️'],['Livro',true,'📕'],['Controle de videogame',false,'🎮'],['Travesseiro',false,'🛏️']];
  let chosen=[];
  openModal('Missão 5 — Primeiro Dia', `<p>Selecione os itens adequados para a mochila.</p><div class="answer-grid">${items.map(([n,ok,ic])=>`<button class="answer-button bag-item" data-ok="${ok}" data-name="${n}">${ic} ${n}</button>`).join('')}</div><button class="pixel-button primary" id="finishBag" style="margin-top:14px;width:100%">CONFERIR MOCHILA</button><p id="bagFeedback"></p>`);
  $$('.bag-item').forEach(btn=>btn.addEventListener('click',()=>{btn.classList.toggle('selected'); if(btn.classList.contains('selected')) chosen.push(btn.dataset.name); else chosen=chosen.filter(x=>x!==btn.dataset.name);}));
  $('#finishBag').addEventListener('click',()=>{const correct=new Set(items.filter(x=>x[1]).map(x=>x[0])); const picked=new Set(chosen); const ok=picked.size===correct.size && [...picked].every(x=>correct.has(x)); if(ok)completeMission(5,'PRIMEIRO DIA PREPARADO! +100 XP'); else {$('#bagFeedback').textContent='Ainda falta ajustar a mochila. Tente novamente.';playTone('wrong');}});
}
function wrongAnswer(){toast('OPS! TENTE NOVAMENTE');playTone('wrong');}
function completeMission(id,message){
  if(state.completedMissions.includes(id)) return;
  state.completedMissions.push(id); state.currentMission=id+1;
  const next=MISSIONS.find(m=>m.id===id+1); if(next) next.status='available';
  addXP(MISSIONS.find(m=>m.id===id)?.reward || 100,false);
  const achMap={1:['firstMission','Primeira missão','Concluiu sua primeira missão.','🎯'],2:['firstAccess','Primeiro acesso','Dominou o desafio de login e senha.','🔐'],3:['campus','Explorador do Senac','Conheceu os quatro espaços do campus.','🗺️'],5:['bag','Mochila preparada','Preparou a mochila do primeiro dia.','🎒']};
  if(achMap[id]) unlockAchievement(...achMap[id]);
  saveState(); renderMissions(); updateHUD(); playTone('success');
  $('#heroSpeech').innerHTML=message;
  openModal('MISSÃO CONCLUÍDA!', `<div class="achievement-unlock"><div class="icon">✅</div><h3>+${MISSIONS.find(m=>m.id===id)?.reward||100} XP</h3><p>${message}</p><button class="pixel-button primary" id="continueJourney">CONTINUAR JORNADA</button></div>`);
  $('#continueJourney').addEventListener('click',closeModal);
}

function addXP(amount,showToast=true){
  state.xp += amount;
  while(state.level<LEVELS.length && state.xp>=LEVELS[state.level-1].next){ state.level++; unlockAchievement(`level${state.level}`,'Novo nível',`Você alcançou o nível ${state.level}: ${levelInfo().title}.`,'⭐'); }
  if(showToast){xpFloat(amount);toast(`+${amount} XP`);}
  saveState(); updateHUD();
}
function unlockAchievement(id,name,desc,icon='🏆'){
  if(state.achievements.some(a=>a.id===id)) return;
  if(state.achievements.length>=8)return;
  state.achievements.push({id,name,desc,icon}); saveState();
  setTimeout(()=>showAchievement(name,desc,icon),120);
}
function showAchievement(name,desc,icon){
  playTone('achievement');
  openModal('CONQUISTA DESBLOQUEADA!', `<div class="achievement-unlock"><div class="icon">${icon}</div><h3>${name}</h3><p>${desc}</p></div>`);
}
function openAchievements(){
  const all=[['firstMission','Primeira missão','Concluir a primeira missão.','🎯'],['firstAccess','Primeiro acesso','Concluir o desafio de login.','🔐'],['campus','Explorador do Senac','Conhecer o campus.','🗺️'],['mestreDocs','Mestre dos documentos','Demonstrar atenção aos detalhes.','📚'],['campusFriend','Conheceu o campus','Visitar os quatro pontos.','🏫'],['bag','Mochila preparada','Preparar o primeiro dia.','🎒'],['game','Primeiro jogo','Terminar um minigame.','🕹️'],['bug','Destruidor de Bugs','Superar os próximos desafios.','🐛']];
  openModal('Conquistas', all.map(a=>{const hit=state.achievements.find(x=>x.id===a[0]);return `<div class="settings-row"><div><strong>${hit?hit.icon:'🔒'} ${a[1]}</strong><div>${a[2]}</div></div><span>${hit?'✓':'—'}</span></div>`}).join(''));
}

function openQuiz(){
  quizIndex=0; quizScores={tec:0,adm:0,sau:0,com:0,gas:0}; renderQuiz();
}
function renderQuiz(){
  if(quizIndex>=QUIZ.length){finishQuiz();return;}
  const item=QUIZ[quizIndex];
  openModal('Qual curso combina com você?', `<div class="quiz-progress"><span style="width:${quizIndex/QUIZ.length*100}%"></span></div><p><strong>PERGUNTA ${quizIndex+1} DE ${QUIZ.length}</strong></p><div class="quiz-question">${item.q}</div><div class="answer-grid">${item.a.map((a,i)=>`<button class="answer-button" data-quiz="${i}">${String.fromCharCode(65+i)}) ${a[0]}</button>`).join('')}</div>`);
  $$('[data-quiz]').forEach(btn=>btn.addEventListener('click',()=>{const pair=item.a[Number(btn.dataset.quiz)]; quizScores[pair[1]]++; quizIndex++; renderQuiz();}));
}
function finishQuiz(){
  const result=Object.entries(quizScores).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'tec';
  const c=COURSES.find(x=>x.id===result);
  state.quizResult=result; saveState(); addXP(50,true); unlockAchievement('quiz','Perfil explorador','Você completou o quiz de cursos.','🧠');
  $('#heroSpeech').innerHTML=`Pelo seu perfil, ${c.name} parece uma ótima trilha para explorar!`;
  openModal('SEU PERFIL COMBINA COM...', `<div class="achievement-unlock"><div class="icon">${c.icon}</div><h3>${c.name}</h3><p>${c.desc}</p><p><strong>Senaquinho:</strong> “Essa área parece interessante!”</p><button class="pixel-button primary" id="quizClose">CONTINUAR</button></div>`); $('#quizClose').addEventListener('click',closeModal);
}

function openGame(action){
  if(action==='quiz') openQuiz(); else if(action==='quick') document.querySelector('#jogos').scrollIntoView({behavior:'smooth'}); else if(action==='memory') openMemoryPlaceholder(); else if(action==='grade') openGradeGame(); else if(action==='mission5') openMission(5);
}
function openMemoryPlaceholder(){
  openModal('Jogo da Memória', `<div class="achievement-unlock"><div class="icon">🃏</div><h3>EM DESENVOLVIMENTO</h3><p>O espaço está preparado para receber o jogo da memória em uma próxima expansão.</p></div>`);
}
function openGradeGame(){ openMission(4); }
function runQuickAnswer(answer){
  const feedback=$('#arcadeFeedback'); if(answer==='correct'){feedback.textContent='✓ Boa! Esse item não é prioridade para a aula.';addXP(50,true);unlockAchievement('game','Primeiro jogo','Concluiu um minigame.','🕹️');playTone('success');}else{feedback.textContent='✗ Tente novamente. Pense no que é essencial para estudar.';playTone('wrong');}}

function visitLocation(location){
  if(!state.discoveries.includes(location)){state.discoveries.push(location);saveState();updateHUD();addXP(25,true);toast(`${location} descoberto!`); if(state.discoveries.length===4)unlockAchievement('explorer','Explorador do Senac','Você registrou os quatro pontos do mapa.','🗺️');}
  $('#heroSpeech').innerHTML=`Você encontrou a ${location}! Mais um pedaço do Senac descoberto.`;
  openModal(location, `<div class="achievement-unlock"><div class="icon">${location==='Biblioteca'?'📚':location==='Secretaria'?'🧾':location==='Laboratório'?'🧪':'🧑‍🏫'}</div><h3>${location}</h3><p>Área registrada na sua jornada.</p></div>`);
}

function openChat(){
  openModal('Converse com o Senaquinho', `<div class="chat-window"><div class="chat-log" id="chatLog"><div class="chat-msg bot">Oi! Eu sou o Senaquinho. Pergunte sobre cursos, missões, jogos, campus, Senac ou ajuda.</div></div><form class="chat-form" id="chatForm"><input id="chatInput" aria-label="Mensagem" placeholder="Digite sua dúvida..." autocomplete="off"><button class="pixel-button primary">ENVIAR</button></form></div>`);
  $('#chatForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#chatInput');const text=input.value.trim();if(!text)return;appendChat('user',text);input.value='';setTimeout(()=>appendChat('bot',chatReply(text)),250);});
  $('#chatInput').focus();
}
function appendChat(who,text){const log=$('#chatLog');log.insertAdjacentHTML('beforeend',`<div class="chat-msg ${who}">${escapeHtml(text)}</div>`);log.scrollTop=log.scrollHeight;}
function chatReply(text){
  const t=text.toLowerCase();
  if(t.includes('curso'))return'Você pode explorar Tecnologia, Administração, Saúde, Comunicação, Gastronomia e Moda!';
  if(t.includes('miss'))return'As missões dão XP e ajudam você a conhecer matrícula, acesso, campus, grade e primeiro dia.';
  if(t.includes('jogo'))return'Você pode jogar o Desafio Rápido, fazer o quiz e experimentar a área de minijogos.';
  if(t.includes('campus'))return'No mapa você pode visitar Biblioteca, Secretaria, Laboratório e Sala de Aula.';
  if(t.includes('senac'))return'O Senac oferece formação profissional em diversas áreas. Aqui você pode explorar a unidade e descobrir trilhas.';
  if(t.includes('ajuda')||t.includes('como'))return'Use os cards e o menu para navegar. Complete missões para ganhar XP e acompanhe seu progresso no painel.';
  return'Hmm, ainda estou aprendendo isso! Tente perguntar sobre cursos, missões, jogos, campus ou ajuda.';
}
function escapeHtml(str){return str.replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}

function openSettings(){
  openModal('Configurações', `<div class="settings-row"><span>Som da experiência</span><button class="pixel-button ${state.settings.sound?'primary':'secondary'}" id="modalSoundToggle">${state.settings.sound?'ATIVADO':'DESATIVADO'}</button></div><div class="settings-row"><span>Progresso</span><button class="pixel-button secondary" id="resetProgress">RESETAR PROGRESSO</button></div>`);
  $('#modalSoundToggle').addEventListener('click',()=>{state.settings.sound=!state.settings.sound;saveState();$('#modalSoundToggle').textContent=state.settings.sound?'ATIVADO':'DESATIVADO';$('#modalSoundToggle').className=`pixel-button ${state.settings.sound?'primary':'secondary'}`;updateHUD();});
  $('#resetProgress').addEventListener('click',()=>{if(confirm('Resetar todo o progresso deste navegador?')){state=structuredClone(DEFAULT_STATE);saveState();updateHUD();closeModal();toast('PROGRESSO RESETADO');animateHeroText();}});
}
function profileContent(){return `<div><div class="settings-row"><span>Nome</span><strong>${escapeHtml(state.name)}</strong></div><div class="settings-row"><span>Nível</span><strong>${state.level} — ${levelInfo().title}</strong></div><div class="settings-row"><span>XP</span><strong>${state.xp}</strong></div><div class="settings-row"><span>Missões concluídas</span><strong>${state.completedMissions.length}/5</strong></div><button class="pixel-button primary" id="editName" style="margin-top:16px;width:100%">ALTERAR NOME</button></div>`}

function openModal(title,body){
  lastFocusedElement=document.activeElement;
  $('#modalTitle').textContent=title; $('#modalBody').innerHTML=body; $('#modalBackdrop').hidden=false; document.body.style.overflow='hidden'; $('#modalClose').focus();
}
function closeModal(){ $('#modalBackdrop').hidden=true;document.body.style.overflow=''; if(lastFocusedElement?.focus)lastFocusedElement.focus(); }
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),1700);}
function xpFloat(amount){const el=$('#xpFloat');el.textContent=`+${amount} XP`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
function toggleSound(){state.settings.sound=!state.settings.sound;saveState();updateHUD(); if(state.settings.sound) playTone('click');}
function playTone(kind){
  if(!state.settings.sound)return;
  try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator();const g=audioCtx.createGain();const base=kind==='success'?600:kind==='wrong'?170:kind==='achievement'?880:440;o.frequency.value=base;o.type='square';g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.12);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.12);}catch(e){}
}

// Salva o nome via painel de perfil sem exigir backend.
document.addEventListener('click', e=>{
  if(e.target?.id==='editName'){
    const next=prompt('Como devemos chamar você?',state.name);
    if(next && next.trim()){state.name=next.trim().slice(0,24);saveState();updateHUD();closeModal();toast('NOME ATUALIZADO');}
  }
});

init();
