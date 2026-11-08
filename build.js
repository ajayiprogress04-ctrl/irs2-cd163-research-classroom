const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const zlib=require('node:zlib');
const chunks=fs.readdirSync('.').filter(n=>/^classroom-\d+\.b64$/.test(n)).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0]));
const bytes=Buffer.from(chunks.map(n=>fs.readFileSync(n,'utf8')).join(''),'base64');
if(crypto.createHash('sha256').update(bytes).digest('hex')!=='98fefdddf5d44a2b73b6ab7fb45aac4d6f486b1d52c0ff83e2efd183232506a6')throw Error('Classroom package hash mismatch');
fs.mkdirSync('public',{recursive:true});
let offset=0,count=0;
while(bytes.readUInt32LE(offset)===0x04034b50){
 const flags=bytes.readUInt16LE(offset+6),method=bytes.readUInt16LE(offset+8),size=bytes.readUInt32LE(offset+18),unpacked=bytes.readUInt32LE(offset+22),nl=bytes.readUInt16LE(offset+26),xl=bytes.readUInt16LE(offset+28);
 const name=bytes.toString('utf8',offset+30,offset+30+nl);
 if(flags&8||name.includes('..')||path.isAbsolute(name)||unpacked>5000000)throw Error('Unsupported archive entry');
 const start=offset+30+nl+xl;const raw=bytes.subarray(start,start+size);
 const data=method===0?raw:method===8?zlib.inflateRawSync(raw):null;
 if(!data||data.length!==unpacked)throw Error('Bad archive size');
 fs.mkdirSync(path.dirname(path.join('public',name)),{recursive:true});fs.writeFileSync(path.join('public',name),data);offset=start+size;count++;
}
if(count!==8)throw Error('Incomplete classroom package');
const domain=process.env.VERCEL_PROJECT_PRODUCTION_URL||'irs2-cd163-research-classroom.vercel.app';
const origin='https://'+domain.replace(/^https?:\/\//,'').replace(/\/$/,'');
let html=fs.readFileSync('public/index.html','utf8');
html=html.replace(/<meta property="og:image" content="[^"]*">/,'<meta property="og:image" content="'+origin+'/share.png">').replace(/<meta name="twitter:image" content="[^"]*">/,'<meta name="twitter:image" content="'+origin+'/share.png">');
html=html.replace('</head>','<link rel="canonical" href="'+origin+'/"><meta property="og:url" content="'+origin+'/"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="IRS2 and CD163 Research Classroom"></head>');
html=html.replace(/<link rel="icon"[^>]*>/,'<link rel="icon" href="/icon-192.png" type="image/png">');
html=html.replace("500;600;700&family=Manrope:wght@500;600;700;800&display=swap');",'');
html=html.replace(/<chatgpt-sidebar[\s\S]*?<\/chatgpt-sidebar>/g,'').replace(/<div id="codex-agent-overlay-root"[^>]*><\/div>/g,'');
fs.writeFileSync('public/index.html',html);
console.log('Prepared '+count+' approved classroom files with production metadata at '+origin);
