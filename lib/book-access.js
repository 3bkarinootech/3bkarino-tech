import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const FIRST_LINK_MS=24*60*60*1000;
const SESSION_MS=30*24*60*60*1000;

function secret(){return process.env.BOOK_LICENSE_SECRET||''}
function b64(v){return Buffer.from(JSON.stringify(v)).toString('base64url')}
function sign(payload){
  const s=secret();if(!s)throw new Error('BOOK_SECRET_MISSING');
  return createHmac('sha256',s).update(payload).digest('base64url');
}
export function token(data){const p=b64(data);return p+'.'+sign(p)}
export function verifyToken(t){
  if(!secret()||typeof t!=='string')return null;
  const [p,sig]=t.split('.');if(!p||!sig)return null;
  try{
    const exp=sign(p),a=Buffer.from(sig),b=Buffer.from(exp);
    if(a.length!==b.length||!timingSafeEqual(a,b))return null;
    const data=JSON.parse(Buffer.from(p,'base64url').toString('utf8'));
    if(data.exp&&Date.now()>Number(data.exp))return null;
    return data;
  }catch{return null}
}
export function licenseId(ver){
  return '3BK-'+ver+'-'+Date.now().toString(36).toUpperCase()+'-'+randomBytes(2).toString('hex').toUpperCase();
}
export function issueLicenses(record,versions){
  const now=Date.now();
  return versions.map(version=>{
    const recipient=version==='B'&&record.recipient?record.recipient:null;
    const name=recipient?.name||record.name;
    const email=recipient?.email&&String(recipient.email).includes('@')?recipient.email:record.email;
    const phone=recipient?.phone||record.phone;
    const id=licenseId(version);
    const accessToken=token({type:'book-access',licenseId:id,orderId:record.id,version,name,email,phone,iat:now,exp:now+FIRST_LINK_MS});
    return {
      licenseId:id,version,name,email,phone,issuedAt:now,
      activationExpiresAt:now+FIRST_LINK_MS,
      readerUrl:'/book/read?access='+encodeURIComponent(accessToken)
    };
  });
}
export function createFreshAccess(license,orderId,record={}){
  const now=Date.now();
  const name=license.name||record.name||'Customer';
  const email=license.email||record.email||'';
  const phone=license.phone||record.phone||'';
  const accessToken=token({
    type:'book-access',licenseId:license.licenseId,orderId,version:license.version,
    name,email,phone,iat:now,exp:now+FIRST_LINK_MS
  });
  return {accessToken,expiresAt:now+FIRST_LINK_MS,readerUrl:'/book/read?access='+encodeURIComponent(accessToken)};
}
export function createReaderSession(access){
  const now=Date.now();
  return token({
    type:'reader-session',licenseId:access.licenseId,orderId:access.orderId,version:access.version,
    name:access.name,email:access.email,phone:access.phone,iat:now,exp:now+SESSION_MS
  });
}
export const ACCESS_POLICY={firstLinkHours:24,rollingSessionDays:30,pdfAttachment:false};
