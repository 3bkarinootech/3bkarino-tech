import { listRecords } from '../lib/records.js';
function maskEmail(v){const s=String(v||'');const [u,d]=s.split('@');if(!d)return '';return (u.slice(0,2)||'*')+'***@'+d}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(process.env.VERCEL_ENV!=='preview'){res.statusCode=404;return res.end('Not found')}
  const rows=await listRecords(30);
  const out=rows.filter(x=>x.kind==='order'&&x.source==='book').slice(0,12).map(x=>({
    id:x.id,status:x.status||'',paymentStatus:x.paymentStatus||'',product:x.product||'',
    email:maskEmail(x.email),emailStatus:x.emailStatus||'',
    emailAttemptedAt:x.emailAttemptedAt||null,
    adminEmailOk:Boolean(x.emailDelivery?.adminOk),
    customerEmailOk:(x.emailDelivery?.customers||[]).map(c=>({email:maskEmail(c.email),ok:Boolean(c.ok)})),
    paidAt:x.paidAt||null,createdAt:x.createdAt||null
  }));
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(out));
}