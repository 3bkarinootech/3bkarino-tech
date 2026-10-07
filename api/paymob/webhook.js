import { readRecord, saveRecord } from '../../lib/records.js';
import { paymobConfig, verifyTransactionHmac, extractMerchantOrderId } from '../../lib/paymob.js';
import { issueLicenses } from '../../lib/book-access.js';
import { sendPurchaseEmails } from '../../lib/email.js';

const PRODUCTS={A:{versions:['A']},B:{versions:['B']},BUNDLE:{versions:['A','B']}};
function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data))}

async function deliverEmails(record){
  try{
    const result=await sendPurchaseEmails(record);
    const customerResults=result.customers||[];
    const allCustomerOk=customerResults.length>0&&customerResults.every(x=>x.result?.ok);
    const status=!result.configured?'not_configured':(result.admin?.ok&&allCustomerOk?'sent':'partial_or_failed');
    return {status,details:{
      adminOk:Boolean(result.admin?.ok),adminId:result.admin?.id||'',
      customers:customerResults.map(x=>({email:x.email,ok:Boolean(x.result?.ok),id:x.result?.id||''}))
    }};
  }catch(err){
    console.error('PURCHASE_EMAIL_ERROR',err?.message||err);
    return {status:'failed',details:{error:'EMAIL_EXCEPTION'}};
  }
}

export default async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'METHOD_NOT_ALLOWED'});
  const url=new URL(req.url,'https://3bkarino-tech.vercel.app');
  const receivedHmac=url.searchParams.get('hmac')||'';
  let body=req.body;try{if(typeof body==='string')body=JSON.parse(body)}catch{return send(res,400,{error:'BAD_JSON'})}
  const obj=body?.obj;
  if(!obj||!verifyTransactionHmac(obj,receivedHmac))return send(res,401,{error:'INVALID_HMAC'});

  const cfg=paymobConfig(),merchantOrderId=extractMerchantOrderId(obj);
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
    if(record.status==='paid'&&record.emailStatus!=='sent'){
      const mail=await deliverEmails(record);
      await saveRecord({...record,emailStatus:mail.status,emailDelivery:mail.details,emailAttemptedAt:Date.now()});
      return send(res,200,{received:true,idempotent:true,paid:true,emailStatus:mail.status});
    }
    return send(res,200,{received:true,idempotent:true,paid:record.status==='paid',emailStatus:record.emailStatus||''});
  }

  const paid=obj.success===true&&obj.pending===false&&obj.is_refund!==true&&obj.is_void!==true&&obj.is_refunded!==true&&obj.is_voided!==true;
  if(!paid){
    if(record.status!=='paid')await saveRecord({...record,paymentStatus:'failed',lastPaymobTransactionId:String(obj.id||''),lastPaymentAt:Date.now()});
    return send(res,200,{received:true,paid:false});
  }
  if(record.status==='paid'){
    if(record.emailStatus!=='sent'){
      const mail=await deliverEmails(record);
      await saveRecord({...record,emailStatus:mail.status,emailDelivery:mail.details,emailAttemptedAt:Date.now()});
      return send(res,200,{received:true,paid:true,alreadyFulfilled:true,emailStatus:mail.status});
    }
    return send(res,200,{received:true,paid:true,alreadyFulfilled:true,emailStatus:record.emailStatus||'sent'});
  }

  const info=PRODUCTS[String(record.product||'').toUpperCase()];
  if(!info)return send(res,422,{error:'INVALID_PRODUCT'});
  let licenses;
  try{licenses=issueLicenses(record,info.versions)}catch(err){console.error('LICENSE_ISSUE_FAILED',err?.message||err);return send(res,503,{error:'FULFILLMENT_FAILED'})}

  const paidAt=Date.now();
  const paidRecord=await saveRecord({
    ...record,status:'paid',paymentStatus:'paid',paidAt,fulfillmentStatus:'license_issued',
    paymentProvider:'paymob',paymentTransactionId:String(obj.id),paymobOrderId:String(obj.order?.id||record.paymobOrderId||''),
    paymentCardLast4:String(obj.source_data?.pan||''),paymentCardType:String(obj.source_data?.sub_type||obj.source_data?.type||''),
    licenses,emailStatus:'queued'
  });

  const mail=await deliverEmails(paidRecord);
  await saveRecord({...paidRecord,emailStatus:mail.status,emailDelivery:mail.details,emailAttemptedAt:Date.now()});
  return send(res,200,{received:true,paid:true,licensed:true,emailStatus:mail.status});
}
