import { createHmac, timingSafeEqual, randomBytes, randomInt } from 'node:crypto';

const FIRST_LINK_MS=24*60*60*1000;
const SESSION_MS=30*24*60*60*1000;
const OTP_MS=10*60*1000;
const MAX_DEVICES=1;

function secret(){return process.env.BOOK_LICENSE_SECRET||''}
function b64(v){return Buffer.from(JSON.stringify(v)).toString('base64url')}
function sign(payload){
  const s=secret();if(!s)throw new Error('BOOK_SECRET_MISSING');
  return createHmac('sha256',s).update(payload).digest('base64url');
}
function hmac(label,value){
  const s=secret();if(!s)throw new Error('BOOK_SECRET_MISSING');
  return createHmac('sha256',s).update(label+':'+String(value||'')).digest('base64url');
}
function accessId(){return randomBytes(18).toString('base64url')}

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
export function deviceHash(deviceId){
  const d=String(deviceId||'').trim();
  if(d.length<12)return '';
  return hmac('device',d);
}
export function makeOtp(){
  return String(randomInt(0,1000000)).padStart(6,'0');
}
export function otpHash(orderId,licenseIdValue,deviceHashValue,otp){
  return hmac('otp',String(orderId)+'|'+String(licenseIdValue)+'|'+String(deviceHashValue)+'|'+String(otp));
}
export function otpMatches(expectedHash,orderId,licenseIdValue,deviceHashValue,otp){
  if(!expectedHash)return false;
  const actual=otpHash(orderId,licenseIdValue,deviceHashValue,otp);
  const a=Buffer.from(String(expectedHash)),b=Buffer.from(actual);
  return a.length===b.length&&timingSafeEqual(a,b);
}
export function issueLicenses(record,versions){
  const now=Date.now();
  return versions.map(version=>{
    const recipient=version==='B'&&record.recipient?record.recipient:null;
    const name=recipient?.name||record.name;
    const email=recipient?.email&&String(recipient.email).includes('@')?recipient.email:record.email;
    const phone=recipient?.phone||record.phone;
    const id=licenseId(version),aid=accessId();
    const accessToken=token({type:'book-access',accessId:aid,licenseId:id,orderId:record.id,version,name,email,phone,iat:now,exp:now+FIRST_LINK_MS});
    return {
      licenseId:id,version,name,email,phone,issuedAt:now,
      currentAccessId:aid,activationExpiresAt:now+FIRST_LINK_MS,accessUsedAt:null,
      devices:[],
      readerUrl:'/book/read?access='+encodeURIComponent(accessToken)
    };
  });
}
export function createFreshAccess(license,orderId,record={}){
  const now=Date.now(),aid=accessId();
  const name=license.name||record.name||'Customer';
  const email=license.email||record.email||'';
  const phone=license.phone||record.phone||'';
  const accessToken=token({
    type:'book-access',accessId:aid,licenseId:license.licenseId,orderId,version:license.version,
    name,email,phone,iat:now,exp:now+FIRST_LINK_MS
  });
  return {accessToken,accessId:aid,expiresAt:now+FIRST_LINK_MS,readerUrl:'/book/read?access='+encodeURIComponent(accessToken)};
}
export function createReaderSession(access,deviceHashValue){
  const now=Date.now();
  return token({
    type:'reader-session',licenseId:access.licenseId,orderId:access.orderId,version:access.version,
    name:access.name,email:access.email,phone:access.phone,deviceHash:deviceHashValue,iat:now,exp:now+SESSION_MS
  });
}
export const ACCESS_POLICY={
  firstLinkHours:24,rollingSessionDays:30,otpMinutes:10,maxDevices:MAX_DEVICES,
  oneTimeActivation:true,deviceBoundSession:true,singleActiveDevice:true,pdfAttachment:false
};
