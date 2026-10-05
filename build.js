import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

fs.rmSync('public',{recursive:true,force:true});
fs.mkdirSync('public',{recursive:true});

const compressed=Buffer.from(fs.readFileSync('site.gz.b64','utf8').trim(),'base64');
const html=zlib.gunzipSync(compressed);
fs.writeFileSync('public/index.html',html);
fs.writeFileSync('public/404.html',html);

const routes=[
  'services','portfolio','pricing','blog','tools','contact','ai-consultant',
  'book','booking','privacy-policy',
  'blog/ai-marketing-revolution','blog/analytics-guide','blog/paid-ads-guide'
];

for(const route of routes){
  const dir=path.join('public',route);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),html);
}
