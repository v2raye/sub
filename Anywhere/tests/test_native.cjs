const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const vm=require('vm'),zlib=require('zlib');
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
if(!Uint8Array.fromBase64)Uint8Array.fromBase64=s=>new Uint8Array(Buffer.from(s,'base64'));
if(!Uint8Array.prototype.toBase64)Uint8Array.prototype.toBase64=function(){return Buffer.from(this).toString('base64')};
const flags={blockUpload:true,blockShorts:true,blockGames:true,blockVerticalLive:false,jumpAhead:true,autoHd:true,blockStore:true,blockAi:true,onTheGo:true};
const enc={encode:s=>te.encode(s),decode:b=>td.decode(b)};
const gzip={encode:b=>new Uint8Array(zlib.gzipSync(b)),decode:b=>new Uint8Array(zlib.gunzipSync(b))};
function ctx(url,phase,body=[],headers=null){return{url,phase,body:new Uint8Array(body),method:'POST',status:phase==='response'?200:null,headers:headers||[['Content-Type','application/x-protobuf'],['User-Agent','youtube/1']]}}
async function native(name,c){
 const api={params:{get:k=>params.get(k)},codec:{utf8:enc,base64:{encode:b=>Buffer.from(b).toString('base64'),decode:s=>new Uint8Array(Buffer.from(s,'base64'))},gzip},store:{getString:k=>store.get(k),set:(k,v)=>store.set(k,td.decode(v))},log:{warning:s=>warnings.push(s)},respond:r=>{c.synthetic=r}};
 const code=fs.readFileSync(path.join(ROOT,'dist',`youtube-${name}.js`),'utf8');
 await new vm.Script(code+'\nprocess(ctx)').runInNewContext({Anywhere:api,ctx:c,Uint8Array,ArrayBuffer,DataView,console:{log:s=>warnings.push(s)}});return c;
}
async function original(name,c){
 let result,task;const response={body:c.body,status:c.status,headers:Object.fromEntries(c.headers)};
 let code=fs.readFileSync(path.join(ROOT,'upstream',name+'.js'),'utf8');
 // Capture the existing asynchronous UMP task for the reference test only.
 if(name==='ump')code=code.replace('!async function(){','globalThis.pending=async function(){');
 const box={Uint8Array,ArrayBuffer,DataView,TextEncoder,TextDecoder,CompressionStream:require('stream/web').CompressionStream,DecompressionStream:require('stream/web').DecompressionStream,console:{log:s=>warnings.push(s)},$request:{url:c.url,method:c.method,headers:Object.fromEntries(c.headers),body:c.body},$response:response,$argument:JSON.stringify(flags),$persistentStore:{read:k=>store.get(k)||null,write:(v,k)=>{store.set(k,v);return true}},$done:r=>{result=r}};
 new vm.Script(code).runInNewContext(box);if(box.pending)await box.pending;
 return {body:result?.body===undefined?c.body:result.body,synthetic:result?.response};
}
const checks=[];
async function parity(name,endpoint,body,headers=null){
 const url=endpoint.startsWith('http')?endpoint:'https://youtubei.googleapis.com/youtubei/v1/'+endpoint,phase=name==='request'?'request':'response';
 const old=await original(name,ctx(url,phase,body,headers));const current=await native(name,ctx(url,phase,body,headers));
 assert.deepStrictEqual(Buffer.from(current.body),Buffer.from(old.body),name+' '+endpoint+' body differs');
 assert.equal(current.synthetic?.status,old.synthetic?.status,name+' '+endpoint+' synthetic status differs');
 if(old.synthetic)assert.deepStrictEqual(Buffer.from(current.synthetic.body),Buffer.from(old.synthetic.body));
 checks.push(name+' '+endpoint+' parity');return current;
}
function contains(bytes,str){return Buffer.from(bytes).includes(Buffer.from(str))}
function uv(n){let l=n<128?1:n<16384?2:n<2097152?3:n<268435456?4:5;let out=Buffer.alloc(l);out[0]=l===1?n:l===5?240:(256-(256>>(l-1)))|(n&((1<<(8-l))-1));for(let i=1,bits=l===5?0:8-l;i<l;i++,bits+=8)out[i]=Math.floor(n/2**bits)&255;return out;}
function frame(t,d){return Buffer.concat([uv(t),uv(d.length),Buffer.from(d)])}
async function main(){
 params.set('diagnostics','true');params.set('enable_ump','true');
 await parity('request','player/ad_break',[]);
 const key=crypto.randomBytes(48),encryptKey=crypto.randomBytes(24);
 let keyFields=[f(1,2,key),f(2,2,encryptKey)];for(const n of [146311580,138536474,7,16,1])keyFields=[b(n,keyFields)];
 await native('key',ctx('https://youtubei.googleapis.com/youtubei/v1/config','response',P.encode(keyFields)));
 assert.equal(JSON.parse(store.get('YouTubeConfig')).youtube.clientKey,key.toString('base64'));checks.push('native key capture');
 const player=[f(7,2,te.encode('ad-marker')),f(68,2,te.encode('slot-marker')),f(123456,0,99),b(2,[]),b(15,[b(1,[f(2,0,200)])])];
 let out=await parity('response','player',P.encode(player));assert(!P.decode(out.body).some(e=>e.field===7));assert(P.decode(out.body).some(e=>e.field===123456));
 out=await parity('response','get_watch',P.encode([b(1,[b(2,player)])]));assert(!contains(out.body,'ad-marker'));
 out=await parity('response','navigation/resolve_url',P.encode([b(2,[b(48687757,[b(68146959,[b(68202535,[b(1,player)])])])])]));assert(!contains(out.body,'ad-marker'));
 const shortsCard=b(1,[b(153515154,[b(172660663,[b(2,[b(183314536,[f(1,2,te.encode('shorts_shelf.eml'))])])])])]);
 out=await parity('response','browse',P.encode([b(9,[b(49399797,[b(1,[b(50195462,[shortsCard])])])])]));assert(!contains(out.body,'shorts_shelf.eml'));
 const guide=P.encode([b(4,[b(117866661,[b(1,[b(318370163,[f(1,2,te.encode('FEshorts'))])]),b(1,[b(318370163,[f(1,2,te.encode('FEhome'))])])])])]);
 out=await parity('response','guide',guide);assert(!contains(out.body,'FEshorts'));assert(contains(out.body,'FEhome'));
 params.set('block_shorts','false');flags.blockShorts=false;out=await parity('response','guide',guide);assert(contains(out.body,'FEshorts'));params.set('block_shorts','true');flags.blockShorts=true;
 const initBody=P.encode([b(2,[]),b(3,[f(5,2,encryptKey)])]);await parity('request','https://r1.googlevideo.com/initplayback',initBody);
 await parity('request','https://r1.googlevideo.com/videoplayback?id=abc',P.encode([b(1,[])]));
 const ad=b(2,[b(1,[b(139608561,[b(8,[]),b(16,[f(1,0,1)])])])]),normal=b(2,[b(1,[b(139608561,[b(8,[]),b(16,[f(1,0,0)])])])]);
 out=await parity('response','reel/reel_watch_sequence',P.encode([ad,normal]));assert.equal(P.decode(out.body).length,1);
 await parity('response','account/get_setting',P.encode([]));
 for(const compressed of [false,true]){
  const next=[b(8,[b(49399797,[b(1,[b(50195462,[shortsCard])])])])];
  const plain=P.encode([b(4,[b(2,player),b(3,next)])]),iv=crypto.randomBytes(16),payload=compressed?zlib.gzipSync(plain):plain;
  const cipher=crypto.createCipheriv('aes-128-ctr',key.subarray(0,16),iv).update(payload),mac=crypto.createHmac('sha256',key.subarray(16)).update(cipher).update(iv).digest();
  const env=P.encode([f(1,2,cipher),f(2,2,mac),f(3,2,iv),f(4,0,compressed?1:0)]),blob=Buffer.concat([frame(10,P.encode([f(1,0,25)])),frame(11,env)]);
  const headers=[['Content-Type','application/vnd.yt-ump'],['User-Agent','youtube/1']];
  const c=ctx('https://r1.googlevideo.com/initplayback','response',blob,headers);const current=await native('ump',c);assert(!Buffer.from(current.body).equals(blob),'UMP must change');
  // Uncompressed authenticated output must match byte-for-byte. Gzip implementations can emit different headers.
  if(!compressed){const old=await original('ump',ctx(c.url,'response',blob,headers));assert.deepStrictEqual(Buffer.from(current.body),Buffer.from(old.body));}
  function readuv(buf,at){const first=buf[at++];let length=5;for(let i=1;i<5;i++)if(!(first&(128>>(i-1)))){length=i;break;}let bits=length===5?0:8-length,value=length===5?0:first&((1<<bits)-1);for(let i=1;i<length;i++,bits+=8)value+=buf[at++]*2**bits;return{value,at};}
  const output=Buffer.from(current.body);let offset=0,editedEnvelope;
  while(offset<output.length){let t=readuv(output,offset),size=readuv(output,t.at);if(t.value===11)editedEnvelope=P.decode(output.subarray(size.at,size.at+size.value));offset=size.at+size.value;}
  assert(editedEnvelope);const editedCipher=Buffer.from(find(editedEnvelope,1).value),editedMac=Buffer.from(find(editedEnvelope,2).value);
  assert.deepStrictEqual(editedMac,crypto.createHmac('sha256',key.subarray(16)).update(editedCipher).update(iv).digest());
  let decoded=crypto.createDecipheriv('aes-128-ctr',key.subarray(0,16),iv).update(editedCipher);if(compressed)decoded=zlib.gunzipSync(decoded);
  assert(!contains(decoded,'ad-marker'));assert(!contains(decoded,'slot-marker'));assert(!contains(decoded,'shorts_shelf.eml'));
  const decodedPlayer=P.decode(find(P.decode(find(P.decode(decoded),4).value),2).value);assert(find(decodedPlayer,123456));
  if(compressed){
    const saved=store.get('YouTubeConfig'),badMac=Buffer.from(mac);badMac[0]^=1;
    const badEnvelope=P.encode([f(1,2,cipher),f(2,2,badMac),f(3,2,iv),f(4,0,1)]);
    const badBlob=Buffer.concat([frame(10,P.encode([f(1,0,25)])),frame(11,badEnvelope)]);
    const broken=await native('ump',ctx(c.url,'response',badBlob,headers));
    assert.deepStrictEqual(Buffer.from(broken.body),badBlob,'HMAC failure must preserve original response');
    assert(!store.get('YouTubeConfig')||!JSON.parse(store.get('YouTubeConfig')).youtube,'mismatched key should still be cleared');
    store.set('YouTubeConfig',saved);checks.push('HMAC failure preserves original response and retains key recovery');
  }
  checks.push('UMP Player + Next modification '+(compressed?'gzip':'uncompressed reference parity'));
 }
 await native('request',ctx('https://www.youtube.com/pagead/adview','request',[]));checks.push('native ad endpoints execute');
 assert(!fs.readFileSync(path.join(ROOT,'dist/youtube-response.js'),'utf8').includes('[YouTube/diag'));checks.push('diagnostic output removed; native execution needs no browser globals');

 const fixture=P.encode([f(999,2,te.encode('unchanged payload'))]);
 const noKeys=store.get('YouTubeConfig');store.clear();
 const missing=await native('ump',ctx('https://r1.googlevideo.com/initplayback','response',fixture,[['Content-Type','application/vnd.yt-ump']]));
 assert.deepStrictEqual(Buffer.from(missing.body),Buffer.from(fixture));store.set('YouTubeConfig',noKeys);
 checks.push('missing key preserves fixture nonempty response');
 const invalid=new Uint8Array([0xff,0xff]);const failed=await native('response',ctx('https://youtubei.googleapis.com/youtubei/v1/player','response',invalid));assert.deepStrictEqual([...failed.body],[...invalid]);checks.push('malformed protobuf preserves fixture bytes');
 const core=fs.readFileSync(path.join(ROOT,'scripts/core.js'),'utf8');
 const helperCtx=ctx('https://youtubei.googleapis.com/youtubei/v1/player','response',fixture);
 const helper=new vm.Script(core+'\nytContext(ctx,"response")').runInNewContext({ctx:helperCtx,Uint8Array,ArrayBuffer,Anywhere:{params:{get:()=>null},codec:{utf8:enc,base64:{decode:s=>new Uint8Array(Buffer.from(s,'base64'))}},log:{warning:()=>{}}}});
 for(const text of ['ASCII','你好','é','😀','\u0000'])assert.equal(helper.decodeText(te.encode(text)),text);
 for(const bytes of [[0x80],[0xc0,0xaf],[0xc2],[0xe0,0x80,0x80],[0xed,0xa0,0x80],[0xf0,0x80,0x80,0x80],[0xf4,0x90,0x80,0x80],[0xf5,0x80,0x80,0x80],[0xe2,0x82]])assert.throws(()=>helper.decodeText(new Uint8Array(bytes)),/Invalid UTF-8/);
 checks.push('strict UTF-8 valid and malformed boundary cases');
 for(const text of ['', 'AQID','AA','AAA','AA==','AAA=','_-4',' AQID\n'])assert.deepStrictEqual(Buffer.from(helper.decodeBase64(text)),Buffer.from(text.replace(/-/g,'+').replace(/_/g,'/'),'base64'));
 for(const text of ['A','A===','AA=','AA===','AA?A','AA==AA','===='])assert.throws(()=>helper.decodeBase64(text),/Invalid base64/);
 checks.push('base64url/unpadded inputs supported; invalid alphabet/length/padding rejected');
 helper.finish({body:new Uint8Array(4*1024*1024+1)});assert.deepStrictEqual([...helperCtx.body],[...fixture]);checks.push('oversized transformed output retains fixture');
 for(const name of ['request','response','key','ump']){
  const code=fs.readFileSync(path.join(ROOT,'dist',`youtube-${name}.js`),'utf8');
  for(const host of ['redirector.googlevideo.com','redirector-test.googlevideo.com']){
   const c=ctx('https://'+host+'/initplayback',name==='request'?'request':'response',invalid);
   new vm.Script(code+'\nprocess(ctx)').runInNewContext({ctx:c,Anywhere:new Proxy({},{get(){throw Error('redirector touched runtime API')}})});
   assert.deepStrictEqual([...c.body],[...invalid]);
  }
 }
 checks.push('all native entrypoints skip redirector before API access');
 console.log('PASS',checks.length,'full-port checks');console.log(checks.join('\n'));return checks;
}
module.exports=main;
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
