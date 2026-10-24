import fs from 'node:fs';
import {effects} from '../../content/motion.mjs';
const words=JSON.parse(fs.readFileSync('reference/control/word-states.json','utf8'));
const extras=['menu','remix','framer-badge'].map(n=>({...JSON.parse(fs.readFileSync(`reference/control/${n}-compiled.json`))[0],name:n}));
const code=`const words=${JSON.stringify(words)},effects=${JSON.stringify(effects)},extras=${JSON.stringify(extras)};
const point=FindEmptySpace({width:2080,height:7200,direction:'bottom',padding:400});
const board=Insert('document',{type:'frame',name:'03 — MOTION · Mindify · 16 effects / 48 states',x:point.x,y:point.y,width:2080,height:7200,layout:'none',fill:'#F1F3F7',placeholder:true,metadata:{type:'mindify-motion-board'}});
const T=(p,name,content,x,y,width,size=14)=>Insert(p,{type:'text',name,content,x,y,width,textGrowth:'fixed-width',fontFamily:'Inter',fontSize:size,lineHeight:1.4,fill:'#262626'});
T(board,'Описание','Mindify — original interaction archive',40,28,1800,28);T(board,'Граница','Редактируемые состояния. Исполнение spring, hover, scroll, menu и drag — demo/reference.html. Параметры — MOTION_SPEC.md.',40,76,1980,16);
const maps=Object.fromEntries(['sq8m0','n8h47'].map(root=>[root,Object.fromEntries(Get(root,n=>n.metadata?.sourceKey?[n.metadata.sourceKey,n.id]:undefined))]));
const source=maps.sq8m0;const target={'ANIM-001':'Hero-3','ANIM-004':'Hero-12','SCROLL-001':'Hero-23','SCROLL-002':'Hero-27','SCROLL-003':'Hero-31','SCROLL-004':'CTA-2','HOVER-001':'Hero-13','HOVER-002':'Header-9','HOVER-003':'About-11','TICKER-001':'Testimonials-9'};
const extraIds={};let extraY=5700;
for(const extra of extras){const frame=Insert(board,{type:'frame',name:'Original / '+extra.name,x:40,y:extraY,width:Math.max(390,extra.box.width),height:extra.box.height,layout:'none'});const ids={};for(const item of extra.nodes){const p={...item.props};if(item.parent===null){p.x=0;p.y=0;}const id=Insert(item.parent===null?frame:ids[item.parent],p);ids[item.key]=id;for(const path of item.paths||[])Insert(id,path);}extraIds[extra.name]=ids[extra.nodes[0].key];extraY+=extra.box.height+80;}
const output=[];let rowY=160;
for(const e of effects){const h=e.id==='SCROLL-004'?390:e.id.startsWith('MENU')?420:270;
 T(board,e.id,e.id+' · '+e.name,40,rowY,1980,18);T(board,e.id+' parameters',e.trigger+' · '+e.easing,40,rowY+28,1960,12);
 const states=[];for(let phase=0;phase<3;phase++){const x=40+phase*680,y=rowY+84;T(board,e.id+' state label',['INITIAL','INTERMEDIATE','FINAL'][phase],x,rowY+58,620,12);
  const stage=Insert(board,{type:'frame',name:e.id+' / '+['initial','intermediate','final'][phase],x,y,width:640,height:h-94,layout:'none',clip:true,fill:'#FCFCFF',cornerRadius:12,metadata:{type:'mindify-motion-state',effect:e.id,phase}});states.push(stage);
  if(words[e.id]){const w=words[e.id],size=Number.parseFloat(w.fontSize),count=w.words.length;for(const [i,word]of w.words.entries()){const p=phase===0?0:phase===2?1:i<Math.floor(count/2)?1:i===Math.floor(count/2)?.5:0;Insert(stage,{type:'text',name:e.id+' / word '+(i+1),content:word.text,x:24+word.x,y:24+word.y+10*(1-p),width:word.width+1,height:word.height+2,textGrowth:'fixed-width-height',fontFamily:'Apfel Grotezk',fontSize:size,fontWeight:w.fontWeight,letterSpacing:Number.parseFloat(w.letterSpacing)||0,lineHeight:Number.parseFloat(w.lineHeight)/size,fill:'#262626',opacity:.001+.999*p});}}
  else if(e.id.startsWith('MENU')){const id=e.id==='MENU-001'&&phase===0?'hWVYO':extraIds.menu;Copy(id,stage,{x:24,y:16,opacity:e.id==='MENU-002'?[.001,.5,1][phase]:1,height:e.id==='MENU-001'?[54,180,320.8125][phase]:320.8125,clip:true});}
  else{const id=source[target[e.id]],scale=e.id==='SCROLL-004'?.5:e.id==='TICKER-001'?.4:1;const desc={};Get(id,(n,c)=>{if(c.depth>0){const p={};for(const k of ['x','y','width','height','fontSize','letterSpacing','strokeWidth'])if(typeof n[k]==='number')p[k]=n[k]*scale;if(Array.isArray(n.cornerRadius))p.cornerRadius=n.cornerRadius.map(v=>v*scale);else if(typeof n.cornerRadius==='number')p.cornerRadius=n.cornerRadius*scale;desc[n.id]=p;}});
   const base=Get(id,{depth:0}),opts={x:24,y:24,width:base.width*scale,height:base.height*scale,descendants:desc};
   if(e.id.startsWith('ANIM'))opts.opacity=[.001,.5,1][phase];
   if(e.id.startsWith('SCROLL-00')&&e.id!=='SCROLL-004'){const delta=[[-1,-8],[-6,-6],[-2,-10]][Number(e.id.slice(-1))-1];opts.x+=delta[0]*(1-phase/2);opts.y+=delta[1]*(1-phase/2);}
   if(e.id==='SCROLL-004'){const p=[.8,.9,1][phase];opts.width*=p;opts.height*=p;opts.opacity=[.12,.14,.16][phase];for(const patch of Object.values(desc))for(const key of ['x','y','width','height'])if(typeof patch[key]==='number')patch[key]*=p;}
   if(e.id==='HOVER-001'){opts.fill=['#4980CC','#BCCAE7','#FFFFFF'][phase];opts.stroke='#4980CC';opts.strokeWidth=1;desc[source['Hero-17']]={...desc[source['Hero-17']],fill:['#FFFFFF','#BCCAE7','#4980CC'][phase]};}
   if(e.id==='HOVER-002')Get(id,n=>{if(n.type==='text')desc[n.id]={...(desc[n.id]||{}),fill:phase?'#4980CC':'#696969'};});
   if(e.id==='HOVER-003')Get(id,(n,c)=>{if(c.depth===1)desc[n.id]={...(desc[n.id]||{}),x:phase?-1.6:0,y:phase?-1.6:0,width:phase?35.2:32,height:phase?35.2:32};});
   if(e.id==='TICKER-001'){opts.clip=true;desc[source['Testimonials-11']]={...(desc[source['Testimonials-11']]||{}),x:-phase*150};}
   Copy(id,stage,opts);
  }
 }output.push({effect:e.id,states});rowY+=h;
}
Update(board,{height:Math.max(extraY,rowY+60),placeholder:false});Print('MOTION_INDEX',{board,effects:output,extras:extraIds});`;
fs.writeFileSync('reference/control/states-snippet.txt',code);console.log(code.length);
