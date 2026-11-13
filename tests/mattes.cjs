// Optional offline image QA: Node.js + ImageMagick. Nothing is installed in the website.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'script.js'),'utf8');
const registry=require('node:vm').runInNewContext(code.slice(0,code.indexOf('const $ ='))+';objects');
const samples={
 A01:{w:3000,h:2000,clear:[[0,0],[1510,790],[2100,700]],solid:[[1450,1000],[1200,900]]},
 A02:{w:618,h:600,clear:[[0,0],[470,140],[265,520],[560,400]],solid:[[300,300],[200,300],[350,460]]},
 A03:{w:668,h:515,clear:[[0,0],[343,137],[235,430]],solid:[[335,260],[300,300]]}
};
for(const [id,object] of Object.entries(samples)){
 const file=path.join(root,'assets',`${id}-matte.png`);
 const dimensions=execFileSync('magick',['identify','-format','%wx%h',file],{encoding:'utf8'});
 assert.equal(dimensions,`${object.w}x${object.h}`);
 const rgba=execFileSync('magick',[file,'-depth','8','RGBA:-'],{maxBuffer:40e6});
 const alpha=(x,y)=>rgba[(y*object.w+x)*4+3];
 for(const point of object.clear)assert.equal(alpha(...point),0,`${id} background/hole ${point} must be transparent`);
 for(const point of object.solid)assert.ok(alpha(...point)>250,`${id} artifact interior ${point} must be retained`);
 for(const [x,y] of [[0,0],[object.w-1,0],[0,object.h-1],[object.w-1,object.h-1]])assert.equal(alpha(x,y),0);
 const source=execFileSync('magick',[path.join(root,'assets',`${id}.jpg`),'-depth','8','RGBA:-'],{maxBuffer:40e6});
 const cutout=execFileSync('magick',[path.join(root,'assets',`${id}-cutout.webp`),'-depth','8','RGBA:-'],{maxBuffer:40e6});
 assert.equal(cutout.length,rgba.length);let visible=0,minX=object.w,minY=object.h,maxX=0,maxY=0;
 for(let i=0;i<rgba.length;i+=4){assert.equal(cutout[i+3],rgba[i+3],`${id} alpha ${i/4}`);if(cutout[i+3]){visible++;const pixel=i/4,x=pixel%object.w,y=Math.floor(pixel/object.w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(let c=0;c<3;c++)assert.equal(cutout[i+c],source[i+c],`${id} changed source RGB at ${i/4}`);}}
 const entry=registry.find(item=>item.id===id),c=entry.crop;assert.ok(c.x*object.w<=minX&&c.y*object.h<=minY&&(c.x+c.w)*object.w>maxX&&(c.y+c.h)*object.h>maxY,`${id} crop must contain every visible pixel`);
 console.log(`PASS: ${id} dimensions/transparent exterior and holes; ${visible} visible pixels retain exact original RGB`);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),script=fs.readFileSync(path.join(root,'script.js'),'utf8');
assert.equal(html.includes('<clipPath'),false,'Remove the inaccurate polygon clips completely');
assert.equal(script.includes('style.clipPath'),false);
assert.ok(script.includes('object.cutout'));assert.equal(script.includes('style.maskImage'),false);
console.log('PASS: native transparent photographs replace every old polygon clip and CSS mask');
