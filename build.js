import fs from 'node:fs';
import path from 'node:path';

fs.rmSync('public',{recursive:true,force:true});
fs.mkdirSync('public',{recursive:true});
fs.mkdirSync('public/assets',{recursive:true});

const html=fs.readFileSync('site.html');
fs.writeFileSync('public/index.html',html);
fs.writeFileSync('public/404.html',html);
fs.cpSync('assets','public/assets',{recursive:true,force:true});

const routes=[
  'services','portfolio','portfolio/industrial-system','portfolio/ai-sales-flow','portfolio/ar-control-aging','portfolio/ai-marketing-machine','portfolio/curvey-ecommerce','portfolio/3bkarino-platform','portfolio/warehouse-production-control','portfolio/electronic-invoice-reconciliation','portfolio/supplier-reconciliation','portfolio/sales-collection-dashboard','portfolio/quotation-system','portfolio/barcode-warehouse','portfolio/excel-erp','pricing','blog','tools','contact','ai-consultant',
  'book','book/checkout','book/payment-result','book/read','book/admin','booking','privacy-policy','admin/records',
  'blog/ai-marketing-revolution','blog/analytics-guide','blog/paid-ads-guide','blog/website-conversion-guide','blog/prompting-for-business','blog/automation-first-workflow'
];

for(const route of routes){
  const dir=path.join('public',route);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),html);
}

fs.writeFileSync('public/robots.txt','User-agent: *\nAllow: /\n');
