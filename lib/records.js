import { put, get, list } from '@vercel/blob';

const ACCESS='private';
const PREFIX='records/';

function cleanId(v){
  return String(v||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,100);
}

export async function saveRecord(record){
  const id=cleanId(record.id);
  if(!id) throw new Error('RECORD_ID_REQUIRED');
  const now=Date.now();
  const data={...record,id,updatedAt:now};
  if(!data.createdAt)data.createdAt=now;
  await put(PREFIX+id+'.json',JSON.stringify(data),{
    access:ACCESS,
    contentType:'application/json; charset=utf-8',
    allowOverwrite:true
  });
  return data;
}

export async function readRecord(id){
  const safe=cleanId(id);
  if(!safe)return null;
  const result=await get(PREFIX+safe+'.json',{access:ACCESS,useCache:false});
  if(!result)return null;
  const text=await new Response(result.stream).text();
  return JSON.parse(text);
}

export async function listRecords(limit=100){
  const out=await list({prefix:PREFIX,limit:Math.max(1,Math.min(Number(limit)||100,200))});
  const items=await Promise.all((out.blobs||[]).map(async blob=>{
    try{
      const result=await get(blob.pathname,{access:ACCESS,useCache:false});
      if(!result)return null;
      const text=await new Response(result.stream).text();
      return JSON.parse(text);
    }catch{return null}
  }));
  return items.filter(Boolean).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
}
