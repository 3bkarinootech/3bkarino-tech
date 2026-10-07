import { listRecords, saveRecord } from '../lib/records.js';
import { createFreshAccess } from '../lib/book-access.js';
import { sendAccessRecoveryEmail } from '../lib/email.js';

const LICENSE='3BK-A-MUXTXPTV-68DE';
const PREVIEW='https://3bkarino-tech-git-book-full-edition-v1-mahmoudexp9-6567.vercel.app';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(process.env.VERCEL_ENV!=='preview'){res.statusCode=404;return res.end('Not found')}
  const rows=await listRecords(200);
  const record=rows.find(r=>r.status==='paid'&&(r.licenses||[]).some(l=>l.licenseId===LICENSE));
  if(!record){res.statusCode=404;return res.end(JSON.stringify({ok:false,error:'NOT_FOUND'}))}
  const old=(record.licenses||[]).find(l=>l.licenseId===LICENSE);
  const normalized={...old,name:old.name||record.name,email:old.email||record.email,phone:old.phone||record.phone};
  const fresh=createFreshAccess(normalized,record.id,record);
  const licenses=(record.licenses||[]).map(l=>l.licenseId===LICENSE?{
    ...normalized,
    devices:[],
    pendingActivation:null,
    currentAccessId:fresh.accessId,
    readerUrl:fresh.readerUrl,
    activationExpiresAt:fresh.expiresAt,
    accessUsedAt:null
  }:l);
  const updated=await saveRecord({...record,siteOrigin:PREVIEW,licenses,lastReaderActivationAt:null});
  const lic=licenses.find(l=>l.licenseId===LICENSE);
  const mail=await sendAccessRecoveryEmail(updated,lic,fresh);
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify({ok:Boolean(mail.ok),deviceCount:0,sent:Boolean(mail.ok),provider:mail.provider||''}));
}