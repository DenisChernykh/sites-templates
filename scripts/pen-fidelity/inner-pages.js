const children=id=>Get(id,{depth:1}).children||[];
Update('wRxBA',{placeholder:true});Update('FQIdY',{fill:'#00000000'});Update('g4GoBH',{width:120,height:64,clip:false});Update('N6lKL',{x:6,y:16,stroke:'$mf-accent',strokeWidth:1.5,strokeLinecap:'round',fill:'#00000000'});Update('wRxBA',{placeholder:false});
const pages=Get((n,c)=>c.depth===0&&n.metadata?.type==='page'?n.id:undefined);
for(const root of pages){
 const page=Get(root,{depth:1}),w=page.width,mobile=w<500,home=page.metadata.url==='/';Update(root,{placeholder:true});
 if(!home){
  const hero=Get(root,n=>n.type==='frame'&&n.name.startsWith('Hero ·')?n.id:undefined)[0];
  if(hero){const h=children(hero),left=h[0],right=h[1];if(w===1440&&Get(hero,{depth:0}).layout!=='vertical'){Update(hero,{gap:16});Update(left.id,{width:488,gap:32});}if(mobile)Update(left.id,{gap:32});
   const texts=children(left.id),title=texts.find(n=>n.type==='text'&&n.name.startsWith('H1')),description=texts.find(n=>n.type==='text'&&n.name.startsWith('Вступление'));
   if(title&&description){const body=Insert(left.id,{type:'frame',name:'Заголовок и вступление · ритм Mindify',layout:'vertical',width:'fill_container',height:'fit_content',gap:16});Move(title.id,body);Move(description.id,body);Move(body,left.id,1);}
   if(page.metadata.url==='/about'&&right){const photo=children(right.id)[0];Update(photo.id,{layout:'none',clip:true,fill:{type:'image',url:'images/interior.jpg',mode:'fill'},cornerRadius:24,metadata:{type:'asset-placeholder',note:'Атмосферный интерьер, не Юля и не её кабинет; заменить реальным портретом.'}});children(photo.id).forEach(n=>Update(n.id,{enabled:false}));}
  }
 }
 const labels=Get(root,(n,c)=>{
  if(n.enabled===false){c.skipChildren();return;}
  if(n.type==='text'&&(n.name?.startsWith('Метка ·')||n.name?.startsWith('Надзаголовок'))&&!c.parentCtx?.node.name?.startsWith('Badge /'))return{id:n.id,parent:c.parentCtx?.node.id,index:c.index,content:n.content};
 });
 for(const label of labels){if(!label.parent)continue;const badge=Insert(label.parent,{type:'frame',name:'Badge / '+label.content,layout:'horizontal',width:'fit_content',height:'fit_content',padding:[5,8,4,8],fill:'$mf-white',cornerRadius:8,effect:{type:'shadow',shadowType:'outer',color:'#ADADAD14',offset:{x:0,y:8},blur:24}});Move(label.id,badge);Move(badge,label.parent,label.index);Update(label.id,{fontSize:11,letterSpacing:0});}
 if(home&&w!==1440){const grid=Get(root,n=>n.type==='frame'&&n.name==='Сетка · service'?n.id:undefined)[0];if(grid){const rows=children(grid);if(rows.length>4)Update(rows[4].id,{enabled:false});}}
 Update(root,{placeholder:false});
}
Print('INNER_PAGES_UPDATED',pages.length);
TakeScreenshot(['g4GoBH','n36H5']);
