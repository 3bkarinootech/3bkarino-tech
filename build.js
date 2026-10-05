import fs from 'node:fs';
import zlib from 'node:zlib';

fs.mkdirSync('public',{recursive:true});
const compressed=Buffer.from(fs.readFileSync('site.gz.b64','utf8').trim(),'base64');
fs.writeFileSync('public/index.html',zlib.gunzipSync(compressed));
