import { listRecords, saveRecord } from '../lib/records.js';
import { createFreshAccess } from '../lib/book-access.js';
import { sendPurchaseEmails } from '../lib/email.js';

const PREVIEW='https://3bkarino-tech-git-book-full-edition-v1-mahmoudexp9-6567.vercel.app';
const TARGETS=new Set(['3BK-BOOK-MUXUMP2K','3BK-BOOK-MUXU5ORO','3BK-BOOK-MUXTRCUB','3BK-BOOK-MUWZPDT2']);

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(process.env.VERCEL_ENV!=='preview'){res.statusCode=404;return res.end('Not found')}
  const rows=await listRecords(60);
  const results=[];
  for(const record of rows.filter(x=>TARGETS.has(x.id)&&x.status==='paid')){
    const licenses=(record.licenses||[]).map(l=>{
      const normalized={...l,name:l.name||record.name,email:l.email||record.email,phone:l.phone||record.phone};
      const fresh=createFreshAccess(normalized,record.id,record);
      return {...normalized,readerUrl:fresh.readerUrl,activationExpiresAt:fresh.expiresAt};
    });
    const updated=await saveRecord({...record,siteOrigin:PREVIEW,licenses,emailStatus:'retrying',emailAttemptedAt:Date.now()});
    const mail=await sendPurchaseEmails(updated);
    const customers=mail.customers||[];
    const ok=Boolean(mail.admin?.ok)&&customers.length>0&&customers.every(x=>x.result?.ok);
    await saveRecord({...updated,emailStatus:ok?'sent':'partial_or_failed',emailDelivery:{
      adminOk:Boolean(mail.admin?.ok),adminId:mail.admin?.id||'',
      customers:customers.map(x=>({email:x.email,ok:Boolean(x.result?.ok),id:x.result?.id||''}))
    },emailAttemptedAt:Date.now()});
    results.push({id:record.id,ok,customers:customers.length,provider:customers[0]?.result?.provider||''});
  }
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(results));
}