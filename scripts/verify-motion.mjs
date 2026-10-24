import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {spring,inertia} from '../demo/motion-physics.mjs';
import {springEasing,TickerMotion,panVelocity,wrapPosition,mixColor} from '../demo/motion-runtime.mjs';
const fixtures=JSON.parse(await readFile(new URL('../reference/motion-fixtures.json',import.meta.url)));
let samples=0,maxError=0;
function equal(actual,expected){const error=Math.abs(actual-expected);maxError=Math.max(maxError,error);assert.ok(error<=1e-9,`${actual} != ${expected}`);samples++}
for(const {options,samples:points} of fixtures.springs){const g=spring(options);for(const [t,value,velocity,done] of points){equal(g.next(t).value,value);equal(g.velocity(t),velocity);assert.equal(g.next(t).done,done)}}
for(const {options,samples:points} of fixtures.inertia){const g=inertia(options);for(const [t,value,done] of points){equal(g.next(t).value,value);assert.equal(g.next(t).done,done)}}
for(const velocity of [-1200,1200])for(const speed of [6,30]){
 const m=new TickerMotion();m.release(0,velocity,0);let previous=0,handoff;
 for(let t=1000/60;t<8000;t+=1000/60){const momentum=!!m.momentum;m.step(t,1000/60,speed);if(momentum&&!m.momentum){handoff=t;equal(m.position-previous,-speed/60);break}previous=m.position}
 assert.ok(handoff>2000&&handoff<6000);
}
const stale=new TickerMotion();stale.release(0,1000,0);stale.step(100,40,30);assert.equal(stale.momentum,null);
const held=[{x:0,timestamp:0},{x:100,timestamp:400},...Array.from({length:15},(_,i)=>({x:100,timestamp:416+i*16}))];assert.equal(panVelocity(held),0);
assert.equal(panVelocity([{x:0,timestamp:0},{x:60,timestamp:60},{x:120,timestamp:120}]),1000);
for(const value of [-9000,-1416,-1,0,1,9000]){const result=wrapPosition(value,1416);assert.ok(result>=-1416&&result<0);equal(((value-result)/1416)%1,0)}
assert.deepEqual(mixColor([0,0,0],[255,255,255],.5),[180,180,180]);
for(const duration of [400,700]){const easing=springEasing({duration,bounce:.2});assert.equal(easing.duration,duration);assert.ok(easing.easing.startsWith('linear(0, '));}
const appearances=JSON.parse(await readFile(new URL('../reference/appear-fixtures.json',import.meta.url)));
let nativeCurves=0;
for(const a of appearances.animations.filter(a=>a.options.easing.startsWith('linear('))){const bounce=['framer-en1e4j-container','framer-1i6qno3-container'].includes(a.component)?.2:0;assert.equal(springEasing({duration:a.options.duration,bounce}).easing,a.options.easing);nativeCurves++}
const result={nativeCurves,numericalSamples:samples,maxAbsoluteError:maxError,tolerance:1e-9,fixtureSource:fixtures.source,checks:['published spring curves / velocities / settling','published inertia left / right / zero','auto handoff at 6 and 30 px/s','pan velocity hold / flick','bidirectional seamless wrap','gamma-correct RGB','native linear() conversion']};
await writeFile(new URL('../output/playwright/physics-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
