import json
from pathlib import Path
from PIL import Image, ImageDraw

out = Path('output/control')
for size, root in [('desktop','sq8m0'),('tablet','LRuxO'),('mobile','n8h47')]:
    sections = json.loads(Path(f'reference/control/{size}.json').read_text())
    tiles = json.loads(Path(f'reference/control/{size}-tiles.json').read_text())
    pen = Image.open(out / f'{root}.png').convert('RGB')
    pairs=[]
    full=Image.new('RGB',pen.size,'white')
    for sec in sections:
        box=sec['box']; y=round(box['y']); h=round(box['height']); w=round(box['width'])
        source=Image.new('RGB',(w,h),'white')
        for tile in [t for t in tiles if t['section']==sec['name']]:
            file=Path(tile['file']);img=Image.open(file if file.exists() else out/file).convert('RGB')
            source.paste(img.crop((0,round(tile['from']-tile['scrollY']),w,round(tile['to']-tile['scrollY']))),(0,round(tile['from']-box['y'])))
        pair=Image.new('RGB',(w*2+24,h+36),'#e5e7eb');d=ImageDraw.Draw(pair)
        full.paste(source,(0,y))
        d.text((8,10),f'{size} / {sec["name"]} / SOURCE',fill='black');d.text((w+32,10),'PEN editable',fill='black')
        pair.paste(source,(0,36));pair.paste(pen.crop((0,y,w,y+h)),(w+24,36))
        file=out/f'compare-{size}-{sec["name"].lower().replace(" ","-")}.jpg';pair.save(file,quality=94)
        display=pair.copy();display.thumbnail((1200,10000));pairs.append(display)
    for start in range(0,len(pairs),3):
        group=pairs[start:start+3]; sheet=Image.new('RGB',(max(p.width for p in group),sum(p.height for p in group)+20*(len(group)-1)),'#aeb4bd');top=0
        for p in group:sheet.paste(p,(0,top));top+=p.height+20
        sheet.save(out/f'gallery-{size}-{start//3}.jpg',quality=94)
    full.save(out/f'source-{size}-full.png')
print('Built section comparisons for desktop, tablet, mobile')
