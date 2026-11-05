from pathlib import Path
import re,shutil,hashlib
root=Path(__file__).resolve().parent;src=root/'upstream';vendor=src
text=r'''/* Anywhere native execution helpers. No Surge runtime globals are used. */
function ytContext(ctx, kind) {
  const boolean = (name, fallback) => {
    const v = Anywhere.params.get(name);
    return v == null || v === '' ? fallback : /^(true|1|yes|on)$/i.test(String(v));
  };
  const debug = boolean('diagnostics', true);
  const path = String(ctx.url || '').split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  const trace = message => { if (debug) Anywhere.log.warning('[YouTube/diag r3] '+message); };
  const log = message => Anywhere.log.warning('[YouTube] '+String(message));
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
      trace(kind+' synthetic response '+path);return;
    }
    if(result && result.body !== undefined) {
      ctx.body=result.body;trace(kind+' body returned '+path+' bytes='+ctx.body.length);
    } else trace(kind+' unchanged '+path);
    if(kind === 'key') {
      try { const c=JSON.parse(readStore('YouTubeConfig') || '{}');trace('key cache available='+!!(c.youtube?.clientKey || c.youtubeMusic?.clientKey)); }
      catch(_) {trace('key cache unavailable');}
    }
  };
  trace(kind+' entered '+path+' phase='+ctx.phase+' status='+ctx.status+' bytes='+(ctx.body?.length || 0));
  return {request,response,argument:JSON.stringify(opts),readStore,writeStore,finish,log,boolean,trace};
}
'''
(root/'scripts/core.js').write_text(text)
for n in ['request','response','key','ump']:
 s=(src/(n+'.js')).read_text();p=s.index('(()=>{');s=s[p+6:].strip();assert s.endswith('})();');s=s[:-5]
 s=s.replace('$request','request').replace('$response','response').replace('$argument','argument').replace('$persistentStore.read','readStore').replace('$persistentStore.write','writeStore').replace('$done','finish').replace('console.log','log')
 s=s.replace('new TextEncoder','{encode:s=>Anywhere.codec.utf8.encode(s)}').replace('new TextDecoder("utf-8",{fatal:!0})','{decode:b=>Anywhere.codec.utf8.decode(b)}').replace('Uint8Array.fromBase64','Anywhere.codec.base64.decode')
 s=re.sub(r'([A-Za-z_$][\w$]*)\.toBase64\(\)',r'Anywhere.codec.base64.encode(\1)',s)
 if n=='ump':
  a=s.index('async function ag(');b=s.index('!async function(){',a);s=s[:a]+'async function ag(g,I){return I?Anywhere.codec.gzip.decode(g):Anywhere.codec.gzip.encode(g)}'+s[b:]
  s=s.replace('!async function(){','return async function(){',1)
 assert not re.search(r'\$(?:request|response|argument|persistentStore|done)|\b(?:TextEncoder|TextDecoder|CompressionStream|DecompressionStream)\b',s)
 phase='request' if n=='request' else 'response'
 pre=f'''/* Full protocol port of the Surge {n} engine. Upstream snapshot: {hashlib.sha256((src/(n+'.js')).read_bytes()).hexdigest()}.
 * Native lifecycle, storage, UTF-8/base64 and gzip are supplied by Anywhere.
 * Protocol code derived from gholts / Maasea; Shorts edits from Aioneas.
 */
{'async ' if n=='ump' else ''}function process(ctx) {{
  if(ctx.phase !== '{phase}')return;
  const {{request,response,argument,readStore,writeStore,finish,log,boolean,trace}}=ytContext(ctx,'{n}');
'''
 if n=='ump':pre+="  if(!boolean('enable_ump',true)){trace('UMP disabled');return;}\n"
 if n=='request':
  pre+=r'''
  // Map Local / URL reject equivalents run before the protocol request engine.
  const path=String(ctx.url||'').split('?')[0].replace(/^https?:\/\/[^/]+/,'');
  if (/^https?:\/\/(www|s)\.youtube\.com\//.test(ctx.url||'') &&
      (/^\/(?:pagead|ptracking)(?:\/|$)/.test(path) || /^\/api\/stats\/ads(?:\/|$)/.test(path) ||
       path==='/api/stats/qoe'&&/[?&]adcontext/.test(ctx.url))) {
    Anywhere.respond({status:200,body:' '});trace('advertising endpoint blocked');return;
  }
  if (/^https?:\/\/[\w-]+\.googlevideo\.com\//.test(ctx.url||'') &&
      /[?&]oad/.test(ctx.url||'') && !/^\/(?:initplayback|videoplayback)(?:$|\?)/.test(path) &&
      !/^\/dclk_video_ads/.test(path)) {
    Anywhere.respond({status:200,body:' '});trace('oad endpoint blocked');return;
  }
'''
 (root/'scripts'/f'{n}.js').write_text(pre+s+'\n}\n')
