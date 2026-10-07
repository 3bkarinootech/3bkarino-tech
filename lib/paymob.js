import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE='https://accept.paymob.com';

function clean(v,n=240){return String(v??'').trim().slice(0,n)}
function normalizePhone(v){
  const p=clean(v,40).replace(/[\s()-]/g,'');
  if(/^01\d{9}$/.test(p))return '+2'+p;
  if(/^201\d{9}$/.test(p))return '+'+p;
  return p;
}
function splitName(name){
  const parts=clean(name,120).split(/\s+/).filter(Boolean);
  return {firstName:parts[0]||'Customer',lastName:parts.slice(1).join(' ')||parts[0]||'Customer'};
}
export function requestOrigin(req){
  const host=clean(req.headers?.['x-forwarded-host']||req.headers?.host,200).toLowerCase();
  if(host==='3bkarino-tech.vercel.app'||(host.startsWith('3bkarino-tech-')&&host.endsWith('.vercel.app'))){
    return 'https://'+host;
  }
  return 'https://3bkarino-tech.vercel.app';
}

export function paymobConfig(){
  const integrationId=Number(process.env.PAYMOB_INTEGRATION_ID||0);
  const mode=clean(process.env.PAYMOB_MODE||'test',20).toLowerCase();
  return {
    base:BASE,
    secret:clean(process.env.PAYMOB_SECRET_KEY,500),
    publicKey:clean(process.env.PAYMOB_PUBLIC_KEY,500),
    hmac:clean(process.env.PAYMOB_HMAC,500),
    integrationId,
    mode,
    configured:Boolean(process.env.PAYMOB_SECRET_KEY&&process.env.PAYMOB_PUBLIC_KEY&&integrationId&&process.env.PAYMOB_HMAC)
  };
}

export async function createBookIntention(req,order,info){
  const cfg=paymobConfig();
  if(!cfg.configured)throw new Error('PAYMOB_NOT_CONFIGURED');
  const amountCents=Math.round(Number(info.price)*100);
  if(!Number.isInteger(amountCents)||amountCents<=0)throw new Error('INVALID_AMOUNT');
  const origin=requestOrigin(req);
  const n=splitName(order.name);
  const payload={
    amount:amountCents,
    currency:'EGP',
    payment_methods:[cfg.integrationId],
    items:[{name:'AI Marketing Machine — '+order.product,amount:amountCents,description:info.label,quantity:1}],
    billing_data:{
      apartment:'NA',floor:'NA',street:'NA',building:'NA',shipping_method:'NA',postal_code:'NA',
      first_name:n.firstName,last_name:n.lastName,email:order.email,phone_number:normalizePhone(order.phone),
      city:order.city||'Giza',state:order.governorate||'Giza',country:'EGY'
    },
    customer:{first_name:n.firstName,last_name:n.lastName,email:order.email},
    extras:{book_order_id:order.id,product:order.product},
    special_reference:order.id,
    expiration:3600,
    notification_url:origin+'/api/paymob/webhook',
    redirection_url:origin+'/book/payment-result'
  };
  const response=await fetch(BASE+'/v1/intention/',{
    method:'POST',
    headers:{Authorization:'Token '+cfg.secret,'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const raw=await response.text();
  let data={};try{data=JSON.parse(raw)}catch{}
  if(!response.ok||!data.client_secret){
    console.error('PAYMOB_INTENTION_FAILED',response.status,raw.slice(0,500));
    throw new Error('PAYMOB_INTENTION_FAILED');
  }
  return {
    intentionId:data.id||'',
    paymobOrderId:data.intention_order_id||'',
    clientSecret:data.client_secret,
    checkoutUrl:BASE+'/unifiedcheckout/?publicKey='+encodeURIComponent(cfg.publicKey)+'&clientSecret='+encodeURIComponent(data.client_secret)
  };
}

export function verifyTransactionHmac(obj,receivedHmac){
  const cfg=paymobConfig();
  if(!cfg.hmac||!obj)return false;
  const fields=[
    obj.amount_cents,obj.created_at,obj.currency,obj.error_occured,
    obj.has_parent_transaction,obj.id,obj.integration_id,obj.is_3d_secure,
    obj.is_auth,obj.is_capture,obj.is_refunded,obj.is_standalone_payment,
    obj.is_voided,obj.order?.id,obj.owner,obj.pending,
    obj.source_data?.pan,obj.source_data?.sub_type,obj.source_data?.type,obj.success
  ];
  const computed=createHmac('sha512',cfg.hmac).update(fields.map(String).join('')).digest('hex');
  const a=Buffer.from(computed,'utf8'),b=Buffer.from(String(receivedHmac||''),'utf8');
  return a.length===b.length&&timingSafeEqual(a,b);
}

export function extractMerchantOrderId(obj){
  return clean(
    obj?.order?.merchant_order_id||
    obj?.data?.payment_key_claims?.extra?.book_order_id||
    obj?.payment_key_claims?.extra?.book_order_id||
    '',120
  );
}
