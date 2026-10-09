import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { generateText } from 'ai';
import { saveRecord, readRecord } from '../lib/records.js';

const MODEL=process.env.AI_MODEL||'inclusionai/ling-3.1-flash';
const VERIFY_TOKEN=process.env.META_VERIFY_TOKEN||'';
const APP_SECRET=process.env.META_APP_SECRET||'';
const PAGE_TOKEN=process.env.META_PAGE_ACCESS_TOKEN||'';
const IG_USER_ID=process.env.META_IG_USER_ID||'';
const WA_TOKEN=process.env.WHATSAPP_ACCESS_TOKEN||'';
const WA_PHONE_ID=process.env.WHATSAPP_PHONE_NUMBER_ID||'';

const SYSTEM=`أنت مساعد مبيعات 3bkarino Tech على واتساب وفيسبوك وإنستجرام.
هدفك تأهيل العميل فقط حتى مرحلة الاتفاق الفعلي، ثم تسليم المحادثة لمحمود.
اكتب بالمصري المهني. رد قصير جدًا: جملة أو جملتين، واسأل سؤال واحد فقط.
الخدمات: Website/Landing Page، Business System/ERP، Excel Dashboard، AI Automation، Marketing Growth، وكتاب AI Marketing Machine.
اجمع تدريجيًا: نوع النشاط، المطلوب، أهم مشكلة/هدف، الميزانية التقريبية، وموعد التنفيذ.
لا توافق على سعر نهائي، لا تمنح خصم، لا تعد بنتيجة مضمونة، ولا تقول إن الاتفاق تم.
لو العميل أصبح جاهزًا للسعر النهائي/الدفع/بدء التنفيذ، أخبره أن محمود سيتدخل لإتمام الاتفاق.`;

function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(typeof data==='string'?data:JSON.stringify(data))}
function clean(v,n=1200){return String(v??'').trim().slice(0,n)}
function stableId(channel,sender){return '3BK-INBOX-'+createHash('sha256').update(channel+':'+sender).digest('hex').slice(0,22).toUpperCase()}
function verifySignature(req,raw){
  if(!APP_SECRET)return false;
  const h=String(req.headers['x-hub-signature-256']||'');
  if(!h.startsWith('sha256='))return false;
  const got=h.slice(7),expected=createHmac('sha256',APP_SECRET).update(raw).digest('hex');
  try{const a=Buffer.from(got,'hex'),b=Buffer.from(expected,'hex');return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}
}
function bodyBuffer(req){if(Buffer.isBuffer(req.body))return req.body;if(typeof req.body==='string')return Buffer.from(req.body);return Buffer.from(JSON.stringify(req.body||{}))}
function agreementIntent(text){
  return /(السعر النهائي|سعر نهائي|نبدأ|ابدأ|عايز ابدأ|جاهز|اتفق|نتفق|التعاقد|عقد|فاتورة|invoice|payment|ادفع|الدفع|تحويل|عربون|final price|ready to start|deal|contract)/i.test(text);
}
function guessService(text){
  const t=text.toLowerCase();
  if(/كتاب|book|marketing machine/.test(t))return 'AI Marketing Machine Book';
  if(/excel|اكسل|إكسل|dashboard|داشبورد|aging|تقرير/.test(t))return 'Excel Dashboard';
  if(/مخزن|مخازن|erp|system|نظام|صلاحيات|مبيعات|مشتريات|انتاج|إنتاج/.test(t))return 'Business System / ERP';
  if(/ai|ذكاء|automation|أتمت|اتمت|bot|بوت|assistant/.test(t))return 'AI Automation';
  if(/تسويق|اعلان|إعلان|ads|marketing|campaign/.test(t))return 'Marketing Growth';
  if(/موقع|website|landing|ويب|متجر|ecommerce/.test(t))return 'Website / Landing Page';
  return '';
}
function missingQuestion(text){
  if(!/شركة|مصنع|متجر|مطعم|عيادة|مكتب|براند|نشاط|business|shop/i.test(text))return 'تمام 👌 إيه نوع نشاطك أو المشروع اللي بتشتغل عليه؟';
  if(!guessService(text))return 'ممتاز. أنهي خدمة أقرب لاحتياجك: موقع، نظام، Excel Dashboard، AI Automation، تسويق، ولا الكتاب؟';
  if(!/هدف|مشكلة|عايز|محتاج|الهدف|المشكلة|تحسين|زيادة|تنظيم/i.test(text))return 'إيه أهم مشكلة أو نتيجة عايز الحل يحققها لك؟';
  if(!/ميزاني|budget|\b\d{3,}/i.test(text))return 'عندك ميزانية تقريبية حابب نشتغل في حدودها؟';
  if(!/اسبوع|أسبوع|شهر|موعد|ميعاد|deadline|خلال|يوم/i.test(text))return 'محتاج تبدأ أو تستلم خلال قد إيه تقريبًا؟';
  return 'تمام، في نقطة معينة حابب تتأكد منها قبل ما نوصل لمرحلة الاتفاق؟';
}
async function aiReply(transcript){
  try{
    const out=await generateText({
      model:MODEL,system:SYSTEM,
      messages:transcript.slice(-10).map(x=>({role:x.role==='customer'?'user':'assistant',content:x.text})),
      providerOptions:{gateway:{has:['free']}},maxOutputTokens:110,maxRetries:0
    });
    const txt=clean(out.text,500);if(txt)return txt;
  }catch{}
  return missingQuestion(transcript.filter(x=>x.role==='customer').map(x=>x.text).join(' | '));
}
async function postJson(url,token,payload){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:token?'Bearer '+token:undefined},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error('META_SEND_'+r.status+':'+(await r.text()).slice(0,500));
  return r.json().catch(()=>({ok:true}));
}
async function sendChannel(channel,sender,text){
  if(channel==='whatsapp'){
    if(!WA_TOKEN||!WA_PHONE_ID)throw new Error('WHATSAPP_NOT_CONFIGURED');
    return postJson('https://graph.facebook.com/v23.0/'+WA_PHONE_ID+'/messages',WA_TOKEN,{messaging_product:'whatsapp',to:sender,type:'text',text:{body:text,preview_url:false}});
  }
  if(channel==='instagram'){
    if(!PAGE_TOKEN||!IG_USER_ID)throw new Error('INSTAGRAM_NOT_CONFIGURED');
    return postJson('https://graph.facebook.com/v23.0/'+IG_USER_ID+'/messages?access_token='+encodeURIComponent(PAGE_TOKEN),'',{recipient:{id:sender},message:{text}});
  }
  if(!PAGE_TOKEN)throw new Error('FACEBOOK_NOT_CONFIGURED');
  return postJson('https://graph.facebook.com/v23.0/me/messages?access_token='+encodeURIComponent(PAGE_TOKEN),'',{recipient:{id:sender},messaging_type:'RESPONSE',message:{text}});
}
async function processMessage({channel,sender,name,text,messageId}){
  if(!sender||!text)return;
  const id=stableId(channel,sender),old=await readRecord(id);
  const transcript=Array.isArray(old?.transcript)?old.transcript.slice(-18):[];
  if(messageId&&transcript.some(x=>x.messageId===messageId))return;
  transcript.push({role:'customer',text:clean(text),at:Date.now(),messageId:clean(messageId,200)});
  const allText=transcript.filter(x=>x.role==='customer').map(x=>x.text).join(' | ');
  const service=old?.service||guessService(allText);
  const shouldHandoff=Boolean(old?.handoffNeeded)||agreementIntent(text);
  let reply,status,handoffNeeded=shouldHandoff,handoffReason=old?.handoffReason||'';
  if(shouldHandoff){
    reply='تمام، وصلنا لمرحلة الاتفاق النهائي 👌 محمود هيتدخل معاك بنفسه لإتمام السعر والتفاصيل النهائية.';
    status='handoff';handoffReason=handoffReason||'العميل أظهر استعدادًا للاتفاق/الدفع';
  }else{
    reply=await aiReply(transcript);
    status='ai_qualifying';
  }
  transcript.push({role:'assistant',text:reply,at:Date.now()});
  await saveRecord({
    ...(old||{}),id,kind:'lead',source:channel,status,
    channel,senderId:sender,name:clean(name||old?.name||'Lead '+channel,120),
    service:service||old?.service||'',goal:clean(allText,2800),
    transcript:transcript.slice(-20),lastMessage:clean(text,700),lastReply:reply,
    handoffNeeded,handoffReason,createdAt:old?.createdAt||Date.now(),lastMessageAt:Date.now(),
    qualification:{hasService:Boolean(service),hasBudget:/ميزاني|budget|\b\d{3,}/i.test(allText),hasDeadline:/اسبوع|أسبوع|شهر|موعد|ميعاد|deadline|خلال|يوم/i.test(allText)}
  });
  await sendChannel(channel,sender,reply);
}
function extractEvents(body){
  const out=[];
  if(body?.object==='whatsapp_business_account'){
    for(const e of body.entry||[])for(const c of e.changes||[]){
      const v=c.value||{},contacts=v.contacts||[];
      for(const m of v.messages||[]){
        const text=m.text?.body||m.button?.text||m.interactive?.button_reply?.title||m.interactive?.list_reply?.title||'';
        if(text)out.push({channel:'whatsapp',sender:m.from,name:contacts.find(x=>x.wa_id===m.from)?.profile?.name||'',text,messageId:m.id});
      }
    }
  }else if(body?.object==='instagram'||body?.object==='page'){
    const channel=body.object==='instagram'?'instagram':'facebook';
    for(const e of body.entry||[])for(const m of e.messaging||[]){
      if(m.message?.is_echo)continue;
      const text=m.message?.text||m.postback?.title||m.postback?.payload||'';
      if(text)out.push({channel,sender:m.sender?.id||'',name:'',text,messageId:m.message?.mid||''});
    }
  }
  return out;
}
export default async function handler(req,res){
  if(req.method==='GET'){
    const mode=req.query?.['hub.mode'],token=req.query?.['hub.verify_token'],challenge=req.query?.['hub.challenge'];
    if(mode==='subscribe'&&VERIFY_TOKEN&&token===VERIFY_TOKEN)return send(res,200,String(challenge||''));
    return send(res,403,{error:'VERIFY_FAILED'});
  }
  if(req.method!=='POST')return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  const raw=bodyBuffer(req);
  if(APP_SECRET&&!verifySignature(req,raw))return send(res,401,{error:'BAD_SIGNATURE'});
  if(!APP_SECRET)return send(res,503,{error:'META_APP_SECRET_NOT_CONFIGURED'});
  let body=req.body;try{if(typeof body==='string'||Buffer.isBuffer(body))body=JSON.parse(body.toString())}catch{return send(res,400,{error:'BAD_JSON'})}
  const events=extractEvents(body);
  await Promise.allSettled(events.map(processMessage));
  return send(res,200,{ok:true,received:events.length});
}

// webhook verification deployment refresh

// deployment sync 1791528313794
