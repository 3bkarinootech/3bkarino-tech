import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET=process.env.BOOK_LICENSE_SECRET||'';
const ADMIN=process.env.BOOK_ADMIN_KEY||'';
const WA='201120124338';

const BOOK_A=[
{title:'المقدمة — صدمة الواقع',body:['في 2026، المسوق الذي لا يملك “ماكينة ذكاء اصطناعي” هو مجرد بائع متجول في مدينة ذكية. هذا الكتاب لا يعلّمك الدردشة مع الآلة، بل كيف تستخدمها داخل نظام تسويقي عملي.','الكتاب تفاعلي: اقرأ، نفّذ، اختبر، ثم ارجع للبيانات.']},
{title:'01 — هندسة الجمهور | Decoding the Persona',body:['الجمهور لا يشتري بالأرقام الديموغرافية فقط. نقطة البداية هي فهم الوجع والمخاوف التي تمنع العميل من اتخاذ القرار.','الأساس المستخدم في هذا الفصل هو التمييز بين الاستجابة العاطفية السريعة والتبرير المنطقي اللاحق.','Prompt العمل: “تقمص شخصية خبير في علم النفس السلوكي. أريد تحليل الوجع العميق لجمهور مهتم بـ [منتجك]. ما هي 3 مخاوف سرية تجعلهم يترددون في الشراء؟ وكيف أصيغ Hook يلمس هذا الوجع في أول 3 ثوانٍ؟”','لغز A: الكود ALPHA-3B- ويحتاج كلمة من نسخة B.']},
{title:'02 — ترسانة الأدوات | The Weaponry Stack',body:['الذكاء الاصطناعي لا يُستخدم كأداة منفصلة، بل كسلسلة توريد رقمية: التخطيط، الصورة، الصوت، ثم النشر.','ChatGPT/Gemini للعقل والتخطيط، أدوات الصور للفن البصري، وأدوات الصوت/الفيديو للتقديم والإقناع.','Prompt العمل: وزّع إنتاج المحتوى بين التخطيط، الوصف البصري، والصوت مع الحفاظ على هوية واحدة وهدف تحويل واضح.','لغز A: الكود STK-TECH- ويحتاج كلمة من نسخة B.']},
{title:'03 — هندسة الأوامر | The Master Prompting',body:['بروتوكول R-T-A-F: Role الدور، Task المهمة، Audience الجمهور، Format التنسيق.','كلما كان الأمر محددًا في الدور والمهمة والجمهور والشكل النهائي، أصبحت النتيجة أقرب لما تحتاجه.','Prompt العمل: “تقمص دور Expert Conversion Copywriter... واكتب عرضًا يواجه اعتراضات المشترين قبل أن ينطقوا بها.”','لغز A: الكود CMD-PROMPT- ويحتاج كلمة من نسخة B.']},
{title:'04 — ماكينة التحويل | The Conversion Funnel',body:['المحتوى يجذب الانتباه، لكن العرض هو الذي يغلق الصفقة. الفصل يبني Funnel يعتمد على الندرة، الاستعجال والدليل الاجتماعي.','قاعدة 80/20: أغلب المحتوى قيمة وفهم وثقة، وجزء أصغر بيع مباشر.','Prompt العمل: صمم Funnel من إعلان يثير الفضول، Landing Page تركز على المشكلة، ثم رسائل متابعة تعتمد على الخوف من الضياع بشكل مسؤول.','لغز A: الكود CONV-FUEL- ويحتاج كلمة من نسخة B.']},
{title:'05 — لغة الأرقام | The Data Master',body:['ما لا يمكن قياسه لا يمكن تطويره. اقرأ CTR وCPC وROAS كإشارات لاتخاذ قرار، وليس أرقامًا للعرض فقط.','CTR منخفض قد يشير إلى ضعف الهوك، CPC مرتفع قد يشير إلى مشكلة في الاستهداف أو المنافسة، وROAS منخفض يحتاج مراجعة العرض والرحلة كاملة.','Prompt العمل: حلّل نتائج الحملة، حدد نقاط الضعف، واقترح تعديلات على العرض والاستهداف ثم اختبرها تدريجيًا.','لغز A: الكود DATA-NERD- ويحتاج كلمة من نسخة B.']},
{title:'06 — ذكاء المحتوى | Content Engineering',body:['اقتصاد الانتباه يعني أن المحتوى يجب أن يوقف التمرير سريعًا بدون تضليل. استخدم Pattern Interrupt، قصة قصيرة، ثم CTA واضح.','قاعدة 1:10:100: فكرة أساسية → 10 زوايا → عشرات القطع المناسبة للمنصات المختلفة.','Prompt العمل: حوّل الفكرة إلى Hook ثم Story ثم Reward ثم CTA للتعليق أو التفاعل.','لغز A: الكود CONTENT-VIRAL- ويحتاج كلمة من نسخة B.']},
{title:'07 — مستقبل الوكالة | 3BKARINO 2026+',body:['المستقبل ليس في Prompt منفرد، بل في أنظمة ووكلاء يعملون معًا تحت رقابة بشرية.','كن المايسترو لا العازف: الإبداع والقرار والرقابة للبشر، والمهام المتكررة للأنظمة.','Prompt العمل: صمم هيكل وكالة صغيرة تستخدم Agents موزعين على البحث، المحتوى، المتابعة والتحليل مع نقاط مراجعة بشرية.','لغز A: الكود FUTURE-PRO- ويحتاج كلمة من نسخة B.']},
{title:'08 — غرفة العمليات | The War Room',body:['غرفة العمليات هي نقطة الربط بين التعلم والتطبيق. تجمع أكواد الفصول، الشريك صاحب النسخة الأخرى، والملفات المساندة.','الهدف من نظام A/B هو التعاون وفك الشفرات بشكل متبادل، وليس نشر الكلمات أو الملفات خارج النظام الرسمي.']},
{title:'09 — الخاتمة | The Final Command',body:['أنت المايسترو. الآلة تنفذ، لكن الرؤية والقرار والمسؤولية تظل عندك.','وصايا الماكينة: خاطب الوجع قبل الجيب، اعتمد على الأرقام، كرر الاختبار، استخدم الأتمتة للمهام المتكررة، وحافظ على ميزة العمل داخل نظام واضح.','المهمة التالية: اختر فصلًا واحدًا، طبّق تمرينه على مشروعك الحقيقي، وسجل نتيجة قابلة للقياس.']}
];

const BOOK_B=[
{title:'THE KEYHOLDER EDITION — نسخة B',body:['هذه النسخة هي المفتاح المكمل للنسخة A. محتواها يركز على كلمات التفعيل والمفاتيح المطلوبة لإكمال الشفرات.']},
{title:'01 — هندسة الجمهور: المستوى العميق',body:['الجمهور ليس مجرد أرقام؛ السر في تحويل الوجع إلى رغبة شراء بطريقة مسؤولة.','الكلمة الذهبية للمقايضة: المستقبل.']},
{title:'02 — ترسانة الأدوات: التفعيل التقني',body:['الأدوات بدون استراتيجية مجرد تكلفة إضافية. دمج الأدوات يحتاج بروتوكول تزامن بين التخطيط والإبداع والتنفيذ.','الكلمة الذهبية للمقايضة: الأتمتة.']},
{title:'03 — هندسة الأوامر: لغة الآلة',body:['الآلة تستجيب للأوامر المنطقية المرتبة، والتنفيذ هو الفاصل بين الفكرة والنتيجة.','الكلمة الذهبية للمقايضة: التنفيذ.']},
{title:'04 — ماكينة التحويل: وقود المبيعات',body:['القمع يحتاج رسالة متسقة وعرضًا واضحًا واستمرارية في التواصل، لا مجرد ضغط نفسي على العميل.','الكلمة الذهبية للمقايضة: الاستمرارية.']},
{title:'05 — لغة الأرقام: السيادة البيانية',body:['البيانات هي أساس القرار، والقرار الجيد يحتاج قراءة مستمرة للنتائج بدل الاعتماد على الانطباع.','الكلمة الذهبية للمقايضة: السيطرة.']},
{title:'06–07 — الانتشار والرؤية',body:['نسخة B تحتفظ بالمنهج العلمي نفسه للفصلين السادس والسابع مع دور إضافي في فك شفرات نسخة A.']},
{title:'دليل تشغيل نسخة B',body:['عندما يطلب صاحب نسخة A مفتاحًا، يتم التبادل داخل غرفة العمليات الرسمية فقط.','الحفاظ على الكلمات داخل النظام جزء من تجربة النسختين وحماية المحتوى.']}
];

function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data))}
function b64(s){return Buffer.from(JSON.stringify(s)).toString('base64url')}
function sign(payload){if(!SECRET)throw new Error('BOOK_SECRET_MISSING');return createHmac('sha256',SECRET).update(payload).digest('base64url')}
function token(data){const p=b64(data);return p+'.'+sign(p)}
function verify(t){if(!SECRET||typeof t!=='string')return null;const [p,sig]=t.split('.');if(!p||!sig)return null;const exp=sign(p);try{const a=Buffer.from(sig),b=Buffer.from(exp);if(a.length!==b.length||!timingSafeEqual(a,b))return null;return JSON.parse(Buffer.from(p,'base64url').toString('utf8'))}catch{return null}}
function clean(v,n=120){return String(v||'').trim().slice(0,n)}
function maskEmail(email){const [u,d]=email.split('@');if(!d)return email;return (u.slice(0,2)||'*')+'***@'+d}
function assign(email){const h=createHmac('sha256',SECRET).update(email.toLowerCase()).digest();return h[0]%2===0?'A':'B'}
function orderId(){return '3BK-BOOK-'+Date.now().toString(36).toUpperCase()}
function licenseId(ver){return '3BK-'+ver+'-'+Date.now().toString(36).toUpperCase()}

export default async function handler(req,res){
  if(req.method==='GET') return send(res,200,{enabled:Boolean(SECRET),title:'AI Marketing Machine',editions:['A','B'],delivery:'licensed-online-reader',paymentConfigured:Boolean(process.env.BOOK_PAYMENT_URL)});
  if(req.method!=='POST') return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  let body=req.body;try{if(typeof body==='string')body=JSON.parse(body)}catch{return send(res,400,{error:'BAD_JSON'})}
  const action=body?.action;

  if(action==='create-order'){
    const name=clean(body.name),email=clean(body.email,180).toLowerCase(),phone=clean(body.phone,30);
    if(name.length<2||!email.includes('@')||phone.length<8)return send(res,400,{error:'INVALID_CUSTOMER'});
    const version=assign(email),id=orderId(),createdAt=Date.now();
    const orderToken=token({type:'order',id,name,email,phone,version,createdAt});
    const msg='طلب شراء AI Marketing Machine\nرقم الطلب: '+id+'\nالاسم: '+name+'\nالإيميل: '+email+'\nالموبايل: '+phone+'\nالإصدار المخصص تلقائيًا: Version '+version+'\n\nأريد إتمام الدفع واستلام النسخة المرخصة باسمي.';
    return send(res,200,{orderId:id,version,orderToken,paymentUrl:process.env.BOOK_PAYMENT_URL||'',whatsappUrl:'https://wa.me/'+WA+'?text='+encodeURIComponent(msg)});
  }

  if(action==='issue-license'){
    if(!ADMIN||body.adminKey!==ADMIN)return send(res,403,{error:'ADMIN_REQUIRED'});
    const order=verify(body.orderToken);if(!order||order.type!=='order')return send(res,400,{error:'INVALID_ORDER'});
    const lic=licenseId(order.version),issuedAt=Date.now();
    const licenseToken=token({type:'license',licenseId:lic,name:order.name,email:order.email,phone:order.phone,version:order.version,orderId:order.id,issuedAt});
    return send(res,200,{licenseId:lic,version:order.version,licenseToken,readerUrl:'/book/read?license='+encodeURIComponent(licenseToken)});
  }

  if(action==='validate'||action==='content'){
    const lic=verify(body.licenseToken);if(!lic||lic.type!=='license')return send(res,401,{error:'INVALID_LICENSE'});
    const customer={name:lic.name,emailMasked:maskEmail(lic.email),licenseId:lic.licenseId,version:lic.version,orderId:lic.orderId};
    if(action==='validate')return send(res,200,{valid:true,customer});
    return send(res,200,{valid:true,customer,chapters:lic.version==='A'?BOOK_A:BOOK_B});
  }

  return send(res,400,{error:'UNKNOWN_ACTION'});
}
