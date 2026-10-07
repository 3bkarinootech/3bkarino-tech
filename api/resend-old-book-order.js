import { readRecord, saveRecord } from '../lib/records.js';
import { createFreshAccess } from '../lib/book-access.js';
import { sendPurchaseEmails } from '../lib/email.js';

const ORDER_ID='3BK-BOOK-MUWZPDT2';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(process.env.VERCEL_ENV!=='preview'){res.statusCode=404;return res.end('Not found')}
  const record=await readRecord(ORDER_ID);
  if(!record||record.status!=='paid'){res.statusCode=404;return res.end(JSON.stringify({ok:false,error:'ORDER_NOT_FOUND_OR_UNPAID'}))}
  const licenses=(record.licenses||[]).map(l=>{
    const normalized={...l,name:l.name||record.name,email:l.email||record.email,phone:l.phone||record.phone};
    const fresh=createFreshAccess(normalized,record.id,record);
    return {...normalized,readerUrl:fresh.readerUrl,activationExpiresAt:fresh.expiresAt};
  });
  const updated=await saveRecord({...record,licenses,emailStatus:'retrying',emailAttemptedAt:Date.now()});
  const mail=await sendPurchaseEmails(updated);
  const customers=mail.customers||[];
  const sent=Boolean(mail.admin?.ok)&&customers.length>0&&customers.every(x=>x.result?.ok);
  await saveRecord({...updated,emailStatus:sent?'sent':'partial_or_failed',emailDelivery:{
    adminOk:Boolean(mail.admin?.ok),adminId:mail.admin?.id||'',
    customers:customers.map(x=>({email:x.email,ok:Boolean(x.result?.ok),id:x.result?.id||''}))
  },emailAttemptedAt:Date.now()});
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify({ok:sent,customerCount:customers.length,provider:customers[0]?.result?.provider||'',adminOk:Boolean(mail.admin?.ok)}));
}