import {effects} from '../content/motion.mjs';
import {clamp,durationSpring,springEasing,springChannel,panVelocity,TickerMotion,wrapPosition,mixColor} from './motion-runtime.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const active=new Set(),channels=new Set();
const channel=(...args)=>{const set=springChannel(...args);channels.add(set);return set};
function opacity(el,from,to,options,delay=0){
  el._opacityAnimation?.cancel();el.style.opacity=from;
  if(reduced.matches){el.style.opacity=to;return}
  const animation=el.animate({opacity:[from,to]},{...springEasing(options),delay,fill:'both'});
  el._opacityAnimation=animation;active.add(animation);
  animation.finished.then(()=>{if(el._opacityAnimation===animation){el.style.opacity=to;animation.cancel();el._opacityAnimation=null}}).catch(()=>{}).finally(()=>active.delete(animation));
}
document.querySelectorAll('[data-words],[data-inview]').forEach(el=>{
  const walk=node=>{for(const child of [...node.childNodes]){
    if(child.nodeType===3){const fragment=document.createDocumentFragment();child.textContent.split(/(\s+)/).forEach(text=>{
      if(!text)return;if(/^\s+$/.test(text))fragment.append(text);else{const span=document.createElement('span');span.className='word';span.textContent=text;span.style.opacity=.001;span.style.transform='translateY(10px)';fragment.append(span)}
    });child.replaceWith(fragment)}else if(child.nodeName!=='BR')walk(child)
  }};walk(el)
});
function words(el,start){el.querySelectorAll('.word').forEach((word,i)=>{
  const delay=start+i*75;
  opacity(word,.001,1,durationSpring(400,0),delay);
  word._y??=channel(10,value=>{word.style.transform=`translateY(${value}px)`},{...durationSpring(400,0),restDelta:.001},reduced);
  word._y(0,{from:10,delay});
})}
function replay(){
  document.querySelectorAll('[data-words]').forEach(el=>words(el,el.dataset.words==='ANIM-003'?300:0));
  document.querySelectorAll('[data-fade]').forEach(el=>{const cta=el.dataset.fade==='ANIM-004';opacity(el,.001,1,durationSpring(cta?700:400),cta?1000:500)});
}
document.querySelector('#replay').addEventListener('click',replay);replay();
const io=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting&&entry.intersectionRatio>=1){words(entry.target,entry.target.dataset.inview==='ANIM-006'?200:100);io.unobserve(entry.target)}},{threshold:1});
document.querySelectorAll('[data-inview]').forEach(el=>io.observe(el));
const registry=document.querySelector('#registry');
effects.forEach(effect=>{
  const article=document.createElement('article');article.dataset.effect=effect.id;
  const id=document.createElement('span');id.className='effect-id';id.textContent=effect.id;
  const heading=document.createElement('h3');heading.textContent=effect.name;
  const description=document.createElement('p');description.textContent=effect.trigger+' · '+effect.duration;
  const end=document.createElement('p');end.textContent=effect.initial+' → '+effect.final;
  article.append(id,heading,description,end);registry.append(article);
});
// Motion uses a 0..100 spring for colors, and gamma-correct RGB interpolation.
// Color MotionValues have no numeric velocity: reversals start from the displayed color.
const blue=[73,128,204],white=[255,255,255];
document.querySelectorAll('.button').forEach(button=>{
  let hovered=false,focused=false,current=[blue,white],from=current,to=current;
  const progress=channel(0,value=>{
    const p=value/100;current=[mixColor(from[0],to[0],p),mixColor(from[1],to[1],p)];
    button.style.backgroundColor=`rgb(${current[0]})`;button.style.color=`rgb(${current[1]})`;
  },{stiffness:250,damping:30,mass:1},reduced);
  const update=()=>{from=current;to=hovered||focused?[white,blue]:[blue,white];progress(100,{from:0})};
  button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;update()}});
  button.addEventListener('pointerleave',()=>{hovered=false;update()});
  button.addEventListener('focus',()=>{focused=true;update()});button.addEventListener('blur',()=>{focused=false;update()});
});
const mail=document.querySelector('.mail-button');
const mailScale=channel(1,value=>{mail.querySelector('svg').style.transform=`scale(${value})`},durationSpring(),reduced);
let mailHover=false,mailFocus=false;
const updateMail=()=>mailScale(mailHover||mailFocus?1.1:1);
mail.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){mailHover=true;updateMail()}});
mail.addEventListener('pointerleave',()=>{mailHover=false;updateMail()});mail.addEventListener('focus',()=>{mailFocus=true;updateMail()});mail.addEventListener('blur',()=>{mailFocus=false;updateMail()});
const toggle=document.querySelector('.menu-toggle'),menu=document.querySelector('#phone-links'),phone=document.querySelector('#phone-nav');
const lines=[...toggle.children],closedHeight=76;
let menuOpen=false;menu.style.opacity=0;
const menuHeight=channel(closedHeight,value=>{phone.style.height=`${value}px`},durationSpring(),reduced,target=>{if(!menuOpen&&target===closedHeight)menu.hidden=true});
const lineProgress=channel(0,value=>{lines.forEach((line,i)=>{
  line.style.opacity=i===1?1-value:1;
  line.style.transform=`translateY(${i===0?9.5*value:i===2?-9.5*value:0}px) rotate(${i===0?45*value:i===2?-45*value:0}deg)`;
})},durationSpring(),reduced);
function setMenu(open){
  menuOpen=open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
  const from=Number(getComputedStyle(menu).opacity);menu.hidden=false;menu.inert=!open;
  // Natural content height is independent of an interrupted container transition.
  const height=closedHeight+28+menu.scrollHeight+16;
  menuHeight(open?height:closedHeight);lineProgress(open?1:0);
  opacity(menu,from,open?1:0,durationSpring(),open?200:0);
}
toggle.addEventListener('click',()=>setMenu(!menuOpen));menu.querySelectorAll('a,button').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuOpen){setMenu(false);toggle.focus()}});
const ticker=document.querySelector('.ticker-window'),track=document.querySelector('.ticker-track'),group=document.querySelector('.ticker-group');
const status=document.querySelector('#ticker-status'),motion=new TickerMotion();
let width=0,last=0,hover=false,drag=null,paused=false,suppressClick=false;
const resizeTicker=()=>{
  width=group.getBoundingClientRect().width+32;
  const copies=Math.max(1,Math.ceil(ticker.clientWidth/width));
  track.querySelectorAll('[data-clone]').forEach(el=>el.remove());
  for(let i=0;i<copies;i++){const clone=group.cloneNode(true);clone.dataset.clone='';clone.setAttribute('aria-hidden','true');clone.inert=true;track.append(clone)}
};
new ResizeObserver(resizeTicker).observe(ticker);resizeTicker();
function tickerFrame(now){
  const delta=last?Math.max(1,Math.min(40,now-last)):1000/60;last=now;
  const speed=hover?6:30;
  if(!paused&&!reduced.matches)motion.step(now,delta,speed);
  if(drag?.point){
    const offset=drag.point.x-drag.x;
    if(!drag.started&&Math.hypot(offset,drag.point.y-drag.y)>=3){drag.started=true;drag.origin=motion.position;suppressClick=true;ticker.classList.add('dragging')}
    if(drag.started){motion.position=drag.origin+offset;drag.history.push({x:drag.point.x,timestamp:now})}
  }
  track.style.transform=`translateX(${wrapPosition(motion.position,width)}px)`;
  status.textContent=paused||reduced.matches?'Лента приостановлена':drag?.started?'Перетаскивание':motion.momentum?'Инерция':`${speed} px/s`;
  requestAnimationFrame(tickerFrame);
}
requestAnimationFrame(tickerFrame);
ticker.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hover=true});ticker.addEventListener('pointerleave',()=>{hover=false});
ticker.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||drag)return;
  motion.stop();drag={id:event.pointerId,x:event.pageX,y:event.pageY,history:[{x:event.pageX,timestamp:last||performance.now()}]};ticker.setPointerCapture(event.pointerId);
});
ticker.addEventListener('pointermove',event=>{if(drag?.id===event.pointerId)drag.point={x:event.pageX,y:event.pageY}});
function release(event){
  if(!drag||drag.id!==event.pointerId)return;
  if(drag.started&&!paused&&!reduced.matches)motion.release(motion.position,panVelocity(drag.history),performance.now());
  drag=null;ticker.classList.remove('dragging');setTimeout(()=>{suppressClick=false},5);
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])ticker.addEventListener(event,release);
ticker.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation()}},true);
ticker.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();motion.stop();motion.position+=event.key==='ArrowLeft'?80:-80}});
document.querySelector('#ticker-pause').addEventListener('click',event=>{
  paused=!paused;motion.stop();event.currentTarget.setAttribute('aria-pressed',String(paused));event.currentTarget.textContent=paused?'Продолжить движение':'Приостановить ленту';
});
const offsets=[[-1,-8],[-6,-6],[-2,-10]];
const tagSetters=[...document.querySelectorAll('.hero-image .floating')].map((el,i)=>{
  const coordinates=[...offsets[i]];
  return coordinates.map((initial,axis)=>channel(initial,value=>{coordinates[axis]=value;el.style.transform=`translate(${coordinates[0]}px,${coordinates[1]}px)`},{stiffness:500,damping:60,mass:1,restDelta:.001,restSpeed:.01},reduced));
});
function onScroll(){
  const hero=document.querySelector('#hero'),top=hero.getBoundingClientRect().top+scrollY;
  const start=Math.max(top-1,0),end=Math.max(top-1+hero.clientHeight,0),p=clamp((scrollY-start)/(end-start));
  tagSetters.forEach((setters,i)=>setters.forEach((set,axis)=>set(offsets[i][axis]*(1-p))));
  const progress=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)),bg=document.querySelector('.cta-background');
  bg.style.transform=`scale(${.8+.2*progress})`;bg.style.opacity=.2*(.6+.2*progress);
}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();
reduced.addEventListener('change',()=>{
  if(reduced.matches){active.forEach(animation=>animation.finish());channels.forEach(set=>set.finish());motion.stop()}
  last=0;onScroll();
});
const scrub=document.querySelector('#scroll-scrub');function scrubUpdate(){const p=Number(scrub.value)/100;document.querySelector('#scrub-label').value=scrub.value+'%';document.querySelectorAll('[data-scrub]').forEach(el=>{const d=offsets[Number(el.dataset.scrub)];el.style.transform=`translate(${d[0]*(1-p)}px,${d[1]*(1-p)}px)`});const bg=document.querySelector('#scrub-bg');bg.style.transform=`scale(${.8+.2*p})`;bg.style.opacity=.2*(.6+.2*p)}scrub.addEventListener('input',scrubUpdate);scrubUpdate();
document.querySelector('#demo-form').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget,required=[...form.querySelectorAll('[required]')];required.forEach(e=>e.setAttribute('aria-invalid',String(!e.value.trim())));const invalid=required.find(e=>!e.value.trim());const status=document.querySelector('#form-status');if(invalid){status.textContent='Заполните имя и способ связи. Данные никуда не отправлены.';invalid.focus();return}status.textContent='Готово: поля прошли проверку. Это демонстрация — данные не отправлены и не сохранены.'});
