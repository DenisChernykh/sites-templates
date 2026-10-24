async page => {
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const demo=page.url().includes('127.0.0.1');
  const target=demo?'.ticker-window':'.framer-1mewdbi';
  const moving=demo?'.ticker-track':'.framer-1mewdbi > ul';
  await page.setViewportSize({width:1440,height:1000});
  if(demo)await page.reload();
  await page.bringToFront();
  await page.locator(target).scrollIntoViewIfNeeded();
  await page.mouse.move(20,100);
  await page.waitForTimeout(400);
  const rect=await page.locator(target).boundingBox();
  const y=rect.y+rect.height/2;
  await page.mouse.move(700,y);await page.mouse.move(20,100);await page.waitForTimeout(200);
  async function sample(ms){
    return page.evaluate(async({moving,ms})=>{
      const el=document.querySelector(moving),points=[],start=performance.now();
      const group=el.querySelector('.ticker-group'),originals=[...el.querySelectorAll('.ticker-item[aria-hidden="false"]')];
      const period=group?group.getBoundingClientRect().width+32:originals.at(-1).offsetLeft+originals.at(-1).offsetWidth+32;
      let previous,position=0;
      await new Promise(resolve=>{const frame=now=>{const x=new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
        if(previous!==undefined){let delta=x-previous;if(delta>period/2)delta-=period;if(delta<-period/2)delta+=period;position+=delta}previous=x;points.push([now-start,position]);if(now-start<ms)requestAnimationFrame(frame);else resolve()};requestAnimationFrame(frame)});
      return points;
    },{moving,ms});
  }
  const speed=points=>(points.at(-1)[1]-points[0][1])*1000/(points.at(-1)[0]-points[0][0]);
  const auto=speed(await sample(500));
  await page.mouse.move(700,y);await page.waitForTimeout(200);
  const hover=speed(await sample(500));
  assert(Math.abs(auto+30)<.3,'auto speed '+auto);assert(Math.abs(hover+6)<.3,'hover speed '+hover);
  const flings=[];
  for(const direction of [-1,1]){
    const x=direction<0?800:400;
    await page.mouse.move(x,y);await page.mouse.down();
    for(let i=1;i<=12;i++){await page.mouse.move(x+direction*i*20,y);await page.waitForTimeout(16)}
    await page.mouse.up();
    const points=await sample(4800);
    const velocities=points.slice(1).map((p,i)=>[p[0],(p[1]-points[i][1])*1000/(p[0]-points[i][0])]);
    const initial=velocities.find(p=>p[0]>40)?.[1];
    const final=speed(points.slice(-12));
    assert(Math.sign(initial)===direction,'release direction');
    assert(Math.abs(final+6)<.4,'inertia handoff '+final);
    const selected=velocities.filter((p,i)=>i%9===0&&p[0]>50&&Math.sign(p[1])===direction&&Math.abs(p[1])>15);
    const logs=selected.map(([t,v])=>[t,Math.log(Math.abs(v))]);
    const meanT=logs.reduce((a,p)=>a+p[0],0)/logs.length,meanV=logs.reduce((a,p)=>a+p[1],0)/logs.length;
    const slope=logs.reduce((a,p)=>a+(p[0]-meanT)*(p[1]-meanV),0)/logs.reduce((a,p)=>a+(p[0]-meanT)**2,0);
    const timeConstant=-1/slope;
    assert(Math.abs(timeConstant-750)<40,'decay constant '+timeConstant);
    flings.push({direction,initialVelocity:initial,finalVelocity:final,fittedTimeConstant:timeConstant,samples:selected.map(p=>p.map(v=>Math.round(v*1000)/1000))});
  }
  // Holding before release must drain the velocity history instead of flinging again.
  await page.mouse.move(800,y);await page.mouse.down();await page.mouse.move(600,y,{steps:8});await page.waitForTimeout(300);await page.mouse.up();
  const heldRelease=speed(await sample(300));assert(Math.abs(heldRelease+6)<.5,'held release '+heldRelease);
  return {surface:demo?'demo':'Mindify',viewport:page.viewportSize(),auto,hover,flings,heldRelease};
}
