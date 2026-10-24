import json
from pathlib import Path
from PIL import Image, ImageDraw

out = Path('output/multipage')
screens = json.loads(Path('content/multipage-pen-index.json').read_text())['screens']
for group in range(2):
    canvas = Image.new('RGB', (3100, 1650), '#eef1f8')
    draw = ImageDraw.Draw(canvas)
    for col, i in enumerate(range(group * 5, group * 5 + 5)):
        x = col * 620 + 10
        draw.text((x, 15), screens[i * 2]['name'].split(' · ')[0], fill='#262626')
        for offset, slot in [(0, 450), (470, 130)]:
            entry = screens[i * 2 + (offset != 0)]
            im = Image.open(out / 'screens' / (entry['id'] + '.jpeg'))
            scale = min(slot / im.width, 1560 / im.height)
            im = im.resize((round(im.width * scale), round(im.height * scale)))
            canvas.paste(im, (x + offset, 60))
    canvas.save(out / f'review-{group + 1}.jpg', quality=93)

for name, old, new, h in [('desktop', 'sq8m0', 'Br1Oz', 706), ('mobile', 'n8h47', 'CWS9M', 889)]:
    original = Image.open('output/control/' + old + '.png').convert('RGB')
    current = Image.open(out / 'screens' / (new + '.jpeg')).convert('RGB')
    if original.width != current.width:
        original = original.resize((current.width, round(original.height * current.width / original.width)))
    a, b = original.crop((0, 0, current.width, h)), current.crop((0, 0, current.width, h))
    canvas = Image.new('RGB', (current.width * 2 + 20, h + 40), '#eef1f8')
    draw = ImageDraw.Draw(canvas)
    draw.text((8, 10), 'SOURCE PEN', fill='#262626')
    draw.text((current.width + 28, 10), 'MULTIPAGE HOME', fill='#262626')
    canvas.paste(a, (0, 40))
    canvas.paste(b, (current.width + 20, 40))
    canvas.save(out / f'compare-home-{name}.jpg', quality=95)
print('Two full-page review sheets and desktop/mobile homepage comparisons saved.')
