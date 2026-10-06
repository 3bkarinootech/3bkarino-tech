import { generateText } from 'ai';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { saveRecord } from '../lib/records.js';

const MODEL=process.env.AI_MODEL||'inclusionai/ling-3.1-flash';
const SECRET=process.env.AI_SESSION_SECRET||'';
const buckets=new Map();

const SYSTEM='أنت مساعد تأهيل عملاء تابع لـ 3bkarino Tech. مهمتك فهم الطلب بسرعة وتحويله لفريق المبيعات، وليس إعطاء الحل الكامل.\nالقواعد:\n- تحدث بالمصري المهني وبأسلوب بسيط.\n- رد في جملة أو جملتين فقط.\n- اسأل سؤالًا واحدًا فقط في كل رد.\n- ركز على: نوع النشاط، الهدف، المشكلة، الخدمة المطلوبة، الميزانية والموعد.\n- لا تعط Strategy كاملة، كود، Architecture، خطوات تنفيذ تفصيلية، Prompts كاملة، أو خطة تسويق كاملة.\n- لا تفاوض على السعر ولا تعد بنتائج مضمونة.\n- بعد 4 رسائل من العميل يجب التحويل لواتساب.\n- زمن التأهيل 60 ثانية بحد أقصى.';

const priceMatrix={
  ecommerce:{service:'متجر إلكتروني / تجربة بيع',price:'10,000 – 20,000 جنيه مبدئيًا',scope:'متجر أو كتالوج، تجربة شراء، واتساب/Checkout، Mobile-first'},
  system:{service:'نظام داخلي مخصص',price:'12,000 – 30,000+ جنيه مبدئيًا',scope:'Workflow، صلاحيات، إدخال بيانات، تقارير ولوحة متابعة'},
  excel:{service:'Excel Dashboard / Automation',price:'2,500 – 6,500 جنيه مبدئيًا',scope:'تنظيف بيانات، KPIs، Dashboard، وأتمتة حسب الملف'},
  ai:{service:'AI Assistant / Automation',price:'6,000 – 15,000 جنيه مبدئيًا',scope:'مساعد ذكي أو Lead Qualifier مع Handoff وتكاملات حسب الاحتياج'},
  marketing:{service:'تسويق ومحتوى / تحسين حملات',price:'3,500 – 8,000 جنيه مبدئيًا',scope:'رسائل بيع، محتوى، خطة اختبار وقياس'},
  website:{service:'موقع شركة / Landing Page',price:'2,500 – 12,000 جنيه مبدئيًا',scope:'Landing Page أو موقع خدمات متعدد الصفحات، CTA وواتساب وAnalytics'}
};

function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data))}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host}catch{return false}}
function rateLimit(req){const key=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();const now=Date.now(),item=buckets.get(key)||{count:0,reset:now+60000};if(item.reset<=now){item.count=0;item.reset=now+60000}item.count++;buckets.set(key,item);return item.count<=18}
function validMessages(v){if(!Array.isArray(v)||!v.length||v.length>14)return null;const out=[];for(const m of v){if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string')return null;const c=m.content.trim();if(!c||c.length>900)return null;out.push({role:m.role,content:c})}return out}
function userText(messages){return messages.filter(m=>m.role==='user').map(m=>m.content).join(' | ')}
function classify(text){const t=text.toLowerCase();if(/متجر|e-?commerce|shop|منتجات|checkout|سلة|طلب اونلاين/.test(t))return priceMatrix.ecommerce;if(/مخزن|مخازن|نظام|صلاحيات|مستخدمين|تشغيل|erp|عمليات|انتاج|production/.test(t))return priceMatrix.system;if(/excel|اكسل|إكسل|dashboard|داشبورد|تقرير|تقارير|kpi/.test(t))return priceMatrix.excel;if(/ai|ذكاء|بوت|assistant|automation|اتمت|أتمت|مساعد/.test(t))return priceMatrix.ai;if(/تسويق|اعلان|إعلان|محتوى|marketing|ads|campaign/.test(t))return priceMatrix.marketing;return priceMatrix.website}
function missing(text){const out=[];if(!/ميزاني|budget|\b\d{3,}/i.test(text))out.push('الميزانية التقريبية');if(!/اسبوع|أسبوع|شهر|موعد|ميعاد|deadline|خلال/i.test(text))out.push('الموعد المطلوب');if(!/شركة|مطعم|متجر|مصنع|عيادة|مكتب|براند|نشاط|مؤسسة|business/i.test(text))out.push('نوع النشاط');return out.slice(0,3)}
function transcript(messages){return messages.map((m,i)=>(i+1)+'. '+(m.role==='user'?'العميل':'المستشار')+': '+m.content).join('\n')}
function b64url(s){return Buffer.from(s).toString('base64url')}
function sign(payload){if(!SECRET)throw new Error('SESSION_SECRET_MISSING');return createHmac('sha256',SECRET).update(payload).digest('base64url')}
function createSession(){const payload=b64url(JSON.stringify({iat:Date.now(),nonce:randomUUID()}));return payload+'.'+sign(payload)}
function verifySession(token){if(!SECRET||typeof token!=='string')return null;const parts=token.split('.');if(parts.length!==2)return null;const payload=parts[0],sig=parts[1],expected=sign(payload);try{const a=Buffer.from(sig),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));if(!Number.isFinite(data.iat))return null;const elapsed=Math.max(0,Math.floor((Date.now()-data.iat)/1000));if(elapsed>600)return null;return {elapsed,iat:data.iat}}catch{return null}}
function buildBase(messages,session,reason){const text=userText(messages),pick=classify(text),miss=missing(text);const leadId='3BK-'+Date.now().toString(36).toUpperCase();const brief=text.length>2600?text.slice(0,2600)+'…':text;return {text,pick,miss,leadId,brief,elapsed:session?.elapsed||0,reason}}
async function makeHandoff(messages,session,reason){
  const base=buildBase(messages,session,reason);
  let summary='';
  try{
    const prompt='لخص طلب هذا العميل لفريق مبيعات 3bkarino Tech في 4 نقاط قصيرة فقط: نوع النشاط، الهدف، المطلوب، وأهم نقطة متابعة. لا تضف سعر ولا تخترع معلومات.\n\n'+transcript(messages);
    const out=await generateText({model:MODEL,prompt,providerOptions:{gateway:{has:['free']}},maxOutputTokens:180,maxRetries:0});
    summary=(out.text||'').trim();
  }catch{}
  const finalMsg='طلب جديد من مستشار 3bkarino Tech\n'+'رقم المتابعة: '+base.leadId+'\n'+'سبب التحويل: '+(reason==='timeout'?'انتهاء 60 ثانية':'اكتمال التأهيل')+'\n'+'مدة المحادثة: '+base.elapsed+' ثانية\n\n'+(summary?'— ملخص سريع —\n'+summary+'\n\n':'')+'— طلب العميل —\n'+base.brief+'\n\n'+'— المقترح المبدئي —\n'+'الخدمة: '+base.pick.service+'\n'+'النطاق: '+base.pick.scope+'\n'+'السعر المبدئي: '+base.pick.price+'\n'+(base.miss.length?'معلومات نحتاج نأكدها: '+base.miss.join('، ')+'\n':'')+'ملاحظة: السعر مبدئي ويتثبت بعد مراجعة النطاق والاتفاق النهائي.\n\n'+'— المحادثة كاملة —\n'+transcript(messages);
  try{
    await saveRecord({
      id:base.leadId,kind:'lead',source:'ai-consultant',status:'new',createdAt:Date.now(),
      service:base.pick.service,priceRange:base.pick.price,scope:base.pick.scope,
      goal:base.brief,summary,missing:base.miss,transcript:transcript(messages),
      meta:{reason,elapsed:base.elapsed}
    });
  }catch{}
  return {suggestedService:base.pick.service,priceRange:base.pick.price,scope:base.pick.scope,missing:base.miss,whatsappMessage:finalMsg,leadId:base.leadId};
}

export default async function handler(req,res){
  if(req.method==='GET')return send(res,200,{enabled:Boolean(SECRET),model:MODEL,mode:'lead-qualifier',maxSeconds:60,maxUserMessages:4});
  if(req.method!=='POST')return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  if(!sameOrigin(req))return send(res,403,{error:'FORBIDDEN'});
  if(!rateLimit(req))return send(res,429,{error:'RATE_LIMIT',message:'استنى دقيقة وجرب تاني.'});
  let body=req.body;try{if(typeof body==='string')body=JSON.parse(body)}catch{return send(res,400,{error:'BAD_JSON'})}
  const action=body?.action||'chat';
  if(action==='start'){if(!SECRET)return send(res,503,{error:'SESSION_NOT_CONFIGURED'});return send(res,200,{sessionToken:createSession(),maxSeconds:60,maxUserMessages:4})}
  const session=verifySession(body?.sessionToken);
  if(!session)return send(res,401,{error:'INVALID_SESSION',message:'ابدأ جلسة جديدة.'});
  const messages=validMessages(body?.messages);
  if(!messages)return send(res,400,{error:'INVALID_MESSAGES'});
  if(action==='handoff')return send(res,200,await makeHandoff(messages,session,body?.reason||'qualified'));
  const users=messages.filter(m=>m.role==='user').length;
  if(session.elapsed>=60)return send(res,200,{forceHandoff:true,reason:'timeout',reply:'انتهت دقيقة التأهيل. هنكمل التفاصيل والاتفاق على واتساب.'});
  if(users>=4)return send(res,200,{forceHandoff:true,reason:'message-limit',reply:'تمام، فهمت المطلوب. هنكمل التفاصيل والاتفاق على واتساب.'});
  try{
    const out=await generateText({model:MODEL,system:SYSTEM,messages,providerOptions:{gateway:{has:['free']}},maxOutputTokens:150,maxRetries:1});
    return send(res,200,{reply:(out.text||'').trim()||'تمام. إيه أهم نتيجة عايز توصل لها؟',forceHandoff:false,secondsLeft:Math.max(0,60-session.elapsed)});
  }catch{
    const fallback=['إيه نوع نشاطك بالضبط؟','إيه أهم نتيجة عايز المشروع يحققها؟','إيه الخدمة الأقرب لاحتياجك؟','عندك ميزانية وموعد مبدئي للتنفيذ؟'];
    return send(res,200,{reply:fallback[Math.min(users-1,fallback.length-1)],forceHandoff:false,secondsLeft:Math.max(0,60-session.elapsed)});
  }
}
