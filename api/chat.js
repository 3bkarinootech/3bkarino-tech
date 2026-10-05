import { generateText } from 'ai';

const buckets = new Map();
const MODEL = process.env.AI_MODEL || 'inclusionai/ling-3.1-flash';
const SYSTEM = `أنت مستشار أعمال وتسويق تابع لـ 3bkarino Tech. تحدث بالعربية المصرية الواضحة والمهنية. ساعد العميل في المواقع والتسويق وExcel والأتمتة والذكاء الاصطناعي. أعط إجابات عملية مختصرة، واسأل سؤالًا واحدًا فقط إذا كانت معلومة حاسمة ناقصة. لا تعد بنتائج مضمونة ولا تخترع سعرًا نهائيًا.`;

function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(payload));
}

function originOk(req){
  const origin=req.headers.origin;
  if(!origin) return true;
  try { return new URL(origin).host===req.headers.host; } catch { return false; }
}

function rate(key){
  const now=Date.now();
  const item=buckets.get(key)||{count:0,reset:now+60000};
  if(item.reset<=now){ item.count=0; item.reset=now+60000; }
  item.count++;
  buckets.set(key,item);
  return item.count<=10;
}

function validMessages(value){
  if(!Array.isArray(value)||value.length===0||value.length>16) return null;
  const messages=[];
  for(const message of value){
    if(!message||!['user','assistant'].includes(message.role)||typeof message.content!=='string') return null;
    const content=message.content.trim();
    if(!content||content.length>2500) return null;
    messages.push({role:message.role,content});
  }
  return messages.at(-1)?.role==='user' ? messages : null;
}

function wantsHandoff(messages){
  const userMessages=messages.filter(m=>m.role==='user');
  const text=userMessages.map(m=>m.content).join(' ');
  return userMessages.length>=4 || /(عرض\s*سعر|السعر|تكلفة|تنفيذ|ابد[أا]|واتساب|تواصل|احجز|عايز\s*(أعمل|اعمل))/i.test(text);
}

function makeSummary(messages){
  const lines=messages.filter(m=>m.role==='user').slice(-6).map((m,i)=>`${i+1}) ${m.content}`);
  return `ملخص طلب العميل:\n${lines.join('\n')}\n\nالخطوة المطلوبة: مراجعة الاحتياج واقتراح نطاق التنفيذ وعرض السعر المناسب.`;
}

export default async function handler(req,res){
  if(req.method==='GET'){
    return send(res,200,{enabled:true,model:MODEL});
  }

  if(req.method!=='POST'){
    res.setHeader('Allow','GET, POST');
    return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  }

  if(!originOk(req)) return send(res,403,{error:'FORBIDDEN'});

  const clientKey=String(
    req.headers['x-real-ip']||
    req.headers['x-forwarded-for']||
    req.socket?.remoteAddress||
    'unknown'
  );

  if(!rate(clientKey)){
    return send(res,429,{error:'RATE_LIMIT',message:'استنى دقيقة وجرب تاني.'});
  }

  let body=req.body;
  try {
    if(typeof body==='string') body=JSON.parse(body);
  } catch {
    return send(res,400,{error:'BAD_JSON'});
  }

  const messages=validMessages(body?.messages);
  if(!messages){
    return send(res,400,{error:'INVALID_MESSAGES',message:'راجع الرسائل وحاول تاني.'});
  }

  try {
    const {text}=await generateText({
      model:MODEL,
      system:SYSTEM,
      messages,
      providerOptions:{gateway:{has:['free']}},
      maxOutputTokens:900,
      maxRetries:1
    });

    const ready=wantsHandoff(messages);
    return send(res,200,{
      reply:text?.trim()||'تمام. احكيلي أكتر عن هدفك.',
      readyForHuman:ready,
      summary:ready?makeSummary(messages):''
    });
  } catch (error) {
    console.error('AI generation failed',error?.name,error?.message);
    return send(res,502,{error:'AI_FAILED',message:'حصلت مشكلة مؤقتة في توليد الرد. جرّب تاني.'});
  }
}
