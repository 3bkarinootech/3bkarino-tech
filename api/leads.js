import { randomUUID } from 'node:crypto';
import { saveRecord, readRecord, listRecords } from '../lib/records.js';

const ADMIN=process.env.SITE_ADMIN_KEY||process.env.BOOK_ADMIN_KEY||'';
const buckets=new Map();

function send(res,status,data){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(data));
}
function sameOrigin(req){
  const origin=req.headers.origin;
  if(!origin)return true;
  try{return new URL(origin).host===req.headers.host}catch{return false}
}
function rateLimit(req){
  const key=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  const now=Date.now(),item=buckets.get(key)||{count:0,reset:now+60000};
  if(item.reset<=now){item.count=0;item.reset=now+60000}
  item.count++;buckets.set(key,item);return item.count<=20;
}
function clean(v,n=500){return String(v||'').trim().slice(0,n)}
function adminOk(req,body){const key=clean(req.headers['x-admin-key']||body?.adminKey,300);return Boolean(ADMIN&&key===ADMIN)}
function leadId(){return '3BK-LEAD-'+Date.now().toString(36).toUpperCase()+'-'+randomUUID().slice(0,6).toUpperCase()}

export default async function handler(req,res){
  if(req.method==='GET'){
    if(!adminOk(req))return send(res,403,{error:'ADMIN_REQUIRED'});
    const records=await listRecords(150);
    return send(res,200,{records,total:records.length});
  }
  if(req.method!=='POST')return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  if(!sameOrigin(req))return send(res,403,{error:'FORBIDDEN'});
  if(!rateLimit(req))return send(res,429,{error:'RATE_LIMIT'});
  let body=req.body;try{if(typeof body==='string')body=JSON.parse(body)}catch{return send(res,400,{error:'BAD_JSON'})}
  const action=body?.action||'create';

  if(action==='create'){
    const name=clean(body.name,120),email=clean(body.email,180).toLowerCase(),phone=clean(body.phone,40);
    const source=clean(body.source||'contact',50),service=clean(body.service,160),goal=clean(body.goal,1600);
    if(name.length<2||phone.length<8||!email.includes('@')||!service)return send(res,400,{error:'INVALID_LEAD'});
    const record=await saveRecord({
      id:leadId(),kind:'lead',source,status:'new',createdAt:Date.now(),
      name,email,phone,service,plan:clean(body.plan,200),goal,
      budget:clean(body.budget,100),deadline:clean(body.deadline,100),
      referrer:clean(body.referrer,500),page:clean(body.page,300)
    });
    return send(res,200,{ok:true,id:record.id});
  }

  if(action==='update'){
    if(!adminOk(req,body))return send(res,403,{error:'ADMIN_REQUIRED'});
    const id=clean(body.id,120),old=await readRecord(id);
    if(!old)return send(res,404,{error:'NOT_FOUND'});
    const allowed=['new','contacted','qualified','pending_payment','paid','won','lost'];
    const status=allowed.includes(body.status)?body.status:old.status;
    const updated=await saveRecord({...old,status,notes:clean(body.notes??old.notes,1800)});
    return send(res,200,{ok:true,record:updated});
  }
  return send(res,400,{error:'UNKNOWN_ACTION'});
}
