import { saveRecord, readRecord } from '../lib/records.js';
import { createBookIntention, paymobConfig } from '../lib/paymob.js';
import { BOOK_META, bookForVersion } from '../lib/book-content.js';
import { ACCESS_POLICY, token, verifyToken, issueLicenses, createFreshAccess, createReaderSession } from '../lib/book-access.js';
import { purchaseEmailConfigured, purchaseEmailProvider, sendAccessRecoveryEmail } from '../lib/email.js';

const ADMIN=process.env.BOOK_ADMIN_KEY||'';
const WA='201120124338';
const PRODUCTS={
  A:{label:'Version A — Strategic Edition',price:299,versions:['A']},
  B:{label:'Version B — Challenge Edition',price:299,versions:['B']},
  BUNDLE:{label:'A + B Bundle',price:500,versions:['A','B']}
};
function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data))}
function clean(v,n=120){return String(v||'').trim().slice(0,n)}
function maskEmail(email){const [u,d]=String(email||'').split('@');if(!d)return email||'';return (u.slice(0,2)||'*')+'***@'+d}
function productInfo(v){return PRODUCTS[String(v||'').toUpperCase()]||null}
function orderId(){return '3BK-BOOK-'+Date.now().toString(36).toUpperCase()}
function customerFromToken(t){return {name:t.name,emailMasked:maskEmail(t.email),licenseId:t.licenseId,version:t.version,orderId:t.orderId}}

export default async function handler(req,res){
  if(req.method==='GET')return send(res,200,{
    enabled:Boolean(process.env.BOOK_LICENSE_SECRET),
    meta:BOOK_META,products:PRODUCTS,delivery:'licensed-online-reader',
    accessPolicy:ACCESS_POLICY,pdfAttachment:false,emailConfigured:purchaseEmailConfigured(),emailProvider:purchaseEmailProvider(),
    paymentConfigured:paymobConfig().configured,paymentMode:paymobConfig().mode,
    paymentMethods:{paymob:{enabled:paymobConfig().configured,automatic:true,mode:paymobConfig().mode}}
  });
  if(req.method!=='POST')return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  let body=req.body;try{if(typeof body==='string')body=JSON.parse(body)}catch{return send(res,400,{error:'BAD_JSON'})}
  const action=body?.action;

  if(action==='create-order'){
    const name=clean(body.name),email=clean(body.email,180).toLowerCase(),phone=clean(body.phone,30);
    const whatsapp=clean(body.whatsapp||body.phone,30),governorate=clean(body.governorate,80),city=clean(body.city,100);
    const country=clean(body.country||'Egypt',80),activity=clean(body.activity,120);
    const secondName=clean(body.secondName,120),secondEmail=clean(body.secondEmail,180).toLowerCase(),secondPhone=clean(body.secondPhone,30);
    const product=String(body.product||'').toUpperCase(),info=productInfo(product),paymentMethod='paymob';
    if(name.length<2||!email.includes('@')||phone.length<8||whatsapp.length<8||!governorate||!city||!info)return send(res,400,{error:'INVALID_CUSTOMER_OR_PRODUCT'});
    if(product==='BUNDLE'&&secondName&&secondEmail&&!secondEmail.includes('@'))return send(res,400,{error:'INVALID_SECOND_RECIPIENT_EMAIL'});
    const id=orderId(),createdAt=Date.now(),customer={name,email,phone,whatsapp,governorate,city,country,activity};
    const recipient=product==='BUNDLE'&&secondName?{name:secondName,email:secondEmail,phone:secondPhone}:null;
    const orderToken=token({type:'order',id,...customer,product,price:info.price,paymentMethod,recipient,createdAt});
    const paymentReady=paymobConfig().configured;
    try{
      await saveRecord({id,kind:'order',source:'book',status:'pending_payment',createdAt,...customer,product,productLabel:info.label,amount:info.price,currency:'EGP',paymentMethod,paymentReady,recipient,consentAt:createdAt});
    }catch(err){console.error('ORDER_RECORD_FAILED',err);return send(res,503,{error:'ORDER_STORAGE_UNAVAILABLE'})}
    let paymob=null,paymentError='';
    if(paymentReady){
      try{
        paymob=await createBookIntention(req,{id,...customer,product,recipient},info);
        const record=await readRecord(id);
        if(record)await saveRecord({...record,paymentReady:true,paymentStatus:'awaiting_payment',paymobIntentionId:paymob.intentionId,paymobOrderId:String(paymob.paymobOrderId||'')});
      }catch(err){
        console.error('PAYMOB_START_FAILED',err?.message||err);paymentError='PAYMOB_START_FAILED';
        const record=await readRecord(id);if(record)await saveRecord({...record,paymentReady:false,paymentStatus:'init_failed'});
      }
    }
    const msg='طلب شراء AI Marketing Machine\nرقم الطلب: '+id+'\nالاسم: '+name+'\nالإيميل: '+email+'\nالموبايل: '+phone+'\nالمنتج: '+info.label+'\nالسعر: '+info.price+' جنيه';
    return send(res,200,{orderId:id,product,productLabel:info.label,price:info.price,orderToken,paymentMethod,paymentReady:Boolean(paymob?.checkoutUrl),paymentMode:paymobConfig().mode,paymentUrl:paymob?.checkoutUrl||'',paymentError,whatsappUrl:'https://wa.me/'+WA+'?text='+encodeURIComponent(msg)});
  }

  if(action==='issue-license'){
    if(!ADMIN||body.adminKey!==ADMIN)return send(res,403,{error:'ADMIN_REQUIRED'});
    const order=verifyToken(body.orderToken);if(!order||order.type!=='order')return send(res,400,{error:'INVALID_ORDER'});
    const info=productInfo(order.product);if(!info)return send(res,400,{error:'INVALID_PRODUCT'});
    const existing=await readRecord(order.id);if(!existing)return send(res,404,{error:'ORDER_NOT_FOUND'});
    if(existing.licenses?.length)return send(res,200,{product:order.product,price:info.price,licenses:existing.licenses});
    const licenses=issueLicenses(existing,info.versions),issuedAt=Date.now();
    await saveRecord({...existing,status:'paid',paymentStatus:existing.paymentStatus||'manual_confirmed',paidAt:existing.paidAt||issuedAt,fulfillmentStatus:'license_issued',licenses});
    return send(res,200,{product:order.product,price:info.price,licenses});
  }

  if(action==='order-status'){
    const order=verifyToken(body.orderToken);if(!order||order.type!=='order')return send(res,401,{error:'INVALID_ORDER_TOKEN'});
    const record=await readRecord(order.id);if(!record)return send(res,404,{error:'ORDER_NOT_FOUND'});
    return send(res,200,{
      orderId:record.id,status:record.status||'pending_payment',paymentStatus:record.paymentStatus||record.status||'pending_payment',
      product:record.product,productLabel:record.productLabel,amount:record.amount,currency:record.currency||'EGP',
      paidAt:record.paidAt||null,emailStatus:record.emailStatus||'',
      licenses:(record.status==='paid'||record.status==='won')?(record.licenses||[]).map(x=>({licenseId:x.licenseId,version:x.version,readerUrl:x.readerUrl,activationExpiresAt:x.activationExpiresAt||null})):[],
      mode:paymobConfig().mode
    });
  }

  if(action==='activate-access'){
    const access=verifyToken(body.accessToken);
    if(!access||access.type!=='book-access')return send(res,401,{error:'ACCESS_LINK_EXPIRED_OR_INVALID'});
    const record=await readRecord(access.orderId);if(!record||record.status!=='paid')return send(res,403,{error:'ORDER_NOT_PAID'});
    const lic=(record.licenses||[]).find(x=>x.licenseId===access.licenseId&&x.version===access.version);
    if(!lic)return send(res,403,{error:'LICENSE_NOT_FOUND'});
    const sessionToken=createReaderSession(access);
    await saveRecord({...record,lastReaderActivationAt:Date.now()});
    return send(res,200,{valid:true,sessionToken,customer:customerFromToken(access),meta:BOOK_META});
  }

  if(action==='validate'||action==='content'){
    let session=verifyToken(body.sessionToken);
    if(!session&&body.licenseToken){
      const legacy=verifyToken(body.licenseToken);
      if(legacy?.type==='license')session={...legacy,type:'reader-session'};
    }
    if(!session||session.type!=='reader-session')return send(res,401,{error:'READER_SESSION_EXPIRED'});
    const record=await readRecord(session.orderId);if(!record||record.status!=='paid')return send(res,403,{error:'ORDER_NOT_PAID'});
    const valid=(record.licenses||[]).some(x=>x.licenseId===session.licenseId&&x.version===session.version);
    if(!valid)return send(res,403,{error:'LICENSE_NOT_FOUND'});
    const customer=customerFromToken(session);
    const rotated=createReaderSession(session);
    if(action==='validate')return send(res,200,{valid:true,customer,sessionToken:rotated,meta:BOOK_META});
    return send(res,200,{valid:true,customer,sessionToken:rotated,meta:BOOK_META,chapters:bookForVersion(session.version)});
  }

  if(action==='request-access'){
    const orderIdInput=clean(body.orderId,120),email=clean(body.email,180).toLowerCase();
    if(!orderIdInput||!email.includes('@'))return send(res,400,{error:'ORDER_AND_EMAIL_REQUIRED'});
    const record=await readRecord(orderIdInput);
    if(!record||record.status!=='paid')return send(res,200,{accepted:true});
    const lic=(record.licenses||[]).find(x=>String(x.email||record.email).toLowerCase()===email);
    if(!lic)return send(res,200,{accepted:true});
    if(!purchaseEmailConfigured())return send(res,503,{error:'EMAIL_NOT_CONFIGURED'});
    const fresh=createFreshAccess(lic,record.id);
    const result=await sendAccessRecoveryEmail(record,lic,fresh);
    if(!result.ok)return send(res,503,{error:'EMAIL_SEND_FAILED'});
    const updated=(record.licenses||[]).map(x=>x.licenseId===lic.licenseId?{...x,readerUrl:fresh.readerUrl,activationExpiresAt:fresh.expiresAt}:x);
    await saveRecord({...record,licenses:updated,lastAccessEmailAt:Date.now()});
    return send(res,200,{accepted:true});
  }

  return send(res,400,{error:'UNKNOWN_ACTION'});
}
