/* Anywhere native execution helpers. No Surge runtime globals are used. */
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


/* Full protocol port of the Surge key engine. Upstream snapshot: ff9c8243205e549b9fbc767ae52c330a19db38d0e406ca79d0bfda001e423b7b.
 * Native lifecycle, storage, UTF-8/base64 and gzip are supplied by Anywhere.
 * Protocol code derived from gholts / Maasea; Shorts edits from Aioneas.
 */
function process(ctx) {
  if(ctx.phase !== 'response' || /^https?:\/\/redirector[\w-]*\.googlevideo\.com(?:[/:]|$)/i.test(ctx.url || ''))return;
  const memoryLimit=1048576;
  if((ctx.body?.length || 0)>memoryLimit){Anywhere.log.warning('[YouTube] memory guard: key body exceeds '+memoryLimit+' bytes; original retained');return;}
  let wireBudget=20000;
  const {request,response,argument,readStore,writeStore,finish,log,boolean,decodeText,decodeBase64}=ytContext(ctx,'key');
const e="YouTubeConfig";function t(e,t,r=!1){let n;for(const o of function(e){const t=[];let r=0;function n(){let t=0,n=1;for(let o=0;o<5;o++){if(r>=e.length)throw new Error("Truncated protobuf varint");const o=e[r++];if(t+=(127&o)*n,!(128&o)){if(t>4294967295)throw new Error("Protobuf length/tag overflow");return t}n*=128}throw new Error("Invalid protobuf varint")}for(;r<e.length;){if(--wireBudget<0)throw new Error("YouTube memory guard: protobuf field budget exceeded");const o=r,i=n(),l=Math.floor(i/8),s=i%8;if(!l)throw new Error("Invalid protobuf field");let c=r;if(2===s){const e=n();c=r,r+=e}else if(1===s)r+=8;else if(5===s)r+=4;else{if(0!==s)throw new Error("Unsupported protobuf wire type "+s);{let t,n=0;do{if(r>=e.length||10===n++)throw new Error("Invalid protobuf integer");if(t=e[r++],10===n&&t>1)throw new Error("Protobuf integer overflow")}while(128&t)}}if(r>e.length)throw new Error("Truncated protobuf field");t.push({no:l,wire:s,data:e.subarray(c,r),raw:e.subarray(o,r)})}return t}(e))if(o.no===t&&2===o.wire){if(!r)return o.data;if(n)return;n=o.data}return n}!function(){try{const o=request.url.split("?")[0].split("/youtubei/v1/")[1];if("config"!==o&&"log_event"!==o||!response.body?.length)return finish();let i=response.body;for(const e of[1,16,7,138536474,146311580])if(i=t(i,e,!0),!i)return finish();const l=t(i,1,!0),s=t(i,2,!0);if(l?.length&&s?.length&&l.length<=4096&&s.length<=4096){const t=(n=request,Object.entries(n.headers??{}).some(([e,t])=>"user-agent"===e.toLowerCase()&&/music/i.test(t))?"youtubeMusic":"youtube"),o=function(t=e,r=1/0){const n=readStore(t);if("string"==typeof n&&n.length>r)return{};try{const e=JSON.parse(n||"{}");return e&&"object"==typeof e&&!Array.isArray(e)?e:{}}catch{return{}}}(),i={clientKey:Anywhere.codec.base64.encode(l),encryptKey:Anywhere.codec.base64.encode(s)};if(o[t]?.clientKey!==i.clientKey||o[t]?.encryptKey!==i.encryptKey){const n=(r=o[t],r?[r,...Array.isArray(r.previous)?r.previous.slice(0,3):[]].filter(e=>e&&"string"==typeof e.clientKey&&"string"==typeof e.encryptKey&&e.clientKey.length>0&&e.clientKey.length<=5500&&e.encryptKey.length>0&&e.encryptKey.length<=5500):[]).filter(e=>e.clientKey!==i.clientKey||e.encryptKey!==i.encryptKey).slice(0,3).map(({clientKey:e,encryptKey:t})=>({clientKey:e,encryptKey:t}));n.length&&(i.previous=n),o[t]=i,function(t,r=e){return writeStore(JSON.stringify(t),r)}(o)||log("YouTube key write failed")}}finish()}catch(e){log("YouTube keys: "+e),finish()}var r,n}()
}
