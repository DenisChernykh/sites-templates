import {clamp,durationSpring,springEasing,springChannel,panVelocity,TickerMotion,wrapPosition,mixColor} from './motion-runtime.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),main=document.querySelector('#reference');
const data=Object.fromEntries(await Promise.all(['desktop','tablet','mobile','menu','menu-tablet','remix','framer-badge'].map(async size=>[size,await(await fetch(`../reference/control/${size}-compiled.json`)).json()])));
const raw=Object.fromEntries(await Promise.all(['desktop','tablet','mobile','menu','menu-tablet','remix','framer-badge'].map(async size=>[size,await(await fetch(`../reference/control/${size}.json`)).json()])));
let cleanup=[];
const makeChannel=(initial,write,options=durationSpring(),complete)=>{const set=springChannel(initial,write,options,reduced,complete);cleanup.push(()=>set.finish());return set;};
function fill(el,value){const list=Array.isArray(value)?value:[value];for(const v of list){if(typeof v==='string')el.style.backgroundColor=v;}}
function build(section,size,root,offset=0){
 const map=new Map(),rawMap=new Map(raw[size].find(s=>s.name===section.name).nodes.map(n=>[n.key,n]));
 for(const n of section.nodes){const p=n.props,s=rawMap.get(n.key)?.style||{},el=document.createElement(p.type==='text'&&p.href?'a':n.key==='Hero-9'?'h1':/^(About-21|Services-9|How It Works-8|Testimonials-8|CTA-13)$/.test(n.key)?'h2':'div');el.dataset.key=n.key;el.className='source-node';
  Object.assign(el.style,{left:`${p.x+(n.parent===null?offset:0)}px`,top:`${p.y}px`,width:`${p.width}px`,height:`${p.height}px`,opacity:p.opacity??1,zIndex:n.z,overflow:p.clip?'hidden':'visible',borderRadius:(Array.isArray(p.cornerRadius)?p.cornerRadius:[p.cornerRadius||0]).map(v=>v+'px').join(' ')});
  fill(el,p.fill);if(s.backgroundImage&&s.backgroundImage!=='none')el.style.backgroundImage=s.backgroundImage;
  if(p.enabled===false)el.style.display='none';
  if(s.boxShadow!=='none')el.style.boxShadow=s.boxShadow;if(s.backdropFilter!=='none')el.style.backdropFilter=s.backdropFilter;
  if(p.stroke)el.style.border=`${p.strokeWidth||1}px solid ${p.stroke}`;
  if(p.rotation)el.style.transform=`rotate(${-p.rotation}deg)`;
  if(p.type==='text'){el.classList.add('source-text');el.textContent=p.content;Object.assign(el.style,{fontFamily:p.fontFamily,fontSize:p.fontSize+'px',fontWeight:p.fontWeight,lineHeight:p.lineHeight,letterSpacing:p.letterSpacing+'px',textAlign:p.textAlign,color:p.fill,background:'transparent'});if(p.href)el.href=p.href;}
  if(n.paths){for(const path of n.paths){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',path.viewBox.join(' '));svg.style.position='absolute';const shape=document.createElementNS(svg.namespaceURI,'path');shape.setAttribute('d',path.geometry);shape.setAttribute('fill',path.fill||'none');if(path.stroke){shape.setAttribute('stroke',path.stroke);shape.setAttribute('stroke-width',(path.strokeWidth||1)*path.viewBox[2]/path.width);shape.setAttribute('stroke-linecap',path.strokeLinecap);shape.setAttribute('stroke-linejoin',path.strokeLinejoin);}svg.append(shape);el.append(svg);}}
  if(n.image){const p=n.image,img=document.createElement('img');img.src='../'+p.fill.url;img.alt=rawMap.get(n.key)?.name||'';Object.assign(img.style,{position:'absolute',left:p.x+'px',top:p.y+'px',width:p.width+'px',height:p.height+'px',maxWidth:'none'});el.append(img);}
  (n.parent===null?root:map.get(n.parent)).append(el);map.set(n.key,el);
 }
 return map;
}
function animatedOpacity(el,from,to,options,delay=0){el._opacityAnimation?.cancel();el.style.opacity=from;if(reduced.matches){el.style.opacity=to;return;}const a=el.animate({opacity:[from,to]},{...springEasing(options),delay,fill:'both'});el._opacityAnimation=a;cleanup.push(()=>a.cancel());a.finished.then(()=>{if(el._opacityAnimation===a){el.style.opacity=to;a.cancel();}}).catch(()=>{});}
function animateWords(el,start){const words=[];for(const text of el.textContent.split(/(\s+)/)){if(!text)continue;if(/^\s+$/.test(text)){words.push(document.createTextNode(text));continue;}const span=document.createElement('span');span.className='source-word';span.textContent=text;words.push(span);}el.replaceChildren(...words);let i=0;for(const span of el.querySelectorAll('.source-word')){const delay=start+i++*75;animatedOpacity(span,.001,1,durationSpring(400,0),delay);const y=makeChannel(10,v=>span.style.transform=`translateY(${v}px)`,{...durationSpring(400,0),restDelta:.001});y(0,{from:10,delay});}}
function enableButtons(map,sections){
 for(const section of sections)for(const n of section.nodes){if(n.props.content!=='Book A Session'&&n.props.content!=='Free Remix')continue;const label=map.get(n.key),textFrame=label.parentElement,button=textFrame.parentElement;button.classList.add('source-button');button.tabIndex=0;button.setAttribute('role','link');button.addEventListener('click',e=>{if(e.target!==label)label.click();});button.addEventListener('keydown',e=>{if(e.key==='Enter')label.click();});
  let current=[[73,128,204],[255,255,255]],from=current,to=current;
  const progress=makeChannel(0,v=>{current=[mixColor(from[0],to[0],v/100),mixColor(from[1],to[1],v/100)];button.style.backgroundColor=`rgb(${current[0]})`;label.style.color=`rgb(${current[1]})`;},{stiffness:250,damping:30,mass:1});
  label.classList.add('button-label');const update=hover=>{from=current;to=hover?[[255,255,255],[73,128,204]]:[[73,128,204],[255,255,255]];progress(100,{from:0});};
  button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')update(true);});button.addEventListener('pointerleave',()=>update(false));button.addEventListener('focus',()=>update(true));button.addEventListener('blur',()=>update(false));
 }
}
function enableTicker(map,compact){
 const viewport=map.get('Testimonials-10'),track=map.get('Testimonials-11'),cards=[...track.children].filter(e=>e.dataset.key).slice(0,3),width=1146;
 track.replaceChildren(...cards);Object.assign(track.style,{left:'0px',width:width+'px'});cards.forEach((e,i)=>e.style.left=i*382+'px');
 const originals=[...cards];for(let c=0;c<Math.ceil(viewport.clientWidth/width)+1;c++)for(const [i,card]of originals.entries()){const copy=card.cloneNode(true);copy.style.left=width*(c+1)+i*382+'px';copy.setAttribute('aria-hidden','true');copy.inert=true;track.append(copy);}
 viewport.classList.add('source-ticker');viewport.tabIndex=0;viewport.setAttribute('aria-label','Testimonials. Drag to scroll.');viewport.style.overflow='hidden';track.style.height=(compact?174:186)+'px';
 const motion=new TickerMotion();let last=0,hover=false,drag=null,raf,disposed=false;
 function frame(now){if(disposed)return;const delta=last?Math.max(1,Math.min(40,now-last)):1000/60;last=now;if(!reduced.matches)motion.step(now,delta,hover?6:30);
  if(drag?.point){const offset=drag.point.x-drag.x;if(!drag.started&&Math.hypot(offset,drag.point.y-drag.y)>=3){drag.started=true;drag.origin=motion.position;}if(drag.started){motion.position=drag.origin+offset;drag.history.push({x:drag.point.x,timestamp:now});}}
  track.style.transform=`translateX(${wrapPosition(motion.position,width)}px)`;raf=requestAnimationFrame(frame);
 }raf=requestAnimationFrame(frame);cleanup.push(()=>{disposed=true;cancelAnimationFrame(raf);});
 viewport.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover=true;});viewport.addEventListener('pointerleave',()=>hover=false);
 viewport.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0||drag)return;motion.stop();drag={id:e.pointerId,x:e.pageX,y:e.pageY,history:[{x:e.pageX,timestamp:last||performance.now()}]};viewport.setPointerCapture(e.pointerId);});
 viewport.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)drag.point={x:e.pageX,y:e.pageY};});
 const release=e=>{if(!drag||drag.id!==e.pointerId)return;if(drag.started&&!reduced.matches)motion.release(motion.position,panVelocity(drag.history),performance.now());drag=null;};for(const event of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(event,release);
 viewport.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();motion.stop();motion.position+=e.key==='ArrowLeft'?80:-80;}});
}
function mount(){
 cleanup.forEach(fn=>fn());cleanup=[];main.replaceChildren();
 const size=innerWidth>=1200?'desktop':innerWidth>=600?'tablet':'mobile',sections=data[size],base=sections[0].viewport.width,compact=size!=='desktop',offset=(innerWidth-base)/2,map=new Map();
 main.style.width=innerWidth+'px';main.style.height=Math.ceil(sections.find(s=>s.name==='Footer').box.y+sections.find(s=>s.name==='Footer').box.height)+'px';
 for(const section of sections){const made=build(section,size,main,offset);for(const [key,value]of made)map.set(key,value);const el=made.get(section.nodes[0].key);if(section.name==='Header'){el.classList.add('reference-header');el.style.left=offset+'px';el.style.zIndex=50;}else el.id={Hero:'hero',About:'about',Services:'services','How It Works':'how',Testimonials:'testimonials',CTA:'cta'}[section.name]||section.name.toLowerCase();}
 enableButtons(map,sections);enableTicker(map,compact);
 animateWords(map.get('Hero-9'),0);animateWords(map.get('Hero-11'),300);animatedOpacity(map.get('Hero-3'),.001,1,durationSpring(400),500);animatedOpacity(map.get('Hero-12'),.001,1,durationSpring(700),1000);
 const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&e.intersectionRatio>=1){e.target.style.opacity=1;animateWords(e.target,e.target.dataset.delay==='200'?200:100);io.unobserve(e.target);}},{threshold:1});
 for(const [key,delay]of[['About-21',100],['Services-9',100],['How It Works-8',200],['Testimonials-8',200],['CTA-13',100]]){const el=map.get(key);el.dataset.delay=delay;el.style.opacity=.001;io.observe(el);}cleanup.push(()=>io.disconnect());
 const mail=map.get(compact?'About-17':'About-13');if(mail){const scale=makeChannel(1,v=>{mail.style.transform=`scale(${v})`;mail.style.transformOrigin='center';});mail.addEventListener('pointerenter',()=>scale(1.1));mail.addEventListener('pointerleave',()=>scale(1));mail.tabIndex=0;mail.setAttribute('role','link');mail.addEventListener('click',()=>location.href='mailto:justyna.framer@gmail.com');}
 const offsets=[[-1,-8],[-6,-6],[-2,-10]],tags=['Hero-23','Hero-27','Hero-31'].map((key,i)=>{const el=map.get(key),xy=[...offsets[i]];return xy.map((v,axis)=>makeChannel(v,n=>{xy[axis]=n;el.style.transform=`translate(${xy[0]-offsets[i][0]}px,${xy[1]-offsets[i][1]}px)`;},{stiffness:500,damping:60,mass:1,restDelta:.001,restSpeed:.01}));});
 const onScroll=()=>{const p=clamp(scrollY/sections.find(s=>s.name==='Hero').box.height);tags.forEach((set,i)=>set.forEach((write,axis)=>write(offsets[i][axis]*(1-p))));const q=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)),bg=map.get('CTA-2');bg.style.transform=`scale(${.8+.2*q})`;bg.style.transformOrigin='center';bg.style.opacity=.2*(.6+.2*q);};addEventListener('scroll',onScroll,{passive:true});onScroll();cleanup.push(()=>removeEventListener('scroll',onScroll));
 if(compact){
  const closed=map.get('Header-0'),menuSize=size==='tablet'?'menu-tablet':'menu',openSection=data[menuSize][0],holder=document.createElement('div'),m=build(openSection,menuSize,holder,offset),next=m.get('Mobile Menu-0'),icon=m.get('Mobile Menu-7'),nav=m.get('Mobile Menu-10');
  next.classList.add('reference-header');Object.assign(next.style,{left:offset+'px',height:'54px',overflow:'hidden',visibility:'hidden',zIndex:50});main.append(next);let open=false;
  const height=makeChannel(54,v=>next.style.height=v+'px',durationSpring(),target=>{if(!open&&target===54){next.style.visibility='hidden';closed.style.visibility='visible';}});
  const middle=map.get('Header-9').cloneNode(true);icon.append(middle);
  const line=makeChannel(0,v=>{for(const [openKey,closedKey]of[['Mobile Menu-8','Header-8'],['Mobile Menu-9','Header-10']]){const el=m.get(openKey),a=sections[0].nodes.find(n=>n.key===closedKey).props,b=openSection.nodes.find(n=>n.key===openKey).props;el.style.left=(a.x+(b.x-a.x)*v)+'px';el.style.top=(a.y+(b.y-a.y)*v)+'px';el.style.transform=`rotate(${-(b.rotation||0)*v}deg)`;}middle.style.opacity=1-v;});
  const toggle=()=>{open=!open;next.style.visibility='visible';closed.style.visibility='hidden';icon.setAttribute('aria-expanded',String(open));height(open?openSection.box.height:54);line(open?1:0);animatedOpacity(nav,Number(getComputedStyle(nav).opacity),open?1:0,durationSpring(),open?200:0);};
  nav.style.opacity=0;line(0,{from:0});
  for(const el of [icon,map.get('Header-7')]){el.style.cursor='pointer';el.setAttribute('role','button');el.setAttribute('aria-label','Toggle menu');el.tabIndex=0;el.addEventListener('click',toggle);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});}
  for(const a of next.querySelectorAll('a'))a.addEventListener('click',()=>{if(open)toggle();});enableButtons(m,[openSection]);
  const escape=e=>{if(e.key==='Escape'&&open)toggle();};addEventListener('keydown',escape);cleanup.push(()=>removeEventListener('keydown',escape));
 }
 for(const key of ['remix','framer-badge']){const sec=data[key][0],holder=document.createElement('div'),m=build(sec,key,holder,0),el=m.get(sec.nodes[0].key);el.classList.add('fixed-widget');el.style.zIndex=80;el.style.top='auto';el.style.left=key==='remix'?(compact?(size==='mobile'?'16px':'20px'):'auto'):'auto';el.style.right=key==='remix'?(compact?'auto':'20px'):'20px';el.style.bottom=key==='remix'&&!compact?'70px':'20px';main.append(el);enableButtons(m,[sec]);if(key==='framer-badge'){el.style.cursor='pointer';el.setAttribute('role','link');el.tabIndex=0;el.addEventListener('click',()=>location.href='https://www.framer.com');}}
 document.documentElement.dataset.referenceReady=size;
}
await Promise.all([document.fonts.load('16px "Apfel Grotezk"'),document.fonts.load('500 16px "Apfel Grotezk"'),document.fonts.load('16px "Give You Glory"')]);
mount();let timer;addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(mount,120);});
