const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const te=new TextEncoder(),td=new TextDecoder();
const store=new Map();
const params=new Map();
const warnings=[];
const P={
  decode(bytes){
    const b=new Uint8Array(bytes),out=[];let i=0;
    const getVar=()=>{let n=0n,shift=0n;while(true){if(i>=b.length||shift>70n)throw Error('bad varint');let t=BigInt(b[i++]);n|=(t&127n)<<shift;if(!(t&128n))break;shift+=7n;}return n;};
    while(i<b.length){const key=Number(getVar()),field=key>>>3,wire=key&7;
      if(field===0)throw Error('field 0');
      let value;
      if(wire===0)value=getVar();
      else if(wire===2){const n=Number(getVar());if(n>b.length-i)throw Error('short');value=b.slice(i,i+n);i+=n;}
      else if(wire===1||wire===5){const n=wire===1?8:4;if(n>b.length-i)throw Error('short');value=b.slice(i,i+n);i+=n;}
      else throw Error('bad wire');
      out.push({field,wire,value});
    }return out;
  },
  encode(entries){
    const parts=[];for(const e of entries){parts.push(v(BigInt(e.field)*8n+BigInt(e.wire)));
      if(e.wire===0)parts.push(v(e.value));
      else if(e.wire===2){parts.push(v(e.value.length),Buffer.from(e.value));}
      else parts.push(Buffer.from(e.value));
    }return new Uint8Array(Buffer.concat(parts));
  }
};
function v(n){n=BigInt(n);const a=[];do{let x=Number(n&127n);n>>=7n;if(n)x|=128;a.push(x);}while(n);return Buffer.from(a);}
function f(n,wire,value){return {field:n,wire,value:wire===0?BigInt(value):new Uint8Array(value)};}
function b(n,value){return f(n,2,P.encode(value));}
function find(entries,n){return entries.find(e=>e.field===n);}
function run(script,ctx){
  const Anywhere={
    codec:{protobuf:P,utf8:{encode:s=>te.encode(s),decode:x=>td.decode(x)},base64:{encode:x=>Buffer.from(x).toString('base64'),decode:x=>new Uint8Array(Buffer.from(x,'base64'))},gzip:{decode:x=>new Uint8Array(require('zlib').gunzipSync(x)),encode:x=>new Uint8Array(require('zlib').gzipSync(x))}},
    store:{getString:(k)=>store.get(k),set:(k,v)=>{store.set(k,typeof v==='string'?v:td.decode(v));}},
    params:{get:k=>params.get(k)},
    log:{warning:s=>warnings.push(s)},
    crypto:{hmacSHA256:(key,x)=>new Uint8Array(crypto.createHmac('sha256',Buffer.from(key)).update(Buffer.from(x)).digest())},
    respond:r=>{ctx.response=r;}
  };
  const text=fs.readFileSync(path.join(ROOT,'dist',`youtube-${script}.js`),'utf8');
  const fn=new Function('Anywhere','ctx',text+'\nreturn process(ctx);');
  return fn(Anywhere,ctx);
}
function ctx(url,phase,body,status=200){return{phase,url,method:'POST',body:new Uint8Array(body||[]),status,headers:[['Content-Type','application/x-protobuf'],['User-Agent','youtube/1']]};}
// 1. request ad-break response
{const c=ctx('https://youtubei.googleapis.com/youtubei/v1/player/ad_break','request');run('request',c);assert.equal(c.response.status,200);assert.equal(c.response.body.length,0);}
// 2. request passes through normal media
{const c=ctx('https://r1---sn.googlevideo.com/videoplayback?foo=bar','request',[1,2,3]);run('request',c);assert.deepEqual([...c.body],[1,2,3]);}
// 3. key extraction persists in Anywhere.store
const full=crypto.randomBytes(48), iv=crypto.randomBytes(16);
{
 let node=[f(1,2,Buffer.from(full)),f(2,2,Buffer.from('encrypted-secret'))];
 for(const n of [146311580,138536474,7,16,1])node=[b(n,node)];
 const c=ctx('https://youtubei.googleapis.com/youtubei/v1/config','response',P.encode(node));run('key',c);
 assert.equal(JSON.parse(store.get('YouTubeConfig')).youtube.clientKey,full.toString('base64'));
}
// 4. player known ads removed, visual flags set, unknown field retained
{
 const player=[f(7,2,te.encode('advert')) ,f(68,2,te.encode('ads2')),f(123456,0,99)];
 const c=ctx('https://youtubei.googleapis.com/youtubei/v1/player','response',P.encode(player));run('response',c);
 const p=P.decode(c.body);assert(!find(p,7));assert(!find(p,68));assert(find(p,123456));assert(find(p,2));
}
// 5. Shorts ad entry stripped, normal entry retained
{
 const ad=b(2,[b(1,[b(139608561,[b(16,[f(1,0,1)])])])]);
 const normal=b(2,[b(1,[b(139608561,[b(16,[f(1,0,0)])])])]);
 const c=ctx('https://youtubei.googleapis.com/youtubei/v1/reel/reel_watch_sequence','response',P.encode([ad,normal]));run('response',c);
 assert.equal(P.decode(c.body).length,1);
}
// UMP frame varint format (not protobuf varint)
function uv(n){let l=n<128?1:n<16384?2:n<2097152?3:n<268435456?4:5;let b=Buffer.alloc(l);b[0]=l===1?n:l===5?240:(256-(256>>(l-1)))|(n&((1<<(8-l))-1));for(let i=1,bits=l===5?0:8-l;i<l;i++,bits+=8)b[i]=Math.floor(n/2**bits)&255;return b;}
function frame(t,d){return Buffer.concat([uv(t),uv(d.length),Buffer.from(d)]);}
function readuv(buf,at){let c=buf[at++],l=5;for(let i=1;i<5;i++)if(!(c&(128>>(i-1)))){l=i;break;}let bits=l===5?0:8-l,n=l===5?0:c&((1<<bits)-1);for(let i=1;i<l;i++,bits+=8)n+=buf[at++]*2**bits;return{n,at};}
// 6. Encrypted UMP: AES-CTR+HMAC roundtrip and ad removal
{
 params.set('enable_ump','true');
 const original=P.encode([b(4,[b(2,[f(7,2,te.encode('ad')),f(2,0,1)])])]);
 const encrypted=Buffer.concat([crypto.createCipheriv('aes-128-ctr',full.subarray(0,16),iv).update(original),crypto.createCipheriv('aes-128-ctr',full.subarray(0,16),iv).final()]);
 const mac=crypto.createHmac('sha256',full.subarray(16)).update(encrypted).update(iv).digest();
 const env=P.encode([f(1,2,encrypted),f(2,2,mac),f(3,2,iv),f(4,0,0)]);
 const blob=Buffer.concat([frame(10,P.encode([f(1,0,25)])),frame(11,env)]);
 const c=ctx('https://r1---sn.googlevideo.com/initplayback','response',blob);
 c.headers=[['Content-Type','application/vnd.yt-ump'],['User-Agent','youtube/1']];
 run('ump',c);
 const out=Buffer.from(c.body);assert(!out.equals(blob),'UMP response should change');
 let offset=0,z=readuv(out,offset),size=readuv(out,z.at);offset=size.at+size.n;
 z=readuv(out,offset);size=readuv(out,z.at);const newEnv=P.decode(out.subarray(size.at,size.at+size.n));
 const newCipher=Buffer.from(find(newEnv,1).value),newMac=Buffer.from(find(newEnv,2).value);
 assert.deepEqual(newMac,crypto.createHmac('sha256',full.subarray(16)).update(newCipher).update(iv).digest());
 const plain=Buffer.concat([crypto.createDecipheriv('aes-128-ctr',full.subarray(0,16),iv).update(newCipher),crypto.createDecipheriv('aes-128-ctr',full.subarray(0,16),iv).final()]);
 const player=P.decode(find(P.decode(find(P.decode(plain),4).value),2).value);assert(!find(player,7));assert(find(player,2));
}
console.log('PASS: request, key extraction, player, Shorts, encrypted UMP AES-CTR/HMAC test');
console.log('Warnings:',warnings);

// r2 diagnostics: a missing UMP key must be visible, without query values.
params.set('diagnostics','true');params.set('enable_ump','true');store.clear();warnings.length=0;
const diagnostic=ctx('https://r1---sn.googlevideo.com/initplayback?secret=HIDDEN','response',[1,2]);
diagnostic.headers=[['Content-Type','application/vnd.yt-ump']];run('ump',diagnostic);
assert(warnings.some(s=>s.includes('clientKey missing')));
const diagRequest=ctx('https://youtubei.googleapis.com/youtubei/v1/player/ad_break?secret=HIDDEN','request');run('request',diagRequest);
assert(warnings.some(s=>s.includes('request /youtubei/v1/player/ad_break')));
assert(warnings.every(s=>!s.includes('HIDDEN')));
console.log('PASS: r2 diagnostic entry and skip logs exclude query values');
