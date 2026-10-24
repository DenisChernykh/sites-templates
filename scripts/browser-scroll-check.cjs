async page => {
  const assert=(value,message)=>{if(!value)throw Error(message)};
  await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:4173/demo/');await page.bringToFront();await page.waitForTimeout(1800);
  const heading=page.locator('[data-inview]').first();
  assert(await heading.locator('.word').first().evaluate(el=>+getComputedStyle(el).opacity)<.01,'in-view starts hidden');
  await page.mouse.wheel(0,400);await page.waitForTimeout(1000);
  const tags=await page.evaluate(()=>{
    const hero=document.querySelector('#hero'),top=hero.getBoundingClientRect().top+scrollY,start=Math.max(top-1,0),end=Math.max(top-1+hero.clientHeight,0),p=Math.max(0,Math.min(1,(scrollY-start)/(end-start)));
    return {p,values:[...document.querySelectorAll('.hero-image .floating')].map(el=>{const m=new DOMMatrixReadOnly(getComputedStyle(el).transform);return[m.m41,m.m42]})};
  });
  const offsets=[[-1,-8],[-6,-6],[-2,-10]];tags.values.forEach((xy,i)=>xy.forEach((v,axis)=>assert(Math.abs(v-offsets[i][axis]*(1-tags.p))<.01,'scroll spring endpoint')));
  await page.mouse.wheel(0,500);await page.waitForTimeout(1200);assert(await heading.locator('.word').last().evaluate(el=>+getComputedStyle(el).opacity)===1,'in-view reveal');
  await page.mouse.wheel(0,-1200);await page.waitForTimeout(1000);const returned=await page.locator('.hero-image .floating').first().evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);assert(Math.abs(returned+8)<.01,'reverse scroll');
  const slider=page.locator('#scroll-scrub');await slider.focus();await page.keyboard.press('Home');await page.waitForTimeout(100);assert(await page.locator('#scrub-label').textContent()==='0%','scrub start');await page.keyboard.press('End');await page.waitForTimeout(100);assert(await page.locator('#scrub-label').textContent()==='100%','scrub end');
  await page.mouse.wheel(0,900);await page.waitForTimeout(400);
  const background=await page.locator('.cta-background').evaluate(el=>{const p=scrollY/(document.documentElement.scrollHeight-innerHeight);return {p,scale:new DOMMatrixReadOnly(getComputedStyle(el).transform).a,opacity:+getComputedStyle(el).opacity}});assert(Math.abs(background.scale-(.8+.2*background.p))<.0001,'CTA scale');assert(Math.abs(background.opacity-(.12+.04*background.p))<.0001,'CTA opacity');
  await page.getByRole('button',{name:'Открыть меню',exact:true}).click();await page.waitForTimeout(650);await page.locator('#phone-links').getByRole('link',{name:'Обо мне'}).click();await page.waitForTimeout(650);assert(await page.locator('#phone-links').isHidden(),'menu link closes');
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForTimeout(300);assert(await page.locator('h1 .word').last().evaluate(el=>+getComputedStyle(el).opacity)===1,'reduced load visible');await page.getByRole('button',{name:'Открыть меню',exact:true}).click();assert(await page.locator('#phone-links').isVisible(),'reduced menu');await page.getByRole('button',{name:'Закрыть меню',exact:true}).click();assert(await page.locator('#phone-links').isHidden(),'reduced menu close');await page.emulateMedia({reducedMotion:'no-preference'});
  return {tags,reverseTagY:returned,background,checks:['in-view initial hidden / revealed / no replay','scroll springs forward / reverse','slider keyboard 0 / 100','document progress CTA scale / opacity','menu link closes','reduced-motion load / menu']};
}
