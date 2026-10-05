import fs from 'node:fs';
import path from 'node:path';

fs.rmSync('public',{recursive:true,force:true});
fs.mkdirSync('public',{recursive:true});
fs.mkdirSync('public/assets',{recursive:true});

const html=fs.readFileSync('site.html');
fs.writeFileSync('public/index.html',html);
fs.writeFileSync('public/404.html',html);
fs.copyFileSync('assets/logo-v2.png','public/assets/logo-v2.png');

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

fs.writeFileSync('public/robots.txt','User-agent: *\nAllow: /\n');
