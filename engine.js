globalThis.AidEngine = (()=>{
  const {policies} = globalThis.AID;
  const normalize = s=>String(s||'').toLowerCase().replace(/\s+/g,'');
  function filter(items,{q='',stage='',scope='',type=''}={}){
    return items.filter(p=>(!stage||p.stages.includes(stage))&&(!scope||p.scope===scope)&&(!type||p.type===type)&&(!q||normalize([p.title,p.summary,p.keywords,p.conditions,p.notes].join(' ')).includes(normalize(q))));
  }
  function answer(question,stage=''){
    const q=normalize(question).slice(0,500);
    const groups=[[/绿色通道|学费.*不够|交不起学费|没钱报到|没钱上学/,['green-channel','travel']], [/临时困难|突发|急病|灾害/,['emergency','school-hardship']], [/励志/,['motivation']], [/国家奖学金|国奖/,q.match(/研究生|硕士|博士/)||['硕士生','博士生'].includes(stage)?['graduate-national']:q.match(/中职|技校|中专|职高/)?['vocational-national']:q.match(/高中|普高/)?[]:['national-scholarship']], [/国家助学金|生活费|助学金/,q.match(/研究生|硕士|博士/)||['硕士生','博士生'].includes(stage)?['graduate-grant','graduate-income']:q.match(/中职|技校|职高/)?['vocational-grant']:q.match(/高中|普高/)?['high-grant']:['national-grant']], [/贷款|利率|还款|生源地/,q.match(/研究生|硕士|博士/)||['硕士生','博士生'].includes(stage)?['loan-graduate']:['loan-undergrad']], [/新生奖|校长特别/,q.match(/博士/)?['graduate-fresh-doctor']:['graduate-fresh-master']], [/学业奖/,q.match(/博士/)?['graduate-academic-doctor']:['graduate-academic-master']], [/勤工|兼职|工时/,['work-study','three-assistant']], [/学费减免|免学费|免学杂费/,q.match(/高中/)?['high-tuition']:q.match(/中职|技校/)?['vocational-tuition']:['school-tuition']], [/校奖|学业优秀|综合奖/,['school-merit','school-single']], [/单项|志愿|公益|创新/,['school-single']], [/困难认定|经济困难|建档|怎么申请资助/,['recognition','national-grant']], [/入伍|退役|当兵/,['military','retired-grant']], [/苏北|基层|就业补偿/,['subei','grassroots']], [/社会|瑞华|泰兴|中信|新长城|新化原/,['school-social','ruihua','taixing']], [/三助|助教|助研|助管/,['three-assistant']], [/工资|非定向|承诺书/,['graduate-income']], [/高中|高一|高二|高三/,['high-grant','high-tuition','travel']], [/中职|中专|职高|技校/,['vocational-national','vocational-grant','vocational-tuition']]];
    let ids=[];
    for(const [pattern,list] of groups) if(pattern.test(q)){ids=list;break;}
    if(!ids.length && /大一|大学新生|本科新生/.test(q)&&!/国家奖学金|国奖/.test(q))ids=['green-channel','national-grant','loan-undergrad'];
    if(!ids.length && !/国家奖学金|国奖/.test(q)) ids=filter(policies,{q:question,stage}).slice(0,3).map(p=>p.id);
    if(stage) ids=ids.filter(id=>policies.find(p=>p.id===id)?.stages.includes(stage));
    if(/高中|普高/.test(q)&&/国家奖学金|国奖/.test(q)) return {ids:[],text:'普通高中没有本专科生或中职生国家奖学金这一适用资格。可查看普通高中国家助学金、免学杂费及当地校内社会奖助政策。资料不足时，请向就读学校资助部门核实。'};
    if(!ids.length)return {ids:[],text:'已收录资料还不足以可靠回答这个问题。请补充学段和具体政策名称，或通过下方官方渠道咨询。对于个人资格、未公布名额和未核验的截止时间，我不会推测。'};
    return {ids:ids.slice(0,3),text:'根据已收录官方资料，以下项目与你的问题相关。请核对适用对象与原文；这不是资格认定，也不是实时大模型生成的答复。'};
  }
  function deadlineState(deadline,now=new Date().toISOString()){
    return new Date(deadline)<new Date(now)?'已过学院上报时间':'请确认个人申报时间';
  }
  return {filter,answer,deadlineState};
})();
