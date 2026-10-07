import nodemailer from 'nodemailer';
const ADMIN_EMAIL='3bkarinoo.tech@gmail.com';
const SITE_URL=(process.env.SITE_URL||'https://3bkarino-tech.vercel.app').replace(/\/$/,'');
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function emailConfig(){
  const gmailUser=process.env.GMAIL_SMTP_USER||'';
  const gmailPass=process.env.GMAIL_APP_PASSWORD||'';
  const resendKey=process.env.RESEND_API_KEY||'';
  const resendFrom=process.env.RESEND_FROM_EMAIL||'';
  const gmailConfigured=Boolean(gmailUser&&gmailPass);
  const resendConfigured=Boolean(resendKey&&resendFrom);
  return {
    gmailUser,gmailPass,resendKey,resendFrom,
    provider:gmailConfigured?'gmail':(resendConfigured?'resend':'none'),
    configured:gmailConfigured||resendConfigured
  };
}
async function sendOne({to,subject,html}){
  const cfg=emailConfig();
  if(!cfg.configured)return {ok:false,skipped:true,reason:'EMAIL_NOT_CONFIGURED'};

  if(cfg.provider==='gmail'){
    try{
      const transporter=nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:465,
        secure:true,
        auth:{user:cfg.gmailUser,pass:cfg.gmailPass}
      });
      const info=await transporter.sendMail({
        from:'3bkarino Tech <'+cfg.gmailUser+'>',
        to,
        subject,
        html,
        text:html.replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
      });
      return {ok:true,id:info.messageId||'',provider:'gmail'};
    }catch(err){
      console.error('GMAIL_SEND_FAILED',err?.code||'',err?.message||err);
      return {ok:false,error:'GMAIL_SEND_FAILED',provider:'gmail'};
    }
  }

  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:'Bearer '+cfg.resendKey,'Content-Type':'application/json'},
    body:JSON.stringify({from:cfg.resendFrom,to:[to],subject,html})
  });
  const raw=await r.text();
  let data={};try{data=JSON.parse(raw)}catch{}
  if(!r.ok){
    console.error('EMAIL_SEND_FAILED',r.status,raw.slice(0,500));
    return {ok:false,status:r.status,error:data?.message||'SEND_FAILED',provider:'resend'};
  }
  return {ok:true,id:data.id||'',provider:'resend'};
}
function shell(title,body){
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f4f4ef;font-family:Arial,Tahoma,sans-serif;color:#151515"><div style="max-width:680px;margin:auto;padding:28px 16px"><div style="background:#111214;border-top:6px solid #f4d638;border-radius:18px;padding:26px;color:#fff"><div style="font-size:12px;color:#f4d638;font-weight:700">3BKARINO TECH</div><h1 style="margin:8px 0 4px;font-size:28px">${esc(title)}</h1></div><div style="background:#fff;border:1px solid #deded6;border-radius:18px;padding:24px;margin-top:12px;line-height:1.8">${body}</div><p style="font-size:11px;color:#777;text-align:center">© 2026 3bkarino Tech — AI Marketing Machine</p></div></body></html>`;
}
function accessButton(url,label='افتح نسختك'){
  return `<p style="margin:24px 0"><a href="${esc(url)}" style="display:inline-block;background:#f4d638;color:#111;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">${esc(label)}</a></p>`;
}
export async function sendPurchaseEmails(record){
  const licenses=record.licenses||[];
  const adminBody=`
    <h2 style="margin-top:0">عملية شراء جديدة مؤكدة</h2>
    <p><b>رقم الطلب:</b> ${esc(record.id)}<br>
    <b>الاسم:</b> ${esc(record.name)}<br>
    <b>الموبايل:</b> ${esc(record.phone)}<br>
    <b>واتساب:</b> ${esc(record.whatsapp)}<br>
    <b>البريد:</b> ${esc(record.email)}<br>
    <b>المحافظة:</b> ${esc(record.governorate)}<br>
    <b>المدينة/المنطقة:</b> ${esc(record.city)}<br>
    <b>النشاط:</b> ${esc(record.activity||'—')}</p>
    <p><b>المنتج:</b> ${esc(record.productLabel||record.product)}<br>
    <b>المبلغ:</b> ${esc(record.amount)} ${esc(record.currency||'EGP')}<br>
    <b>طريقة الدفع:</b> ${esc(record.paymentProvider||record.paymentMethod||'Paymob')}<br>
    <b>Paymob Transaction ID:</b> ${esc(record.paymentTransactionId||'—')}<br>
    <b>Paymob Order ID:</b> ${esc(record.paymobOrderId||'—')}<br>
    <b>حالة الدفع:</b> ${esc(record.paymentStatus||record.status)}</p>
    <p><b>التراخيص:</b><br>${licenses.map(l=>esc(l.version)+' — '+esc(l.licenseId)+' — '+esc(l.email)).join('<br>')||'—'}</p>
    ${record.recipient?'<p><b>المستلم الثاني:</b> '+esc(record.recipient.name)+' — '+esc(record.recipient.email||'—')+' — '+esc(record.recipient.phone||'—')+'</p>':''}
  `;
  const admin=await sendOne({to:ADMIN_EMAIL,subject:'طلب كتاب مدفوع — '+record.id,html:shell('New Paid Book Order',adminBody)});

  const grouped=new Map();
  for(const l of licenses){
    const email=String(l.email||record.email||'').toLowerCase();
    if(!email.includes('@'))continue;
    if(!grouped.has(email))grouped.set(email,[]);
    grouped.get(email).push(l);
  }
  const customers=[];
  for(const [email,ls] of grouped){
    const name=ls[0]?.name||record.name;
    const links=ls.map(l=>{
      const base=(record.siteOrigin||SITE_URL).replace(/\/$/,'');
      const url=base+l.readerUrl;
      return `<div style="border:1px solid #e2e2da;border-radius:12px;padding:14px;margin:10px 0"><b>Version ${esc(l.version)}</b><br><span style="font-size:12px;color:#666">License: ${esc(l.licenseId)}</span>${accessButton(url,'فتح Version '+l.version)}</div>`;
    }).join('');
    const body=`
      <p>أهلًا <b>${esc(name)}</b> 👋</p>
      <p>تم تأكيد دفع طلبك <b>${esc(record.id)}</b> وإصدار النسخة المرخصة باسمك.</p>
      <p><b>المبلغ:</b> ${esc(record.amount)} جنيه<br><b>المنتج:</b> ${esc(record.productLabel||record.product)}</p>
      ${links}
      <p style="background:#fff8d8;border:1px solid #eadb80;border-radius:10px;padding:12px"><b>مهم:</b> رابط التفعيل في الرسالة صالح لمدة 24 ساعة. بعد أول فتح يتم إنشاء جلسة قراءة آمنة على جهازك وتتجدد مع الاستخدام. لو احتجت رابط دخول جديد لاحقًا، هنقدر نصدره بعد التحقق من بريد الشراء.</p>
      <p>النسخة شخصية ومرتبطة ببيانات الترخيص. من فضلك لا تشارك رابط التفعيل أو بيانات الدخول.</p>
    `;
    customers.push({email,result:await sendOne({to:email,subject:'نسختك من AI Marketing Machine — '+record.id,html:shell('تم إصدار نسختك',body)})});
  }
  return {configured:emailConfig().configured,admin,customers};
}

export function purchaseEmailConfigured(){return emailConfig().configured}
export function purchaseEmailProvider(){return emailConfig().provider}

export async function sendAccessRecoveryEmail(record,license,fresh){
  const base=(record.siteOrigin||SITE_URL).replace(/\/$/,'');
  const url=base+fresh.readerUrl;
  const body=`
    <p>أهلًا <b>${esc(license.name||record.name)}</b> 👋</p>
    <p>طلبت رابط دخول جديد لنسختك من <b>AI Marketing Machine</b>.</p>
    <p><b>رقم الطلب:</b> ${esc(record.id)}<br><b>Version:</b> ${esc(license.version)}<br><b>License:</b> ${esc(license.licenseId)}</p>
    ${accessButton(url,'فتح نسختي')}
    <p style="background:#fff8d8;border:1px solid #eadb80;border-radius:10px;padding:12px">الرابط صالح لمدة 24 ساعة لإعادة تفعيل جلسة القراءة. لا تشاركه مع أي شخص.</p>
  `;
  return sendOne({to:license.email||record.email,subject:'رابط دخول جديد — AI Marketing Machine',html:shell('رابط دخول جديد',body)});
}

