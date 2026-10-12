import { timingSafeEqual } from 'node:crypto';
import { listRecords } from '../../lib/records.js';

function authorized(req){
  const user=process.env.COMMAND_CENTER_USER||'',pass=process.env.COMMAND_CENTER_PASSWORD||'';
  if(!user||!pass)return false;
  const expected='Basic '+Buffer.from(user+':'+pass).toString('base64');
  const actual=req.headers.authorization||'';
  const a=Buffer.from(actual),b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  if(!authorized(req)){res.setHeader('WWW-Authenticate','Basic realm="3bkarino Private Admin"');return res.status(401).json({error:'UNAUTHORIZED'});}
  try{
    const records=await listRecords(200);
    const leads=records.filter(r=>r.kind==='lead');
    const orders=records.filter(r=>r.kind==='order');
    const paid=orders.filter(r=>r.status==='paid');
    const pending=orders.filter(r=>r.status==='pending_payment');
    const revenue=paid.reduce((sum,r)=>sum+(Number(r.amount)||0),0);
    return res.status(200).json({connected:true,source:'Vercel Blob records',limit:200,truncated:records.length>=200,leads:leads.length,openLeads:leads.filter(r=>!['won','lost','paid'].includes(r.status)).length,orders:orders.length,paidOrders:paid.length,pendingOrders:pending.length,paidRevenueEGP:revenue});
  }catch(err){console.error('ADMIN_RECORD_SUMMARY_FAILED',err?.message);return res.status(503).json({connected:false,reason:'Records storage unavailable or not configured'});}
}
