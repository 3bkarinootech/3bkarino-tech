import { createHmac } from 'node:crypto';
import { readRecord, saveRecord } from '../../lib/records.js';
import { paymobConfig, verifyTransactionHmac, extractMerchantOrderId } from '../../lib/paymob.js';

const BOOK_SECRET=process.env.BOOK_LICENSE_SECRET||'';
const PRODUCTS={
  A:{versions:['A']},
  B:{versions:['B']},
  BUNDLE:{versions:['A','B']}
};

function send(res,status,data){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(data));
}
function b64(v){return Buffer.from(JSON.stringify(v)).toString('base64url')}
function sign(payload){
  if(!BOOK_SECRET)throw new Error('BOOK_SECRET_MISSING');
  return createHmac('sha256',BOOK_SECRET).update(payload).digest('base64url');
}
function token(data){const p=b64(data);return p+'.'+sign(p)}
function licenseId(ver){return '3BK-'+ver+'-'+Date.now().toString(36).toUpperCase()}
function issueLicenses(record){
  const info=PRODUCTS[String(record.product||'').toUpperCase()];
  if(!info)throw new Error('INVALID_PRODUCT');
  const issuedAt=Date.now();
  return info.versions.map(version=>{
    const recipient=version==='B'&&record.recipient?record.recipient:null;
    const name=recipient?.name||record.name;
    const email=recipient?.email&&String(recipient.email).includes('@')?recipient.email:record.email;
    const phone=recipient?.phone||record.phone;
    const id=licenseId(version);
    const licenseToken=token({type:'license',licenseId:id,name,email,phone,version,product:record.product,orderId:record.id,issuedAt});
    return {licenseId:id,version,licenseToken,readerUrl:'/book/read?license='+encodeURIComponent(licenseToken)};
  });
}

export default async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  const url=new URL(req.url,'https://3bkarino-tech.vercel.app');
  const receivedHmac=url.searchParams.get('hmac')||'';
  let body=req.body;
  try{if(typeof body==='string')body=JSON.parse(body)}catch{return send(res,400,{error:'BAD_JSON'})}
  const obj=body?.obj;
  if(!obj||!verifyTransactionHmac(obj,receivedHmac))return send(res,401,{error:'INVALID_HMAC'});

  const cfg=paymobConfig();
  const merchantOrderId=extractMerchantOrderId(obj);
  if(!merchantOrderId)return send(res,422,{error:'ORDER_REFERENCE_MISSING'});
  const record=await readRecord(merchantOrderId);
  if(!record)return send(res,404,{error:'ORDER_NOT_FOUND'});

  const expectedAmount=Math.round(Number(record.amount||0)*100);
  const amountMatches=Number(obj.amount_cents)===expectedAmount;
  const currencyMatches=String(obj.currency||'').toUpperCase()==='EGP';
  const integrationMatches=Number(obj.integration_id)===Number(cfg.integrationId);
  const modeMatches=cfg.mode==='live'?obj.is_live===true:obj.is_live!==true;

  if(!amountMatches||!currencyMatches||!integrationMatches||!modeMatches){
    console.error('PAYMOB_CALLBACK_MISMATCH',{merchantOrderId,amountMatches,currencyMatches,integrationMatches,modeMatches});
    return send(res,422,{error:'PAYMENT_MISMATCH'});
  }

  if(record.paymentTransactionId&&String(record.paymentTransactionId)===String(obj.id)){
    return send(res,200,{received:true,idempotent:true});
  }

  const paid=obj.success===true&&obj.pending===false&&obj.is_refund!==true&&obj.is_void!==true&&obj.is_refunded!==true&&obj.is_voided!==true;
  if(!paid){
    if(record.status!=='paid'&&record.status!=='won'){
      await saveRecord({...record,paymentStatus:'failed',lastPaymobTransactionId:String(obj.id||''),lastPaymentAt:Date.now()});
    }
    return send(res,200,{received:true,paid:false});
  }

  if(record.status==='paid'||record.status==='won'){
    return send(res,200,{received:true,paid:true,alreadyFulfilled:true});
  }

  let licenses;
  try{licenses=issueLicenses(record)}catch(err){
    console.error('LICENSE_ISSUE_FAILED',err?.message||err);
    return send(res,503,{error:'FULFILLMENT_FAILED'});
  }

  const paidAt=Date.now();
  await saveRecord({
    ...record,
    status:'paid',
    paymentStatus:'paid',
    paidAt,
    fulfillmentStatus:'license_issued',
    paymentProvider:'paymob',
    paymentTransactionId:String(obj.id),
    paymobOrderId:String(obj.order?.id||record.paymobOrderId||''),
    paymentCardLast4:String(obj.source_data?.pan||''),
    paymentCardType:String(obj.source_data?.sub_type||obj.source_data?.type||''),
    licenses
  });
  return send(res,200,{received:true,paid:true});
}
