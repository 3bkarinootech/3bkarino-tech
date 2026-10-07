import { sendOperationalTestEmail } from '../lib/email.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(process.env.VERCEL_ENV!=='preview'){
    res.statusCode=404;return res.end('Not found');
  }
  if(req.method!=='GET'){
    res.statusCode=405;return res.end('Method not allowed');
  }
  const r=await sendOperationalTestEmail();
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.statusCode=r.ok?200:503;
  res.end(JSON.stringify({ok:Boolean(r.ok),provider:r.provider||'',error:r.error||''}));
}
