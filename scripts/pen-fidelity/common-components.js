const children=id=>Get(id,{depth:1}).children||[];
const img=url=>({type:'image',url,mode:'fill'});
Update('wRxBA',{placeholder:true});
const old=children('FQIdY');
Update('FQIdY',{fill:undefined,cornerRadius:0,padding:[48,0,128,0],gap:0,alignItems:'center'});
const bg=Insert('FQIdY',{type:'rectangle',name:'Облака / фон CTA · SCROLL-004',layoutPosition:'absolute',x:0,y:0,width:'fill_container',height:500,cornerRadius:24,fill:{...img('images/mindify.framer.website/e965480c613ffb38.jpg'),opacity:.16}});
Move(bg,'FQIdY',0);
const panel=Insert('FQIdY',{type:'frame',name:'Светлая панель CTA / Mindify',layout:'vertical',width:650,height:'fit_content',fill:'$mf-bg',cornerRadius:24,gap:24,padding:40,alignItems:'center'});
for(const n of old)Move(n.id,panel);
const badge=Insert(panel,{type:'frame',name:'Badge / Следующий шаг',layout:'horizontal',padding:[5,8,4,8],fill:'$mf-white',cornerRadius:8,effect:{type:'shadow',shadowType:'outer',color:'#ADADAD14',offset:{x:0,y:8},blur:24}});
Move('ToqFr',badge);Move(badge,panel,0);
for(const id of ['t1nKV','P7lhVm']){Update(id,{fill:[{type:'color',color:'$mf-bg'},{...img('images/mindify.framer.website/0e5a28ec4a3c17a7.jpg'),opacity:.2}],cornerRadius:[24,24,0,0],padding:40,gap:24,alignItems:'center'});}
Update('fV7DV',{layout:'vertical',gap:4,alignItems:'center'});Update('q9lqEQ',{content:'Юля',fontSize:24});Update('qcuiL',{content:'Инструкция к себе',fontSize:14});Update('eCFNv',{justifyContent:'center',gap:24});Update('WRc9n',{content:'© Юля, 2026',textAlign:'center'});
Update('pchOG',{content:'Юля · Инструкция к себе',fontSize:22,textAlign:'center'});for(const n of children('P7lhVm'))if(n.type==='text')Update(n.id,{textAlign:'center',fontSize:n.id==='pchOG'?22:12,fill:'$mf-muted',content:n.content?.replace(' →','').replace('Контакты заполняются перед публикацией.','').trim()});
Update('wRxBA',{placeholder:false});
const pages=Get((n,c)=>c.depth===0&&n.metadata?.type==='page'?n.id:undefined);
for(const root of pages){
 Update(root,{placeholder:true});
 const w=Get(root,{depth:0}).width,mobile=w<500;
 Get(root,(n,c)=>{
  if(n.type==='ref'&&n.ref==='FQIdY')Update(n.id,{padding:[mobile?32:48,0,mobile?64:128,0],descendants:{...(n.descendants||{}),[panel]:{width:mobile?'fill_container':Math.min(650,c.bounds.width-64),padding:mobile?24:40},[bg]:{height:mobile?460:500}}});
  if(n.type==='ref'&&n.ref==='Djere')Update(n.id,{height:188,descendants:{...(n.descendants||{}),rH9MT:{...(n.descendants?.rH9MT||{}),fontSize:24,fontWeight:'500'},e2ZGT:{...(n.descendants?.e2ZGT||{}),fontSize:16}}});
  if(n.type==='frame'&&n.name==='Footer / Compact'){Update(n.id,{fill:[{type:'color',color:'$mf-bg'},{...img('images/mindify.framer.website/0e5a28ec4a3c17a7.jpg'),opacity:.2}],cornerRadius:[24,24,0,0],alignItems:'center'});for(const t of children(n.id))if(t.type==='text')Update(t.id,{textAlign:'center',fontSize:t.name==='Бренд'?22:12,fill:'$mf-muted',content:t.content?.replace(' →','').replace('Контакты заполняются перед публикацией.','').trim()});}
 });
 Update(root,{placeholder:false});
}
Print('COMMON_UPDATED',pages.length,'CTA_PANEL',panel,'CTA_BACKGROUND',bg);
TakeScreenshot(['FQIdY','t1nKV','Djere']);
