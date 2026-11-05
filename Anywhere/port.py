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
  const originalBody=ctx.phase==='response'?new Uint8Array(ctx.body || 0):ctx.body;
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
(root/'scripts/core.js').write_text(text)
for n in ['request','response','key','ump']:
 s=(src/(n+'.js')).read_text();p=s.index('(()=>{');s=s[p+6:].strip();assert s.endswith('})();');s=s[:-5]
 s=s.replace('$request','request').replace('$response','response').replace('$argument','argument').replace('$persistentStore.read','readStore').replace('$persistentStore.write','writeStore').replace('$done','finish').replace('console.log','log')
 s=s.replace('new TextEncoder','{encode:s=>Anywhere.codec.utf8.encode(s)}').replace('new TextDecoder("utf-8",{fatal:!0})','{decode:b=>decodeText(b)}').replace('Uint8Array.fromBase64','decodeBase64')
 s=re.sub(r'([A-Za-z_$][\w$]*)\.toBase64\(\)',r'Anywhere.codec.base64.encode(\1)',s)
 if n=='ump':
  a=s.index('async function ag(');b=s.index('!async function(){',a);s=s[:a]+'async function ag(g,I){return I?Anywhere.codec.gzip.decode(g):Anywhere.codec.gzip.encode(g)}'+s[b:]
  s=s.replace('!async function(){','return async function(){',1)
  failure='finish({status:200,headers:{"Content-Type":"text/plain"},body:new Uint8Array})'
  assert s.count(failure)==1
  s=s.replace(failure,'finish()')
 assert not re.search(r'\$(?:request|response|argument|persistentStore|done)|\b(?:TextEncoder|TextDecoder|CompressionStream|DecompressionStream)\b',s)
 phase='request' if n=='request' else 'response'
 pre=f'''/* Full protocol port of the Surge {n} engine. Upstream snapshot: {hashlib.sha256((src/(n+'.js')).read_bytes()).hexdigest()}.
 * Native lifecycle, storage, UTF-8/base64 and gzip are supplied by Anywhere.
 * Protocol code derived from gholts / Maasea; Shorts edits from Aioneas.
 */
{'async ' if n=='ump' else ''}function process(ctx) {{
  if(ctx.phase !== '{phase}' || /^https?:\/\/redirector[\w-]*\.googlevideo\.com(?:[/:]|$)/i.test(ctx.url || ''))return;
  const {{request,response,argument,readStore,writeStore,finish,log,boolean,decodeText,decodeBase64}}=ytContext(ctx,'{n}');
'''
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
