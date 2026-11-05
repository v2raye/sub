/* Anywhere-native key extraction for YouTube UMP: schema-free Protobuf. */
function process(ctx) {
  AP.trace('key '+AP.path(ctx)+' phase='+ctx.phase+' status='+ctx.status+' bytes='+(ctx.body?.length||0));
  if(ctx.phase!=='response'||ctx.status!==200||!ctx.body.length)return;
  try {
    const path=AP.path(ctx);
    if(!/^\/youtubei\/v1\/(config|log_event)$/.test(path)) return;
    let node=AP.decode(ctx.body);
    for(const n of [1,16,7,138536474,146311580]) {
      const candidates=AP.fields(node,n,2);
      if(candidates.length!==1){AP.trace('key schema miss at field '+n);return;}
      node=AP.decode(candidates[0].value);
    }
    const k=AP.raw(node,1), e=AP.raw(node,2);
    if(!k?.length||!e?.length||k.length>4096||e.length>4096){AP.trace('key missing or invalid key fields');return;}
    const current=AP.config(),name=AP.client(ctx);
    const next={clientKey:AP.b64.encode(k),encryptKey:AP.b64.encode(e)};
    if(current[name]?.clientKey===next.clientKey&&current[name]?.encryptKey===next.encryptKey)return;
    const old=current[name];
    if(old && typeof old.clientKey==='string' && typeof old.encryptKey==='string') {
      next.previous=[old,...(Array.isArray(old.previous)?old.previous:[])].slice(0,3).map(({clientKey,encryptKey})=>({clientKey,encryptKey}));
    }
    current[name]=next;AP.saveConfig(current);AP.trace('key stored for '+name);
  } catch(e){AP.log('key extraction passthrough: '+e);}
}
