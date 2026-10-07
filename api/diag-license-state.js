import { listRecords } from '../lib/records.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(process.env.VERCEL_ENV!=='preview'){res.statusCode=404;return res.end('Not found')}
  const rows=await listRecords(200);
  const out=rows.filter(r=>r.status==='paid').flatMap(r=>(r.licenses||[]).map(l=>({
    orderId:r.id,licenseId:l.licenseId,version:l.version,
    deviceCount:Array.isArray(l.devices)?l.devices.length:0,
    hasCurrentAccessId:Boolean(l.currentAccessId),
    accessUsedAt:l.accessUsedAt||null,
    activatedAt:l.activatedAt||null,
    hasPendingActivation:Boolean(l.pendingActivation),
    pendingDevice:Boolean(l.pendingActivation?.deviceHash),
    emailStatus:r.emailStatus||''
  }))).filter(x=>x.licenseId==='3BK-A-MUXTXPTV-68DE');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(out));
}