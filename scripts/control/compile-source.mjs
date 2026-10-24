import fs from 'node:fs';

const size = process.argv[2] || 'desktop';
const captures = JSON.parse(fs.readFileSync(`reference/control/${size}.json`, 'utf8'));
if(size==='framer-badge'){
  const masks=JSON.parse(fs.readFileSync('reference/control/framer-badge-masks.json','utf8'));
  for(const n of captures[0].nodes){const mask=masks.find(m=>m.name===n.name);if(mask){n.kind='svg';n.svg=mask.mask.match(/<svg.*?<\/svg>/s)[0].replaceAll('\\"','"');n.style.backgroundColor='rgba(0, 0, 0, 0)';}}
}
const split = value => {
  const out = []; let depth = 0, start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++;
    if (value[i] === ')') depth--;
    if (value[i] === ',' && depth === 0) { out.push(value.slice(start, i).trim()); start = i + 1; }
  }
  out.push(value.slice(start).trim()); return out;
};
const num = value => {
  if (String(value).startsWith('calc(')) {
    const parts = value.match(/[-\d.]+/g)?.map(Number) || [];
    return parts.length === 2 ? parts[0] * parts[1] : parts[0] || 0;
  }
  return Number.parseFloat(value) || 0;
};
const color = (value, alpha = 1) => {
  if (!value || value === 'none' || value === 'transparent') return '#00000000';
  if (value.startsWith('#')) {
    const rgb = value.length === 4 ? [...value.slice(1)].map(c => c + c).join('') : value.slice(1, 7);
    return `#${rgb}${alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : ''}`;
  }
  const parts = value.match(/[\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3) throw Error('Unknown color: ' + value);
  return '#' + parts.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('') + (parts.length > 3 || alpha < 1 ? Math.round((parts[3] ?? 1) * alpha * 255).toString(16).padStart(2, '0') : '');
};
const gradient = value => {
  if (!value || value === 'none') return;
  const type = value.startsWith('radial-gradient') ? 'radial' : 'linear';
  const args = split(value.slice(value.indexOf('(') + 1, -1));
  let angle = 180;
  if (/deg|^to /.test(args[0])) {
    const a = args.shift(); angle = a.includes('deg') ? num(a) : a.includes('right') ? 90 : a.includes('left') ? 270 : a.includes('top') ? 0 : 180;
  } else if (!/^(#|rgb|transparent)/.test(args[0])) args.shift();
  const colors = args.map((arg, i) => {
    const match = arg.match(/^(rgba?\([^)]*\)|#[\da-f]+|transparent)(?:\s+([-\d.]+)(%|px))?/i);
    if (!match) throw Error('Unknown gradient stop: ' + arg);
    return {color: color(match[1]), position: match[2] ? Math.max(0, Math.min(1, Number(match[2]) / 100)) : i / (args.length - 1)};
  });
  return {type:'gradient', gradientType:type, rotation:(360-angle)%360, ...(type==='radial'?{center:{x:.5,y:.5},size:{width:1,height:1}}:{size:{height:1}}), colors};
};
const imagePath = (section, name, src) => {
  const images = {'Hero':'f1d3bf29b7e4045d.jpg','About':'d07f40cd5c5959ff.jpg','Social Proof':'d1a7ffd9ac5c4fb9.png','How It Works':'e965480c613ffb38.jpg','CTA':'e965480c613ffb38.jpg','Footer':'0e5a28ec4a3c17a7.jpg'};
  if(section==='Services') {
    if(src?.includes('H11U2dbWXHrKYYOEoiUkp5cJjw')) return 'images/mindify.framer.website/individual-desktop.jpg';
    if(src?.includes('57QcV0RtKgRSj6Jtx0lMjtkh1Is')) return 'images/mindify.framer.website/ae18e67244edd3a3.jpg';
    if(name.includes('Couples')) return 'images/mindify.framer.website/5767da9de2d23ee9.jpg';
    if(name.includes('Individual')) return 'images/mindify.framer.website/ae18e67244edd3a3.jpg';
    if(name.includes('Grief')) return 'images/mindify.framer.website/e0b38f624dd1e17e.jpg';
    return 'images/mindify.framer.website/104a24d870e679c2.jpg';
  }
  if(!images[section]) throw Error('No image mapping: '+section+' '+name);
  return 'images/mindify.framer.website/'+images[section];
};
const effects = s => {
  const out=[];
  if(s.boxShadow && s.boxShadow!=='none') for(const value of split(s.boxShadow)) {
    const c=value.match(/rgba?\([^)]*\)/)?.[0];
    const p=value.replace(c||'', '').match(/-?[\d.]+px/g)?.map(num);
    if(c && p?.length>=3)out.push({type:'shadow',shadowType:value.includes('inset')?'inner':'outer',color:color(c),offset:{x:p[0],y:p[1]},blur:p[2],spread:p[3]||0});
  }
  const blur=s.backdropFilter?.match(/blur\(([\d.]+)px\)/);
  if(blur)out.push({type:'background_blur',radius:Number(blur[1])});
  return out.length?out:undefined;
};
const resolveVar = (value, vars) => {
  let result=value;
  for(let i=0;i<8 && result?.includes('var(');i++) {
    const start=result.indexOf('var(');let depth=1,end=start+4;
    while(end<result.length&&depth){if(result[end]==='(')depth++;if(result[end]===')')depth--;end++;}
    const args=split(result.slice(start+4,end-1));
    result=result.slice(0,start)+(vars[args[0]]||args.slice(1).join(',')||'0')+result.slice(end);
  }
  return result;
};
const svgChildren = n => {
  const vb=(n.svg.match(/viewBox="([^"]+)"/)?.[1]||'0 0 24 24').split(/[ ,]+/).map(Number);
  const out=[];let index=0;
  for(const match of n.svg.matchAll(/<path\b([^>]+)>/g)) {
    const attrs=Object.fromEntries([...match[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    const v=key=>resolveVar(attrs[key],n.vars||{});
    const t=v('transform')?.match(/translate\(([-\d.]+)(?:[ ,]+([-\d.]+))?\)/);
    const tx=t?Number(t[1]):0,ty=t?Number(t[2]||0):0;
    const node={type:'path',name:`${n.name} / исходный контур ${++index}`,x:0,y:0,width:n.box.width,height:n.box.height,geometry:attrs.d,viewBox:[vb[0]-tx,vb[1]-ty,vb[2],vb[3]],fill:color(v('fill')==='currentColor'?n.style.color:v('fill')||'#000',num(v('fill-opacity')||'1'))};
    if(v('stroke')&&v('stroke')!=='none') Object.assign(node,{stroke:color(v('stroke')==='currentColor'?n.style.color:v('stroke'),num(v('stroke-opacity')||'1')),strokeWidth:num(v('stroke-width')||'1')*n.box.width/vb[2],strokeLinecap:v('stroke-linecap')||'butt',strokeLinejoin:v('stroke-linejoin')||'miter'});
    out.push(node);
  }
  if(!out.length)throw Error('SVG without paths: '+n.key);
  return out;
};
const croppedImage = (n, section) => {
  const w=n.box.width,h=n.box.height,nw=n.natural?.width||w,nh=n.natural?.height||h;
  const fit=n.style.objectFit;
  const scale=fit==='contain'?Math.min(w/nw,h/nh):Math.max(w/nw,h/nh);
  const sw=fit==='fill'?w:nw*scale,sh=fit==='fill'?h:nh*scale;
  const positions=(n.style.objectPosition||'50% 50%').split(' ');
  const pos=(v,delta)=>v?.endsWith('%')?delta*num(v)/100:v==='left'||v==='top'?0:v==='right'||v==='bottom'?delta:v==='center'?delta/2:num(v);
  return {type:'rectangle',name:section+' / исходный фотоматериал',x:pos(positions[0],w-sw),y:pos(positions[1],h-sh),width:sw,height:sh,fill:{type:'image',url:imagePath(section,n.name,n.src),mode:'stretch'}};
};
const compiled = captures.map(section=>{
  for(const n of section.nodes)if(n.parent===null&&typeof n.box!=='object')n.box={...section.box};
  const sourceByKey=new Map(section.nodes.map(n=>[n.key,n]));
  const nodes=section.nodes.map(n=>{
    const s=n.style,p=sourceByKey.get(n.parent)?.box||{x:0,y:0};
    const props={type:n.kind==='text'?'text':'frame',name:`${section.name} / ${n.name}`,x:n.box.x-p.x,y:n.box.y-p.y,width:n.box.width,height:n.box.height,metadata:{type:'mindify-source-layer',sourceKey:n.key,tag:n.tag}};
    const opacity=Number(s.opacity);if(opacity>=.01&&opacity<1)props.opacity=opacity;
    if(n.kind==='text'&&n.box.width<1&&n.box.height<1)props.enabled=false;
    if(n.kind==='text') Object.assign(props,{content:s.textTransform==='uppercase'?n.text.toUpperCase():s.textTransform==='capitalize'?n.text.replace(/\b\w/g,c=>c.toUpperCase()):n.text,fontFamily:s.fontFamily.split(',')[0].replaceAll('"',''),fontSize:num(s.fontSize),fontWeight:s.fontWeight,fontStyle:s.fontStyle==='italic'?'italic':undefined,lineHeight:num(s.lineHeight)/num(s.fontSize)||1.2,letterSpacing:num(s.letterSpacing),textGrowth:'fixed-width-height',fill:color(s.color),textAlign:['left','right','center','justify'].includes(s.textAlign)?s.textAlign:'left',...(n.href?{href:n.href}:{})});
    else {
      if(props.type==='frame'){props.layout='none';props.clip=s.overflowX==='hidden'||s.overflowY==='hidden'||n.kind==='svg'||n.kind==='image';}
      const radius=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'].map(k=>num(s[k]));if(radius.some(Boolean))props.cornerRadius=radius;
      const fill=[];if(color(s.backgroundColor)!=='#00000000')fill.push(color(s.backgroundColor));
      if(s.backgroundImage!=='none')fill.push(gradient(s.backgroundImage));if(fill.length)props.fill=fill.length===1?fill[0]:fill;
      const stroke=num(s.borderTopWidth);if(stroke){props.stroke=color(s.borderTopColor);props.strokeWidth=stroke;props.strokeAlignment='inner';}
      const effect=effects(s);if(effect)props.effect=effect;
    }
    if(n.kind==='frame' && s.transform.startsWith('matrix(')) {
      const [a,b,c,d]=s.transform.slice(7,-1).split(',').map(Number),w=num(s.width),h=num(s.height);
      if(Math.abs(b)>.01 && Math.abs(c)>.01){props.width=w;props.height=h;props.rotation=-Math.atan2(b,a)*180/Math.PI;props.x-=Math.min(0,a*w,c*h,a*w+c*h);props.y-=Math.min(0,b*w,d*h,b*w+d*h);}
    }
    if(n.parent===null){props.name=`Mindify / ${section.name}`;props.x=section.box.x;props.y=section.box.y;props.metadata={type:'mindify-source-section',section:section.name};}
    const paths=n.kind==='svg'?svgChildren(n):undefined;
    if(paths && section.name==='How It Works' && s.transform.startsWith('matrix(')) {
      props.rotation=0;
      const [a,b,c,d]=s.transform.slice(7,-1).split(',').map(Number);
      const originalW=num(s.width),originalH=num(s.height);
      for(const path of paths){
        if(/[^MC\d.\s,-]/.test(path.geometry))throw Error('Unsupported rotated source path');
        const vb=path.viewBox;let index=0,lastX=0;
        const coordinates=path.geometry.replace(/[-\d.]+/g,v=>{
          const value=Number(v);if(index++%2===0){lastX=(value-vb[0])/vb[2]*originalW-originalW/2;return '@X';}
          const y=(value-vb[1])/vb[3]*originalH-originalH/2;
          return `@Y${a*lastX+c*y+props.width/2},${b*lastX+d*y+props.height/2}@`;
        });
        path.geometry=coordinates.replace(/@X\s+@Y([^@]+)@/g,(_,pair)=>pair);
        path.strokeWidth*=originalW/n.box.width;path.viewBox=[0,0,props.width,props.height];
      }
    }
    if(n.kind==='text') {
      if(props.fontFamily==='sans-serif')props.fontFamily='Inter';
      const links={'About Me':'#about','Services':'#services','How It Works':'#how','Testimonials':'#testimonials','Book A Session':'https://cal.com/','Free Remix':'https://framer.link/yzjVADp','Mindify':'https://mindify.framer.website/','By Justyna':'https://framer.link/98SyoXE'};
      if(links[n.text])props.href=links[n.text];
    }
    return {key:n.key,parent:n.parent,z:Number(s.zIndex)||0,props,...(paths?{paths}:{}),...(n.kind==='image'?{image:croppedImage(n,section.name)}:{})};
  });
  return {name:section.name,viewport:section.viewport,box:section.box,nodes};
});
fs.writeFileSync(`reference/control/${size}-compiled.json`,JSON.stringify(compiled,null,2)+'\n');
console.log(JSON.stringify({size,sections:compiled.length,layers:compiled.flatMap(s=>s.nodes).length}));
