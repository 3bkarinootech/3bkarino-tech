import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const auth=req.headers.authorization||'';
  const user=process.env.COMMAND_CENTER_USER||'';
  const pass=process.env.COMMAND_CENTER_PASSWORD||'';
  const expected='Basic '+Buffer.from(user+':'+pass).toString('base64');
  const a=Buffer.from(auth),b=Buffer.from(expected);
  const crypto=await import('node:crypto');
  if(!user||!pass||a.length!==b.length||!crypto.timingSafeEqual(a,b)){
    res.setHeader('WWW-Authenticate','Basic realm="3bkarino Private Admin"');
    return res.status(401).json({error:'Unauthorized'});
  }
  const propertyId=process.env.GA4_PROPERTY_ID;
  const serviceJson=process.env.GA4_SERVICE_ACCOUNT_JSON;
  if(!propertyId||!serviceJson)return res.status(200).json({connected:false,reason:'GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_JSON not configured'});
  try{
    const credentials=JSON.parse(serviceJson);
    const client=new BetaAnalyticsDataClient({credentials});
    const property='properties/'+String(propertyId).replace(/^properties\//,'');
    const [overview,topPages,sources]=await Promise.all([
      client.runReport({property,dateRanges:[{startDate:'7daysAgo',endDate:'today'}],metrics:[{name:'activeUsers'},{name:'sessions'},{name:'screenPageViews'},{name:'eventCount'}]}),
      client.runReport({property,dateRanges:[{startDate:'7daysAgo',endDate:'today'}],dimensions:[{name:'pagePath'}],metrics:[{name:'screenPageViews'}],limit:8,orderBys:[{metric:{metricName:'screenPageViews'},desc:true}]}),
      client.runReport({property,dateRanges:[{startDate:'7daysAgo',endDate:'today'}],dimensions:[{name:'sessionDefaultChannelGroup'}],metrics:[{name:'sessions'}],limit:8,orderBys:[{metric:{metricName:'sessions'},desc:true}]}),
    ]);
    const row=overview[0].rows?.[0]?.metricValues||[];
    const pages=(topPages[0].rows||[]).map(r=>({page:r.dimensionValues?.[0]?.value||'',views:Number(r.metricValues?.[0]?.value||0)}));
    const channels=(sources[0].rows||[]).map(r=>({channel:r.dimensionValues?.[0]?.value||'',sessions:Number(r.metricValues?.[0]?.value||0)}));
    return res.status(200).json({connected:true,period:'آخر 7 أيام',activeUsers:Number(row[0]?.value||0),sessions:Number(row[1]?.value||0),views:Number(row[2]?.value||0),events:Number(row[3]?.value||0),pages,channels});
  }catch(e){return res.status(502).json({connected:false,reason:'Unable to read GA4 data. Check service account access and property ID.'})}
}
