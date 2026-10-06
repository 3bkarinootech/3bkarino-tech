import { generateText } from 'ai';

const MODEL=process.env.AI_MODEL||'inclusionai/ling-3.1-flash';
const SYSTEM=`أنت Lead Qualifier تابع لـ 3bkarino Tech. مهمتك جمع معلومات كافية لتحويل العميل لفريق المبيعات، وليس حل المشروع بالكامل.
القواعد:
- رد بالمصري المهني في جملة أو جملتين فقط.
- اسأل سؤالًا واحدًا في كل رد.
- لا تعط Strategy كاملة، خطوات تنفيذ تفصيلية، Architecture، كود، Prompts كاملة، خطة تسويق كاملة أو أسرار تنفيذ.
- لا تعط سعر نهائي ولا تدخل في تفاوض.
- ركز على: نوع النشاط، الهدف، المشكلة، الخدمة المطلوبة، الميزانية والموعد.
- بعد 4 رسائل من العميل توقف فورًا وتحوله لواتساب.
- لو الوقت تجاوز 60 ثانية توقف فورًا وتحوله لواتساب.`;

const priceMatrix={
  ecommerce:{service:'متجر إلكتروني / تجربة بيع',price:'10,000 – 20,000 جنيه مبدئيًا',scope:'متجر أو كتالوج، تجربة شراء، واتساب/Checkout، Mobile-first'},
  system:{service:'نظام داخلي مخصص',price:'12,000 – 30,000+ جنيه مبدئيًا',scope:'Workflow، صلاحيات، إدخال بيانات، تقارير ولوحة متابعة'},
  excel:{service:'Excel Dashboard / Automation',price:'2,500 – 6,500 جنيه مبدئيًا',scope:'تنظيف بيانات، KPIs، Dashboard، أتمتة حسب الملف'},
  ai:{service:'AI Assistant / Automation',price:'6,000 – 15,000 جنيه مبدئيًا',scope:'مساعد ذكي أو Lead Qualifier مع Handoff وتكاملات حسب الاحتياج'},
  marketing:{service:'تسويق ومحتوى / تحسين حملات',price:'3,500 – 8,000 جنيه مبدئيًا',scope:'عرض ورسائل بيع، محتوى، خطة اختبار وقياس'},
  website:{service:'موقع شركة / Landing Page',price:'2,500 – 12,000 جنيه مبدئيًا',scope:'Landing Page أو موقع خدمات متعدد الصفحات، CTA وواتساب وAnalytics'}
};

function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data))}
function validMessages(v){if(!Array.isArray(v)||!v.length||v.length>14)return null;const out=[];for(const m of v){if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string')return null;const c=m.content.trim();if(!c||c.length>900)return null;out.push({role:m.role,content:c})}return out}
function userText(messages){return messages.filter(m=>m.role==='user').map(m=>m.content).join(' | ')}
function classify(text){
  const t=text.toLowerCase();
  if(/متجر|e-?commerce|shop|منتجات|checkout|سلة|طلب اونلاين/.test(t))return priceMatrix.ecommerce;
  if(/مخزن|مخازن|نظام|صلاحيات|مستخدمين|تشغيل|erp|عمليات|انتاج|production/.test(t))return priceMatrix.system;
  if(/excel|اكسل|إكسل|dashboard|داشبورد|تقرير|تقارير|kpi/.test(t))return priceMatrix.excel;
  if(/ai|ذكاء|بوت|assistant|automation|اتمت|أتمت|مساعد/.test(t))return priceMatrix.ai;
  if(/تسويق|اعلان|إعلان|محتوى|marketing|ads|campaign/.test(t))return priceMatrix.marketing;
  return priceMatrix.website;
}
function missing(text){
  const out=[];
  if(!/ميزاني|budget|\b\d{3,}/i.test(text))out.push('الميزانية التقريبية');
  if(!/اسبوع|أسبوع|شهر|موعد|ميعاد|deadline|خلال/i.test(text))out.push('الموعد المطلوب');
  if(!/شركة|مطعم|متجر|مصنع|عيادة|مكتب|براند|نشاط|مؤسسة|business/i.test(text))out.push('نوع النشاط');
  return out.slice(0,3);
}
function transcript(messages){return messages.map((m,i)=>(i+1)+'. '+(m.role==='user'?'العميل':'المستشار')+': '+m.content).join('\n')}
function elapsedSeconds(startedAt){const t=Number(startedAt);if(!Number.isFinite(t)||t<=0)return 0;return Math.max(0,Math.floor((Date.now()-t)/1000))}
function baseHandoff(messages,startedAt,reason){
  const text=userText(messages),pick=classify(text),miss=missing(text);
  const leadId='3BK-'+Date.now().toString(36).toUpperCase();
  const elapsed=elapsedSeconds(startedAt);
  const brief=text.length>2400?text.slice(0,2400)+'…':text;
  const msg=
'عميل جديد من مستشار 3bkarino Tech\n'+
'رقم المتابعة: '+leadId+'\n'+
'سبب التحويل: '+(reason==='timeout'?'انتهاء 60 ثانية':'اكتمال التأهيل')+'\n'+
'مدة المحادثة: '+elapsed+' ثانية\n\n'+
'— المطلوب من العميل —\n'+brief+'\n\n'+
'— اقتراح 3bkarino AI —\n'+
'الخدمة المقترحة: '+pick.service+'\n'+
'النطاق المبدئي: '+pick.scope+'\n'+
'التسعير المبدئي: '+pick.price+'\n'+
(miss.length?'معلومات نحتاج نأكدها مع العميل: '+miss.join('، ')+'\n':'')+
'ملاحظة: السعر مبدئي ويتثبت بعد مراجعة النطاق النهائي.\n\n'+
'— المحادثة كاملة —\n'+transcript(messages);
  return {leadId,pick,miss,brief,msg,elapsed};
}
async function handoff(messages,startedAt,reason){
  const base=baseHandoff(messages,startedAt,reason);
  let summary='';
  try{
    const prompt=`لخص طلب هذا العميل لفريق مبيعات 3bkarino Tech في 4 نقاط قصيرة فقط: النشاط، الهدف، المطلوب، أهم ملاحظة متابعة. لا تضف سعر ولا تخترع معلومات.\n\n${transcript(messages)}`;
    const out=await generateText({model:MODEL,prompt,providerOptions:{gateway:{has:['free']}},maxOutputTokens:180,maxRetries:0});
    summary=(out.text||'').trim();
  }catch{}
  const finalMsg=
'عميل جديد من مستشار 3bkarino Tech\n'+
'رقم المتابعة: '+base.leadId+'\n'+
'مدة المحادثة: '+base.elapsed+' ثانية\n\n'+
(summary?'— ملخص سريع —\n'+summary+'\n\n':'')+
'— تفاصيل العميل —\n'+base.brief+'\n\n'+
'— المقترح —\n'+
'الخدمة: '+base.pick.service+'\n'+
'النطاق المبدئي: '+base.pick.scope+'\n'+
'التسعير المبدئي: '+base.pick.price+'\n'+
(base.miss.length?'معلومات ناقصة نحتاج نأكدها: '+base.miss.join('، ')+'\n':'')+
'ملاحظة: السعر مبدئي ويتثبت بعد الاتفاق على النطاق.\n\n'+
'— المحادثة كاملة —\n'+transcript(messages);
  return {suggestedService:base.pick.service,priceRange:base.pick.price,scope:base.pick.scope,missing:base.miss,whatsappMessage:finalMsg,leadId:base.leadId};
}

export default async function handler(req,res){
  if(req.method==='GET')return send(res,200,{enabled:true,model:MODEL,mode:'lead-qualifier',maxSeconds:60,maxUserMessages:4});
  if(req.method!=='POST')return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  let body=req.body;try{if(typeof body==='string')body=JSON.parse(body)}catch{return send(res,400,{error:'BAD_JSON'})}
  const messages=validMessages(body?.messages);if(!messages)return send(res,400,{error:'INVALID_MESSAGES'});
  const action=body?.action||'chat';
  const elapsed=elapsedSeconds(body?.startedAt);
  if(action==='handoff')return send(res,200,await handoff(messages,body?.startedAt,body?.reason||'qualified'));
  const users=messages.filter(m=>m.role==='user').length;
  if(elapsed>=60)return send(res,200,{forceHandoff:true,reason:'timeout',reply:'انتهت دقيقة التأهيل. هنكمل التفاصيل والاتفاق على واتساب.'});
  if(users>=4)return send(res,200,{forceHandoff:true,reason:'message-limit',reply:'تمام، فهمت المطلوب. هنكمل التفاصيل والاتفاق على واتساب.'});
  try{
    const {text}=await generateText({model:MODEL,system:SYSTEM,messages,providerOptions:{gateway:{has:['free']}},maxOutputTokens:150,maxRetries:1});
    return send(res,200,{reply:(text||'').trim()||'تمام. إيه أهم نتيجة عايز توصل لها؟',forceHandoff:false,secondsLeft:Math.max(0,60-elapsed)});
  }catch{
    const fallback=['إيه نوع نشاطك بالضبط؟','إيه أهم نتيجة عايز المشروع يحققها؟','إيه الخدمة الأقرب لاحتياجك؟','عندك ميزانية وموعد مبدئي للتنفيذ؟'];
    return send(res,200,{reply:fallback[Math.min(users-1,fallback.length-1)],forceHandoff:false,secondsLeft:Math.max(0,60-elapsed)});
  }
}