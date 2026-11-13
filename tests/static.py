"""Run with python tests/static.py (Pillow is optional for image decoding)."""
from pathlib import Path
from html.parser import HTMLParser
root = Path(__file__).resolve().parents[1]
class Check(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.files=[]; self.images=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        for name in ('src','href'):
            if attrs.get(name,'').startswith('./'): self.files.append(attrs[name])
        if tag=='img': self.images.append(attrs)
c=Check(); c.feed((root/'index.html').read_text())
assert len(c.ids)==len(set(c.ids)), 'Duplicate IDs'
assert all((root/f[2:].split('?',1)[0]).exists() for f in c.files), 'Missing local reference'
assert all(i.get('alt') for i in c.images), 'Missing alt text'
print('PASS: unique IDs, all local file references, image alternative text')
colors={'background':'0b0d10','surface':'171a20','primary':'f1eee8','secondary':'b2b0ab','gold':'b79b68'}
def luminance(h):
    values=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    linear=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in values]
    return sum(x*y for x,y in zip(linear,(.2126,.7152,.0722)))
for bg in ('background','surface'):
    for fg in ('primary','secondary','gold'):
        a,b=sorted((luminance(colors[fg]),luminance(colors[bg])))
        ratio=(b+.05)/(a+.05)
        assert ratio>=4.5
        print(f'PASS: {fg}/{bg} contrast {ratio:.2f}:1')
try:
    from PIL import Image
    for p in (root/'assets').glob('*.jpg'):
        with Image.open(p) as image:
            image.verify()
        print(f'PASS: JPEG decodes {p.name}')
except ImportError:
    print('NOT TESTED: image decoding (optional Pillow is not installed)')
