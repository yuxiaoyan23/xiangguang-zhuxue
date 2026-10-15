(()=>{
  'use strict';
  const {policies,sources,notices,stages,types,checked}=AID;
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=id=>`<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const safeRead=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback;}catch{return fallback;}};
  let saved=new Set(safeRead('xiangguang-saved',[]).filter(id=>policies.some(p=>p.id===id)));
  let checks=new Set(safeRead('xiangguang-checks',[]));
  let compare=new Set(),scope='',limit=6,resourceLimit=6,resourceTab='all',toastTimer,installPrompt;
  const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify([...value]));}catch{toast('当前浏览器限制存储，本次操作仍可继续使用');}};
  function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
  const policy=id=>policies.find(p=>p.id===id);
  const sourceLink=(id,extra='')=>`<a class="dialog-source" href="${esc(sources[id].url)}" target="_blank" rel="noopener">${esc(sources[id].title)} ↗<small>${esc(sources[id].org)} · 文件日期：${esc(sources[id].date)}${extra}</small>${sources[id].note?`<small>${esc(sources[id].note)}</small>`:''}</a>`;
  function openDialog(html){$('#dialog-content').innerHTML=`<div class="dialog-body">${html}</div>`;if(!$('#content-dialog').open)$('#content-dialog').showModal();$('#content-dialog').scrollTop=0;}
  function renderPolicies(){
    const q=$('#policy-search').value,stage=$('#stage-filter').value,type=$('#type-filter').value;
    const items=AidEngine.filter(scope==='saved'?policies.filter(p=>saved.has(p.id)):policies,{q,stage,type,scope:scope==='saved'?'':scope});
    $('#result-count').textContent=`找到 ${items.length} 项`;
    $('#policy-grid').innerHTML=items.slice(0,limit).map(p=>`<article class="policy-card"><div class="policy-card-top"><span class="badge ${p.scope==='南京工业大学'?'school':''}">${p.scope==='南京工业大学'?'南工资助':'国家政策'}</span><span class="badge kind">${esc(p.type)}</span><button class="policy-save ${saved.has(p.id)?'active':''}" data-save="${p.id}" aria-label="${saved.has(p.id)?'取消收藏':'收藏'}${esc(p.title)}" aria-pressed="${saved.has(p.id)}">${icon('bookmark')}</button></div><h3>${esc(p.title)}</h3><div class="policy-amount ${/\d/.test(p.amount)?'':'word-amount'}">${esc(p.amount)}</div><small class="policy-unit">${esc(p.unit)}</small><p>${esc(p.summary)}</p><div class="policy-audience">${icon('compass')}<span>${esc(p.stages.join(' / '))}</span></div>${p.deadline?`<div class="deadline-label">${esc(AidEngine.deadlineState(p.deadline))}</div>`:''}<div class="policy-card-bottom"><button class="policy-details" data-detail="${p.id}">查看政策 ${icon('arrow')}</button><button class="policy-compare" data-compare="${p.id}" aria-pressed="${compare.has(p.id)}">${compare.has(p.id)?'✓ 已加入':'＋ 加入对比'}</button></div></article>`).join('')||`<div class="empty-state"><h3>${scope==='saved'?'暂无符合筛选的收藏':'暂未找到符合条件的项目'}</h3><p>可以更换关键词或清除筛选。尚未收录的地方、学校项目，请查官方政策入口。</p><button class="button outline" data-reset>清除筛选</button></div>`;
    $('#load-more').hidden=items.length<=limit;$('#policy-progress').textContent=`已显示 ${Math.min(limit,items.length)} / ${items.length} 项`;
    $$('#scope-tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.scope===scope);b.setAttribute('aria-pressed',String(b.dataset.scope===scope));});
    const active=[stage,type,scope].filter(Boolean);
    $('#filter-notice').hidden=!active.length;
    $('#filter-notice').innerHTML=`正在查看：${esc(active.map(a=>a==='saved'?'我的收藏':a).join(' · '))}<button data-reset>清除筛选</button>`;
    $$('.saved-count').forEach(e=>e.textContent=saved.size);
    $('#compare-bar').hidden=compare.size===0;$('#compare-count').textContent=`已选 ${compare.size} 项政策`;
  }
  function chooseStage(stage,school=false){$('#stage-filter').value=stage;$('#chat-stage').value=stage;$('#type-filter').value='';$('#policy-search').value='';scope=school?'南京工业大学':'';limit=6;renderPolicies();$('#policies').scrollIntoView({behavior:'smooth'});}
  function detail(id){
    const p=policy(id);if(!p)return;
    const time=p.deadline?`<div class="dialog-note"><p>${esc(AidEngine.deadlineState(p.deadline))}。学院上报节点：${esc(p.deadline.slice(0,16).replace('T',' '))}（北京时间）。该日期不是学生个人提交截止时间。</p></div>`:'';
    openDialog(`<div class="eyebrow">${esc(p.scope)} / ${esc(p.type)}</div><h2>${esc(p.title)}</h2><div class="dialog-amount">${esc(p.amount)}</div><span class="dialog-unit">${esc(p.unit)}</span><p>${esc(p.summary)}</p><h3>适用对象</h3><p>${esc(p.stages.join('、'))}</p><h3>申请与评审条件</h3><p>${esc(p.conditions)}</p><div class="dialog-note"><p>${esc(p.notes)}</p></div>${time}<h3>申请准备方向</h3><ul>${p.materials.map(m=>`<li>${esc(m)}</li>`).join('')}</ul><p>这是准备方向，完整材料与表格以就读学校当年通知为准。</p><h3>官方依据与进一步核对</h3>${p.sources.map(id=>sourceLink(id)).join('')}<p style="font-size:10px;margin-top:16px">收录核对：${checked} · 非实时同步。本站不办理申请，不保证评审通过。</p><div class="dialog-actions"><button class="button" data-save="${p.id}">${saved.has(p.id)?'取消收藏':'收藏政策'}</button><button class="button outline" data-copy-policy="${p.id}">复制政策摘要</button><button class="button outline" data-question="${esc(p.title)}怎么申请？">向小光提问</button></div>`);
  }
  function renderResources(){
    const q=$('#resource-search').value.trim();
    const schoolIds=['school','schoolMerit','schoolRules','recognition','ruihua'];
    const graduateIds=['gradNational','gradFresh','gradAcademic','gradIncome','gradPortal'];
    const entries=Object.entries(sources).filter(([id,s])=>(resourceTab==='all'||(resourceTab==='school'?schoolIds.includes(id):resourceTab==='graduate'?graduateIds.includes(id):!schoolIds.includes(id)&&!graduateIds.includes(id)))&&(!q||`${s.title}${s.org}${s.date}`.includes(q)));
    $('#resource-list').innerHTML=entries.slice(0,resourceLimit).map(([id,s])=>`<a class="resource-item" href="${esc(s.url)}" target="_blank" rel="noopener"><span class="file-type ${s.url.includes('.pdf')?'pdf':''}">${s.url.includes('.pdf')?'PDF':'WEB'}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.org)}<span>·</span>${esc(s.date)}<span>·</span>核对 ${checked}</p>${s.note?`<p class="source-note">${esc(s.note)}</p>`:''}</div>${icon('external')}</a>`).join('')||'<div class="empty-state">没有符合关键词的资料，请换个关键词。</div>';
    $('#resource-more').hidden=entries.length<=resourceLimit;
  }
  function download(name,text,mime='text/plain;charset=utf-8'){
    const blob=new Blob(['\ufeff',text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('下载已发起，请查看浏览器下载列表');
  }
  const checklistItems=['已读政策原文','已确认个人截止','已备当年材料','已核实官方渠道'];
  function checklistText(){return `向光·助学｜申请准备清单\n核对日期：${checked}\n\n${checklistItems.map((t,i)=>`${checks.has(i)?'☑':'□'} ${t}`).join('\n')}\n\n1. 学段、学校、年级、学籍等条件逐项核对。\n2. 注意按学期与按学年、全国平均与个人金额的区别。\n3. 困难认定与申请材料按当年要求准备，不向陌生网站上传隐私。\n4. 学院上报时间不是学生个人截止时间，先向辅导员确认。\n5. 如实申报，保留正式提交记录，关注公示与复核程序。\n6. 助学贷款须按合同还款，不是无偿奖助学金。\n\n官方查询：https://zwfw.moe.gov.cn/zczx/\n南工本科：https://xszz.njtech.edu.cn/\n南工研究生：https://gra.njtech.edu.cn/index/tzgg.htm\n\n本站为学生公益宣传作品，具体申请和资格由学校审核。`;}
  function renderChecklist(){$('#checklist').innerHTML=checklistItems.map((t,i)=>`<label><input type="checkbox" data-check="${i}" ${checks.has(i)?'checked':''}>${t}</label>`).join('');$('#check-progress').textContent=`${checks.size} / 4`;}
  function compareOpen(){
    if(compare.size<2){toast('请至少加入2项政策进行对比');return;}
    const selected=[...compare].map(policy);
    openDialog(`<div class="eyebrow">POLICY COMPARISON</div><h2>把不同政策，放在一起看</h2><p>金额不宜直接相加；按学期、按年、贷款与无偿资助须分别理解。</p><div class="compare-wrap"><table class="compare-table"><thead><tr><th>比较维度</th>${selected.map(p=>`<th>${esc(p.title)}</th>`).join('')}</tr></thead><tbody>${[['标准',p=>`${esc(p.amount)}<br>${esc(p.unit)}`],['适用对象',p=>esc(p.stages.join('、'))],['条件',p=>esc(p.conditions)],['注意事项',p=>esc(p.notes)],['原文',p=>p.sources.map(id=>`<a href="${esc(sources[id].url)}" target="_blank" rel="noopener">${esc(sources[id].title)} ↗</a>`).join('<br>')]].map(([label,fn])=>`<tr><td>${label}</td>${selected.map(p=>`<td>${fn(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
  }
  function appendMessage(text,role='bot',html=false){const e=document.createElement('div');e.className=`chat-message ${role}`;if(html)e.innerHTML=text;else e.textContent=text;$('#chat-messages').append(e);$('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;return e;}
  function welcome(){appendMessage('你好，我是小光。可以帮你从已收录的官方资料中查找资助政策。请先选择学段，或在问题里说明身份，例如“高中有哪些资助”“研究生国奖多少钱”。我还没有接入大模型，不能确定个人资格，也不会推测未公布的信息。');}
  function openChat(){if($('#content-dialog').open)$('#content-dialog').close();if(!$('#chat-dialog').open)$('#chat-dialog').showModal();if(!$('#chat-messages').children.length)welcome();$('#chat-input').focus();}
  function ask(question){
    if(!question.trim())return;openChat();appendMessage(question,'user');$('#chat-input').value='';
    const stage=$('#chat-stage').value;const result=AidEngine.answer(question,stage);
    const html=`<p>${esc(result.text)}</p>${result.ids.map(id=>{const p=policy(id);return `<div class="answer-entry"><h3>${esc(p.title)}</h3><div class="answer-value">${esc(p.amount)} <small>${esc(p.unit)}</small></div><p>${esc(p.conditions)}</p><p class="answer-note">${esc(p.notes)}</p><a class="answer-source" href="${esc(sources[p.sources[0]].url)}" target="_blank" rel="noopener">依据：${esc(sources[p.sources[0]].title)} ↗</a><button class="text-link" data-detail="${p.id}" style="font-size:10px">完整政策与材料方向 ↗</button></div>`;}).join('')}${!result.ids.length?'<a class="answer-source" href="https://zwfw.moe.gov.cn/zczx/" target="_blank" rel="noopener">教育部政策查询 ↗</a><a class="answer-source" href="https://xszz.njtech.edu.cn/" target="_blank" rel="noopener">南工本科资助官网 ↗</a>':''}<small class="answer-time">资料核对 ${checked} · 原文与当年通知为准</small>`;
    appendMessage(html,'bot',true);
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button,a');if(!b)return;
    if(b.hasAttribute('data-open-chat'))openChat();
    if(b.dataset.question)ask(b.dataset.question);
    if(b.dataset.stage)chooseStage(b.dataset.stage);
    if(b.dataset.schoolStage)chooseStage(b.dataset.schoolStage,true);
    if(b.dataset.detail){if($('#chat-dialog').open)$('#chat-dialog').close();detail(b.dataset.detail);}
    if(b.hasAttribute('data-scope')){scope=b.dataset.scope;limit=6;renderPolicies();}
    if(b.hasAttribute('data-resource')){resourceTab=b.dataset.resource;resourceLimit=6;$$('#resource-tabs button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderResources();}
    if(b.hasAttribute('data-reset')){scope='';$('#stage-filter').value='';$('#type-filter').value='';$('#policy-search').value='';limit=6;renderPolicies();}
    if(b.dataset.save){const id=b.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);save('xiangguang-saved',saved);renderPolicies();toast(saved.has(id)?'已收藏到此浏览器':'已取消收藏');if($('#content-dialog').open)detail(id);}
    if(b.dataset.compare){const id=b.dataset.compare;if(compare.has(id))compare.delete(id);else if(compare.size<3)compare.add(id);else{toast('最多同时对比3项政策');return;}renderPolicies();}
    if(b.dataset.copyPolicy){const p=policy(b.dataset.copyPolicy),text=`${p.title}\n${p.amount} ${p.unit}\n${p.conditions}\n${p.notes}\n来源：${p.sources.map(i=>sources[i].url).join('\n')}\n核对：${checked}`;try{await navigator.clipboard.writeText(text);toast('已复制政策摘要及来源');}catch{download('政策摘要.txt',text);}}
  });
  $('#policy-total').textContent=policies.length;$('#source-count').textContent=Object.keys(sources).length;
  const identities=[['高中生','入学之前，先有底气','book'],['中职生','让技能与梦想同行','compass'],['大学新生','从容迈入大学生活','spark'],['本专科生','助学与成长的每一步','file'],['硕士生','专注科研，安心求学','book'],['博士生','向更远处探索','compass']];
  $('#identity-grid').innerHTML=identities.map(([stage,sub,i])=>`<button class="identity" data-stage="${stage}">${icon(i)}<b>${stage}</b><small>${sub}</small><svg class="identity-arrow"><use href="#i-arrow"/></svg></button>`).join('');
  for(const id of ['stage-filter','chat-stage'])for(const s of stages){const o=document.createElement('option');o.value=s;o.textContent=s;$('#'+id).append(o);}
  for(const t of types){const o=document.createElement('option');o.value=t;o.textContent=t;$('#type-filter').append(o);}
  $('#notice-list').innerHTML=notices.map(n=>`<a class="notice-row" href="${esc(sources[n.source].url)}" target="_blank" rel="noopener"><time class="notice-date">${n.date}</time><div class="notice-title">${esc(n.title)}<small class="notice-note">${esc(n.note)}</small></div><span class="notice-status">${esc(n.status)}</span>${icon('arrow')}</a>`).join('');
  const faqs=[
    ['高中生可以申请大学国家奖学金吗？','本专科生国家奖学金面向大学二年级及以上特别优秀的本专科生。普通高中学生可关注普通高中国家助学金、免学杂费及地方和学校支持；中职国家奖学金是另外的项目。','national'],
    ['3700元助学金，每个人都能拿这么多吗？','不能这样理解。3700元是本专科生国家助学金全国平均标准，学校在2500—5000元范围内分档确定个人标准。普通高中和中职国家助学金的全国平均标准是2300元。','national'],
    ['国家奖学金、励志奖学金和助学金能兼得吗？','本科同一学年，国家奖学金与国家励志奖学金不能兼得；符合条件的学生可同时获得国家助学金。校内或社会专项奖助的兼得限制需另查各项目办法。','compatibility'],
    ['学校通知的日期，就是我提交材料的最后一天吗？','不一定。通知常写的是学院向学校上报材料的时间，学院需要预留审核和公示时间。请向辅导员确认个人提交日期；本站不会将学院上报日期直接当作个人申请截止。','gradAcademic'],
    ['家庭突然遇到困难，过了集中认定时间怎么办？','及时联系辅导员，说明当前困难，咨询动态认定、临时困难补助及其他支持。不要因为错过常规批次就自行放弃，也不要向本站上传医疗、家庭收入或身份材料。','recognition'],
    ['小光是真人大使或大模型吗？资料会自动更新吗？','当前小光是本地资料检索助手，不是人工客服，尚未接入大模型。政策内容为2026年10月15日人工核对的快照，不会自动同步新文件；你可随时通过每条政策的原文入口确认最新变化。','query']
  ];
  $('#faq-list').innerHTML=faqs.map(([q,a,s])=>`<details><summary>${esc(q)}</summary><p>${esc(a)} <a href="${esc(sources[s].url)}" target="_blank" rel="noopener">查看依据 ↗</a></p></details>`).join('');
  $('#policy-search').addEventListener('input',()=>{limit=6;renderPolicies();});for(const id of ['stage-filter','type-filter'])$('#'+id).addEventListener('change',()=>{limit=6;renderPolicies();});
  $('#load-more').onclick=()=>{limit+=9;renderPolicies();};$('#resource-search').oninput=()=>{resourceLimit=6;renderResources();};$('#resource-more').onclick=()=>{resourceLimit=100;renderResources();};
  $('#school-all').onclick=()=>chooseStage('',true);$('#saved-button').onclick=()=>{scope='saved';$('#stage-filter').value='';$('#type-filter').value='';$('#policy-search').value='';limit=6;renderPolicies();$('#policies').scrollIntoView();};
  $('#compare-open').onclick=compareOpen;$('#compare-clear').onclick=()=>{compare.clear();renderPolicies();};
  $('#content-dialog .dialog-close').onclick=()=>$('#content-dialog').close();$('#chat-close').onclick=()=>$('#chat-dialog').close();
  $('#content-dialog').addEventListener('click',e=>{if(e.target===$('#content-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  $('#chat-clear').onclick=()=>{$('#chat-messages').replaceChildren();welcome();toast('已清空本次对话');};
  $('#chat-form').onsubmit=e=>{e.preventDefault();ask($('#chat-input').value);};
  $('#checklist').onchange=e=>{if(e.target.dataset.check!==undefined){const i=Number(e.target.dataset.check);e.target.checked?checks.add(i):checks.delete(i);save('xiangguang-checks',checks);renderChecklist();}};
  $('#download-checklist').onclick=()=>download('向光助学_申请准备清单.txt',checklistText());
  $('#export-directory').onclick=()=>{const cell=v=>'"'+String(v).replaceAll('"','""')+'"';download('向光助学_政策目录_2026-10-15.csv',[['项目','范围','类型','适用学段','金额或标准','单位','条件','注意事项','官方依据','资料核对日期'],...policies.map(p=>[p.title,p.scope,p.type,p.stages.join('；'),p.amount,p.unit,p.conditions,p.notes,p.sources.map(i=>sources[i].url).join('；'),checked])].map(r=>r.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8');};
  $('#download-showcase').onclick=()=>download('资助宣传大使_三处展示配文.txt',`向光·助学｜科技助学，让政策触手可及\n\n展示一：分学段政策导航\n截图位置：首页身份入口＋政策中心筛选结果\n说明：按高中、中职、本专科与研究生等身份分流，将适用对象、资助标准、条件和官方依据集中呈现，让学生与家长从“信息太多”走向“与我有关”。现场选择一个身份，再打开政策卡即可展示。\n\n展示二：官方资料库与申请支持\n截图位置：资料库＋政策详情来源，或两项政策对比\n说明：整合国家与南京工业大学官方资料，标明文件日期、核对日期及年度限制；通过政策对比、目录下载与申请清单，帮助同学核清信息、准备材料。展示时强调平均标准、个人金额和学期单位的区别。\n\n展示三：小光资料问答助手\n截图位置：提问“新生学费暂时不够怎么办”后的问答结果\n说明：一句话提问，找到相关项目和官方原文。小光以已收录资料为依据，对资料不足的问题明确告知，让资助宣传从单向讲解走向互动查询。当前是资料检索问答，未接入大模型，不标注未经验证的准确率。\n\n网址：${location.origin.startsWith('http://localhost')||location.hostname==='127.0.0.1'?'请填写实际公开部署网址':location.origin+location.pathname}\n政策核对日期：${checked}\n活动作品不代表学校官方申报平台。`);
  $('#menu-toggle').onclick=()=>{const open=$('.site-header nav').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));};$$('.site-header nav a').forEach(a=>a.onclick=()=>{$('.site-header nav').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');});
  $('#about-button').onclick=()=>openDialog('<div class="eyebrow">ABOUT & PRIVACY</div><h2>向光·助学</h2><p>为资助宣传大使活动制作的公益政策导航。服务高中、中职、大学新生、本专科生、研究生与家长，重点整理国家与南京工业大学资助信息。本站非政府或学校官方网站，不接收申请、不发放资金、不作资格审核。</p><h3>资料与时效</h3><p>内容核对至2026年10月15日，不自动同步。优先使用国家现行标准和2026年校内通知；旧制度仅用于相应制度背景。未确定的金额或年度安排已注明，请点击原文核实。</p><h3>问答能力</h3><p>当前采用本地规则与关键词检索，展示相关政策原文摘要，未接入大模型或真人服务。不以匹配结果决定个人资格，不声称准确率。</p><h3>隐私与本机存储</h3><p>收藏和清单保存在此浏览器的localStorage。问答记录只在当前页面内存中，刷新即清空，不提交给模型服务。网站托管服务可能处理访问所需的网络日志；点击外链后适用对方隐私政策。请不要输入身份证、家庭收入、医疗证明或银行卡信息。</p><h3>离线与公开访问</h3><p>首次联网打开后会尝试缓存本站核心页面及资料。离线时官方外链不可用，政策可能已有变化；不保证任意网络环境永久可达。</p><h3>开源组件</h3><p>网站使用浏览器标准能力及原创界面，无远程字体或CDN依赖。源码随交付提供，政策原文权利归发布单位。服务插件与大模型接入未启用。</p><div class="dialog-actions"><button class="button outline" id="clear-local">清除本机收藏与清单</button></div>');
  document.addEventListener('click',e=>{if(e.target.id==='clear-local'){saved.clear();checks.clear();save('xiangguang-saved',saved);save('xiangguang-checks',checks);renderChecklist();renderPolicies();toast('已清除本机收藏与准备清单');}});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('#policies').scrollIntoView();$('#policy-search').focus();}});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install-button').hidden=false;});$('#install-button').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('#install-button').hidden=true;}};
  renderPolicies();renderResources();renderChecklist();
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('reveal');observer.unobserve(e.target);}}),{threshold:.08});$$('.section-heading,.school-intro,.showcase-art').forEach(e=>observer.observe(e));}
  if('serviceWorker'in navigator && location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
  const id=new URLSearchParams(location.search).get('policy');if(id&&policy(id))detail(id);
})();
