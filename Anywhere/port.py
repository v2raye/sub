from pathlib import Path
import re,shutil,hashlib
root=Path(__file__).resolve().parent;src=root/'upstream';vendor=src
text=r'''/* Anywhere native execution helpers. No Surge runtime globals are used. */
function ytContext(ctx, kind) {
  const boolean = (name, fallback) => {
    const v = Anywhere.params.get(name);
    return v == null || v === '' ? fallback : /^(true|1|yes|on)$/i.test(String(v));
  };
  const log = message => Anywhere.log.warning('[YouTube] '+String(message));
  const originalBody=ctx.body; // Engines treat input bytes as immutable; avoid a full extra copy.
  const byteView = value => {
    if(value instanceof Uint8Array)return value;
    if(value instanceof ArrayBuffer)return new Uint8Array(value);
    if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
    throw new TypeError('Expected bytes');
  };
  const decodeText = value => {
    const bytes=byteView(value);
    for(let i=0;i<bytes.length;){
      const lead=bytes[i++];if(lead<=0x7f)continue;
      let count,low=0x80,high=0xbf;
      if(lead>=0xc2&&lead<=0xdf)count=1;
      else if(lead>=0xe0&&lead<=0xef){count=2;if(lead===0xe0)low=0xa0;if(lead===0xed)high=0x9f;}
      else if(lead>=0xf0&&lead<=0xf4){count=3;if(lead===0xf0)low=0x90;if(lead===0xf4)high=0x8f;}
      else throw new TypeError('Invalid UTF-8');
      if(i+count>bytes.length||bytes[i]<low||bytes[i]>high)throw new TypeError('Invalid UTF-8');
      i++;
      for(let n=1;n<count;n++,i++)if(bytes[i]<0x80||bytes[i]>0xbf)throw new TypeError('Invalid UTF-8');
    }
    return Anywhere.codec.utf8.decode(bytes);
  };
  const decodeBase64 = value => {
    if(typeof value!=='string')throw new TypeError('Expected base64 string');
    let text=value.replace(/[\t\n\f\r ]/g,'').replace(/-/g,'+').replace(/_/g,'/');
    if(!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw new TypeError('Invalid base64 alphabet');
    const end=text.indexOf('='),length=end<0?text.length:end;
    if(length%4===1||end>=0&&(text.length%4!==0||text.length-length!==(4-length%4)%4))throw new TypeError('Invalid base64 length or padding');
    // Accept unpadded YouTube/base64url values; retain native loose pad-bit semantics.
    text=text.slice(0,length);text+='='.repeat((4-text.length%4)%4);
    const output=byteView(Anywhere.codec.base64.decode(text));
    if(output.length!==Math.floor(length*6/8))throw new TypeError('Invalid base64 output');
    return output;
  };
  const headers = {};
  for (const [name,value] of ctx.headers || []) headers[name] = value;
  // Response ctx.headers contains response headers, not the original request UA.
  // YouTube is the default; Music users must select the matching client mode.
  const flavor=Anywhere.params.get('client_flavor') === 'youtubeMusic' ? 'YouTubeMusic' : 'YouTube';
  const requestHeaders=ctx.phase === 'request' ? headers : {'User-Agent':flavor};
  const request = {url: ctx.url || '', method: ctx.method, headers:requestHeaders, body: ctx.phase === 'request' ? ctx.body : undefined};
  const response = {status:ctx.status,headers,body:ctx.phase === 'response' ? ctx.body : undefined};
  const opts = {
    blockUpload:boolean('block_upload',true),blockShorts:boolean('block_shorts',true),
    blockGames:boolean('block_games',true),blockVerticalLive:boolean('block_vertical_live',false),
    jumpAhead:boolean('jump_ahead',true),autoHd:boolean('auto_hd',true),
    blockStore:boolean('block_store',true),blockAi:boolean('block_ai',true),
    onTheGo:boolean('on_the_go',true)
  };
  const readStore = key => Anywhere.store.getString(key,true) || null;
  const writeStore = (value,key) => {
    try { Anywhere.store.set(key,Anywhere.codec.utf8.encode(value),true);return true; }
    catch(error) {log('store write failed: '+error);return false;}
  };
  const finish = result => {
    if(result && result.response && ctx.phase === 'request') {
      const r=result.response;
      Anywhere.respond({status:r.status || 200,headers:Array.isArray(r.headers)?r.headers:Object.entries(r.headers || {}),body:r.body || new Uint8Array(0)});
      return;
    }
    if(ctx.phase==='response') {
      if(result && result.body !== undefined) {
        const body=byteView(result.body);
        if(body.length>4*1024*1024){log('transformed response exceeds buffer limit; original retained');ctx.body=originalBody;}
        else ctx.body=body;
      } else ctx.body=originalBody;
    } else if(result && result.body !== undefined)ctx.body=result.body;
  };
  return {request,response,argument:JSON.stringify(opts),readStore,writeStore,finish,log,boolean,decodeText,decodeBase64};
}

'''
crypto=r'''/* Compact AES-CTR and native HMAC; no 65,536-entry JS lookup tables. */
function ytCrypto(){
    function multiply(a,b){let r=0;for(let i=0;i<8;i++){if(b&1)r^=a;a=(a<<1)^((a&128)?0x11b:0);b>>=1;}return r;}
    function makeAES(key){
      const sbox=Uint8Array.from([
        99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,
        202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,
        183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,
        4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,
        9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,
        83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,
        208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,
        81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,
        205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,
        96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,
        224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,
        231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,
        186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,
        112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,
        225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,
        140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22
      ]);
      const roundKeys=new Uint8Array(176);roundKeys.set(key.subarray(0,16));
      const rcon=[0,1,2,4,8,16,32,64,128,27,54];
      for(let i=16;i<176;i+=4){const tmp=Array.from(roundKeys.subarray(i-4,i));
        if(i%16===0){tmp.push(tmp.shift());for(let k=0;k<4;k++)tmp[k]=sbox[tmp[k]];tmp[0]^=rcon[i/16];}
        for(let k=0;k<4;k++)roundKeys[i+k]=roundKeys[i-16+k]^tmp[k];
      }
      function aesBlock(input){
        const state=Uint8Array.from(input);
        const add=(r)=>{for(let i=0;i<16;i++)state[i]^=roundKeys[r*16+i];};
        add(0);
        for(let r=1;r<=10;r++){
          for(let i=0;i<16;i++)state[i]=sbox[state[i]];
          for(let row=1;row<4;row++){
            const line=[state[row],state[row+4],state[row+8],state[row+12]];
            for(let col=0;col<4;col++)state[row+4*col]=line[(col+row)%4];
          }
          if(r<10)for(let c=0;c<4;c++){
            const k=4*c,a=state[k],b=state[k+1],d=state[k+2],e=state[k+3];
            state[k]=multiply(a,2)^multiply(b,3)^d^e;
            state[k+1]=a^multiply(b,2)^multiply(d,3)^e;
            state[k+2]=a^b^multiply(d,2)^multiply(e,3);
            state[k+3]=multiply(a,3)^b^d^multiply(e,2);
          }
          add(r);
        }
        return state;
      }
      return aesBlock;
    }
    function ctr(key,iv,input){
      const block=makeAES(key.subarray(0,16)),counter=Uint8Array.from(iv),out=new Uint8Array(input.length);
      for(let i=0;i<input.length;i+=16){
        const mask=block(counter);
        for(let j=0;j<16&&i+j<input.length;j++)out[i+j]=input[i+j]^mask[j];
        for(let j=15;j>=0;j--){counter[j]=(counter[j]+1)&255;if(counter[j]!==0)break;}
      }
      return out;
    }

  const same=(a,b)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;};
  return {CryptoContext:class{
    constructor(key){this.key=key;this.iv=null;}
    signature(cipher){const data=new Uint8Array(cipher.length+this.iv.length);data.set(cipher);data.set(this.iv,cipher.length);return Anywhere.crypto.hmacSHA256(this.key.subarray(16),data);}
    decrypt(envelope){this.iv=envelope.iv;if(!same(this.signature(envelope.encryptedContent),envelope.hmac))throw new Error('HMAC verification failed');return ctr(this.key.subarray(0,16),this.iv,envelope.encryptedContent);}
    encrypt(plain){const encryptedContent=ctr(this.key.subarray(0,16),this.iv,plain);return {encryptedContent,hmac:this.signature(encryptedContent)};}
  }};
}
'''
(root/'scripts/core.js').write_text(text)
for n in ['request','response','key','ump']:
 s=(src/(n+'.js')).read_text();p=s.index('(()=>{');s=s[p+6:].strip();assert s.endswith('})();');s=s[:-5]
 s=s.replace('$request','request').replace('$response','response').replace('$argument','argument').replace('$persistentStore.read','readStore').replace('$persistentStore.write','writeStore').replace('$done','finish').replace('console.log','log')
 s=s.replace('new TextEncoder','{encode:s=>Anywhere.codec.utf8.encode(s)}').replace('new TextDecoder("utf-8",{fatal:!0})','{decode:b=>decodeText(b)}').replace('Uint8Array.fromBase64','decodeBase64')
 s=re.sub(r'([A-Za-z_$][\w$]*)\.toBase64\(\)',r'Anywhere.codec.base64.encode(\1)',s)
 if n=='ump':
  a=s.index('async function ag(');b=s.index('!async function(){',a);s=s[:a]+'''async function ag(g,I){
 const limit=512*1024;
 if(g.length>limit)throw new Error("YouTube memory guard: gzip input too large");
 if(I&&g.length>=18&&g[0]===31&&g[1]===139){const n=g.length;const expected=(g[n-4]+g[n-3]*256+g[n-2]*65536+g[n-1]*16777216)>>>0;if(expected>limit)throw new Error("YouTube memory guard: gzip expansion too large");}
 const output=I?Anywhere.codec.gzip.decode(g):Anywhere.codec.gzip.encode(g);
 if(output.length>limit)throw new Error("YouTube memory guard: gzip output too large");return output;
}'''+s[b:]
  s=s.replace('!async function(){','return async function(){',1)
  ca=s.index('const{CryptoContext:g}=')+len('const{CryptoContext:g}=')
  cb=s.index(';C=I.map(I=>new g(I))',ca)
  s=s[:ca]+'ytCrypto()'+s[cb:]
  failure='finish({status:200,headers:{"Content-Type":"text/plain"},body:new Uint8Array})'
  assert s.count(failure)==1
  s=s.replace(failure,'finish()')
 if n in ['response','ump']:
  token='for(;A<g.length;){'
 else:
  token='for(;r<e.length;){'
 assert token in s
 s=s.replace(token,token+'if(--wireBudget<0)throw new Error("YouTube memory guard: protobuf field budget exceeded");',1)
 assert not re.search(r'\$(?:request|response|argument|persistentStore|done)|\b(?:TextEncoder|TextDecoder|CompressionStream|DecompressionStream)\b',s)
 phase='request' if n=='request' else 'response'
 pre=f'''/* Full protocol port of the Surge {n} engine. Upstream snapshot: {hashlib.sha256((src/(n+'.js')).read_bytes()).hexdigest()}.
 * Native lifecycle, storage, UTF-8/base64 and gzip are supplied by Anywhere.
 * Protocol code derived from gholts / Maasea; Shorts edits from Aioneas.
 */
{'async ' if n=='ump' else ''}function process(ctx) {{
  if(ctx.phase !== '{phase}' || /^https?:\/\/redirector[\w-]*\.googlevideo\.com(?:[/:]|$)/i.test(ctx.url || ''))return;
  const memoryLimit={512*1024 if n=='ump' else 1024*1024};
  if((ctx.body?.length || 0)>memoryLimit){{Anywhere.log.warning('[YouTube] memory guard: {n} body exceeds '+memoryLimit+' bytes; original retained');return;}}
  let wireBudget=20000;
  const {{request,response,argument,readStore,writeStore,finish,log,boolean,decodeText,decodeBase64}}=ytContext(ctx,'{n}');
'''
 if n=='ump':pre=crypto+pre
 if n=='ump':pre+="  if(!boolean('enable_ump',true)){return;}\n"
 if n=='request':
  pre+=r'''
  // Map Local / URL reject equivalents run before the protocol request engine.
  const path=String(ctx.url||'').split('?')[0].replace(/^https?:\/\/[^/]+/,'');
  if (/^https?:\/\/(www|s)\.youtube\.com\//.test(ctx.url||'') &&
      (/^\/(?:pagead|ptracking)(?:\/|$)/.test(path) || /^\/api\/stats\/ads(?:\/|$)/.test(path) ||
       path==='/api/stats/qoe'&&/[?&]adcontext/.test(ctx.url))) {
    Anywhere.respond({status:200,body:' '});return;
  }
  if (/^https?:\/\/[\w-]+\.googlevideo\.com\//.test(ctx.url||'') &&
      /[?&]oad/.test(ctx.url||'') && !/^\/(?:initplayback|videoplayback)(?:$|\?)/.test(path) &&
      !/^\/dclk_video_ads/.test(path)) {
    Anywhere.respond({status:200,body:' '});return;
  }
'''
 (root/'scripts'/f'{n}.js').write_text(pre+s+'\n}\n')
