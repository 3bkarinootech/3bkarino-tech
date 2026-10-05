import { generateText, Output } from 'ai';
import { requestSchema,responseSchema,summaryText,acceptsOrigin,takeRateLimit,systemPrompt } from '../lib/chat-core.js';
const buckets=new Map();
export const config={maxDuration:60};
export function createHandler(generate=generateText,env=process.env){return async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const enabled=Boolean(env.AI_GATEWAY_API_KEY||env.VERCEL_OIDC_TOKEN);
 if(req.method==='GET')return res.status(200).json({enabled,handoffAfterTurns:6,handoffAfterSeconds:300});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'METHOD_NOT_ALLOWED'})}
 if(!acceptsOrigin(req))return res.status(403).json({error:'FORBIDDEN'});
 if(!enabled)return res.status(503).json({error:'AI_NOT_CONFIGURED',message:'المستشار الذكي لسه غير مفعّل. تقدر تتواصل مع الفريق على واتساب.'});
 const key=req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown';
 if(!takeRateLimit(buckets,key)){res.setHeader('Retry-After','60');return res.status(429).json({error:'RATE_LIMIT',message:'استنى دقيقة وجرب تاني.'})}
 let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body)||'')>28000)return res.status(413).json({error:'TOO_LARGE'});body=requestSchema.parse(body);if(body.messages.at(-1).role!=='user')throw new Er���q�^