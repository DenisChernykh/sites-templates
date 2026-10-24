import fs from 'node:fs';
const size = process.argv[2] || 'desktop';
const rootId = process.argv[3];
const sections = JSON.parse(fs.readFileSync(`reference/control/${size}-compiled.json`, 'utf8'));
const width = sections[0].viewport.width;
const footer = sections.find(s => s.name === 'Footer').box;
const height = footer.y + footer.height;
const root = rootId ? JSON.stringify(rootId) : `Insert('document',${JSON.stringify({type:'frame',name:`01 — CONTROL · Mindify original · ${size} ${width}`,x:size==='mobile'?-27500:-28400,y:40097.69696969697,width,height,layout:'none',clip:true,fill:'#FCFCFF',placeholder:true,metadata:{type:'mindify-control',viewport:width,source:'https://mindify.framer.website/'}})})`;
const code = `const root=${root};Update(root,{placeholder:true});const sections=${JSON.stringify(sections)};
const ids=Object.fromEntries(Get(root,n=>n.metadata?.sourceKey?[n.metadata.sourceKey,n.id]:undefined));
const existingSections=Object.fromEntries((Get(root,{depth:1}).children||[]).filter(n=>n.metadata?.section).map(n=>[n.metadata.section,n.id]));
const sectionIds=[];
for(const section of sections.filter(x=>x.name!=='Header').concat(sections.filter(x=>x.name==='Header'))){
 const byParent=new Map();for(const item of section.nodes){const list=byParent.get(item.parent)||[];list.push(item);byParent.set(item.parent,list);}
 const add=(key,parent)=>{for(const item of (byParent.get(key)||[]).sort((a,b)=>a.z-b.z)){
  const props={...item.props};if(item.parent===null&&section.name!=='Header')props.fill='#FCFCFF';
  let id=item.parent===null?existingSections[section.name]:ids[item.key];
  if(id){if(Get(id,{depth:0}).type!==props.type)id=Replace(id,props);else{const {type,...patch}=props;Update(id,patch);}}else id=Insert(parent,props);
  ids[item.key]=id;if(item.parent===null)sectionIds.push({name:section.name,id});
  const child=Get(id,{depth:1}).children||[];
  for(const [i,path]of(item.paths||[]).entries()){if(child[i]?.type==='path'){const {type,...patch}=path;Update(child[i].id,patch);}else Insert(id,path);}
  if(item.image){const image=child.find(n=>n.type==='rectangle');if(image){const {type,...patch}=item.image;Update(image.id,patch);}else Insert(id,item.image);}
  add(item.key,id);
 }};add(null,root);
}
Move(sectionIds.find(s=>s.name==='Header').id,root);Update(root,{height:${height}});Print('CONTROL',{root,sections:sectionIds,layers:Object.keys(ids).length});`;
fs.writeFileSync(`reference/control/${size}-snippet.txt`,code);
console.log(`reference/control/${size}-snippet.txt`);
