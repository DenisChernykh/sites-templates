async page => {
  const demo=page.url().includes('127.0.0.1');
  await page.addInitScript(()=>{
    window.__motionCapture=[];
    const original=Element.prototype.animate;
    Element.prototype.animate=function(frames,options){
      const animation=original.call(this,frames,options);
      const key=this.closest('[data-words],[data-fade],.framer-dd4sey,.framer-6dslhb,.framer-en1e4j-container,.framer-1i6qno3-container');
      if(key&&frames.opacity)window.__motionCapture.push({component:key.dataset.words||key.dataset.fade||key.className,text:this.textContent.trim(),frames,options});
      return animation;
    };
  });
  await page.goto(demo?'http://127.0.0.1:4173/demo/':'https://mindify.framer.website/');await page.bringToFront();await page.waitForTimeout(2000);
  return {surface:demo?'demo':'Mindify',animations:await page.evaluate(()=>window.__motionCapture)};
}
