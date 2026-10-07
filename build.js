import fs from 'node:fs';
import path from 'node:path';

fs.rmSync('public',{recursive:true,force:true});
fs.mkdirSync('public',{recursive:true});
fs.mkdirSync('public/assets',{recursive:true});

const baseHtml=fs.readFileSync('site.html','utf8');
fs.cpSync('assets','public/assets',{recursive:true,force:true});

const routes=[
  '','services','solutions/inventory-sales','solutions/excel-dashboard','solutions/ai-automation','portfolio','portfolio/industrial-system','portfolio/ai-sales-flow','portfolio/ar-control-aging','portfolio/ai-marketing-machine','portfolio/curvey-ecommerce','portfolio/3bkarino-platform','portfolio/warehouse-production-control','portfolio/electronic-invoice-reconciliation','portfolio/supplier-reconciliation','portfolio/sales-collection-dashboard','portfolio/quotation-system','portfolio/barcode-warehouse','portfolio/excel-erp','pricing','blog','tools','contact','ai-consultant',
  'book','book/checkout','book/payment-result','book/read','book/admin','booking','privacy-policy','admin/records',
  'blog/ai-marketing-revolution','blog/analytics-guide','blog/paid-ads-guide','blog/website-conversion-guide','blog/prompting-for-business','blog/automation-first-workflow'
];

const seo={
  '': ['3bkarino Tech | مواقع وأنظمة وExcel وAI وتسويق','3bkarino Tech يقدم تطوير مواقع وأنظمة مخصصة وExcel Dashboards وحلول AI وAutomation وتسويق رقمي للشركات والمشروعات في مصر.'],
  'services':['خدمات 3bkarino Tech | مواقع وأنظمة وAI وExcel وتسويق','خدمات تطوير المواقع والأنظمة وExcel Dashboards والذكاء الاصطناعي والأتمتة والتسويق الرقمي حسب احتياج مشروعك.'],
  'solutions/inventory-sales':['نظام مخازن ومبيعات للشركات | 3bkarino Tech','نظام مخصص لإدارة المخزون والمبيعات والعملاء والموردين والصلاحيات والتقارير حسب دورة عمل شركتك.'],
  'solutions/excel-dashboard':['Excel Dashboard للشركات | تقارير وAR Aging | 3bkarino Tech','تصميم Excel Dashboards وتقارير إدارية وAR Aging وتحليل مبيعات وأتمتة لتقليل التجميع اليدوي وتحسين القرار.'],
  'solutions/ai-automation':['AI Automation للشركات والمبيعات | 3bkarino Tech','حلول AI Automation لتأهيل العملاء وتلخيص الطلبات واقتراح الخدمات وأتمتة خطوات المبيعات والمتابعة.'],
  'pricing':['باقات وأسعار 3bkarino Tech | حلول رقمية للشركات','تعرف على باقات البداية والنمو والحلول المخصصة لمواقع الشركات والأنظمة والـDashboards والـAI Automation.'],
  'portfolio':['أعمال 3bkarino Tech | مشاريع ERP وAI وE-commerce وBI','شاهد نماذج من أنظمة ERP والذكاء الاصطناعي والمتاجر الإلكترونية وAccounting BI التي نفذها 3bkarino Tech.'],
  'portfolio/industrial-system':['3bkarino Industrial System | ERP للمخازن والإنتاج والحسابات','Case Study لنظام ERP صناعي لإدارة المخازن والإنتاج والتكرير والمبيعات والمشتريات والحسابات والتقارير.'],
  'portfolio/ai-sales-flow':['3bkarino AI Sales Flow | AI لتأهيل العملاء والمبيعات','نظام AI Sales Flow لتأهيل العملاء واقتراح الخدمة المناسبة وتجهيز ملخص وتحويل منظم للمتابعة والمبيعات.'],
  'portfolio/ar-control-aging':['AR Control & Aging System | أعمار الديون والتحصيل','نظام لمتابعة حسابات العملاء والفواتير والتحصيلات والاستحقاقات وAR Aging وتقارير الإدارة.'],
  'portfolio/ai-marketing-machine':['AI Marketing Machine | التسويق بالذكاء الاصطناعي','مشروع وكتاب عملي لبناء التسويق بالذكاء الاصطناعي من فهم العميل والعرض إلى المحتوى والإعلانات والقياس.'],
  'portfolio/curvey-ecommerce':['Fashion E-commerce Store | متجر إلكتروني وتجربة شراء','Case Study لتطوير متجر إلكتروني متجاوب مع السلة والـCheckout وWhatsApp وتجربة شراء مناسبة للموبايل.'],
  'portfolio/3bkarino-platform':['3bkarino Tech Platform | Website + AI Consultant','منصة 3bkarino Tech الرسمية لعرض الخدمات والمشاريع والمقالات والمنتجات الرقمية والمستشار الذكي.'],
  'book':['AI Marketing Machine | دليل التسويق بالذكاء الاصطناعي','كتاب عربي عملي يشرح استخدام الذكاء الاصطناعي في التسويق والمحتوى والإعلانات والقياس والأتمتة لأصحاب المشاريع والمسوقين.'],
  'blog':['مقالات 3bkarino Tech | AI وExcel والتسويق والمواقع','مقالات عملية عن الذكاء الاصطناعي والتسويق والإعلانات وExcel وDashboards والمواقع والأتمتة.'],
  'tools':['أدوات مجانية | 3bkarino Tech','أدوات وحاسبات مجانية تساعد أصحاب المشاريع والمسوقين على فهم الأرقام واتخاذ قرارات أفضل.'],
  'ai-consultant':['مستشار 3bkarino Tech الذكي | حدد مشروعك وخدمتك','مستشار ذكي يساعدك تحدد احتياج مشروعك والخدمة المناسبة ويجهز ملخصًا واضحًا للمتابعة.'],
  'contact':['ابدأ مشروعك مع 3bkarino Tech | اطلب عرض سعر','تواصل مع 3bkarino Tech لطلب عرض سعر لموقع أو نظام أو Dashboard أو AI Automation أو خدمة تسويق رقمي.']
};

function escAttr(x){return String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}
function renderRoute(route){
  const canonical='https://3bkarinotech.com/'+(route?route:'');
  const fallback=['3bkarino Tech | حلول رقمية','حلول رقمية عملية من 3bkarino Tech.'];
  const meta=seo[route]||fallback;
  let html=baseHtml
    .replace(/<title>[^<]*<\/title>/,'<title>'+meta[0]+'</title>')
    .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+escAttr(meta[1])+'">')
    .replace(/<meta property="og:title" content="[^"]*">/,'<meta property="og:title" content="'+escAttr(meta[0])+'">')
    .replace(/<meta property="og:description" content="[^"]*">/,'<meta property="og:description" content="'+escAttr(meta[1])+'">')
    .replace(/<meta property="og:url" content="[^"]*">/,'<meta property="og:url" content="'+canonical+'">')
    .replace(/<link rel="canonical" href="[^"]*">/,'<link rel="canonical" href="'+canonical+'">')
    .replace(/<meta name="twitter:title" content="[^"]*">/,'<meta name="twitter:title" content="'+escAttr(meta[0])+'">')
    .replace(/<meta name="twitter:description" content="[^"]*">/,'<meta name="twitter:description" content="'+escAttr(meta[1])+'">');
  return html;
}

for(const route of routes){
  const dir=route?path.join('public',route):'public';
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),renderRoute(route));
}
fs.writeFileSync('public/404.html',baseHtml);

const publicRoutes=routes.filter(r=>!r.startsWith('admin/')&&!r.startsWith('book/admin')&&!r.startsWith('book/read')&&!r.startsWith('book/payment-result')&&!r.startsWith('book/checkout'));
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
publicRoutes.map(r=>'  <url><loc>https://3bkarinotech.com/'+r+'</loc><changefreq>'+(r.startsWith('blog/')?'monthly':'weekly')+'</changefreq><priority>'+(r===''?'1.0':r==='services'||r==='portfolio'||r==='book'?'0.9':'0.7')+'</priority></url>').join('\n')+
'\n</urlset>\n';
fs.writeFileSync('public/sitemap.xml',sitemap);
fs.writeFileSync('public/robots.txt','User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /book/admin\nDisallow: /book/read\nSitemap: https://3bkarinotech.com/sitemap.xml\n');
