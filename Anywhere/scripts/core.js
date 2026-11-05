/* Anywhere native execution helpers. No Surge runtime globals are used. */
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
