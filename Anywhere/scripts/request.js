/* Anywhere-native: request responses, telemetry ads and optional video hints. */
function process(ctx) {
  if (ctx.phase !== 'request') return;
  const url=ctx.url||'';
  const path=AP.path(ctx);
  const empty = type => {Anywhere.respond({status:200,headers:[['Content-Type',type]],body:new Uint8Array(0)});};
  try {
    if (path.endsWith('/player/ad_break')) {empty('application/x-protobuf'); return;}
    if (/^\/pcs\//.test(path)) {Anywhere.respond({status:204,body:new Uint8Array(0)});return;}
    if (/\/(?:api\/stats\/ads|pagead|ptracking)/.test(path) || (path==='/api/stats/qoe' && /[?&]adcontext(?:[=&]|$)/.test(url))) {
      empty('text/plain; charset=utf-8');return;
    }
    if (/\.googlevideo\.com\//.test(url) && /[?&]oad(?:[=&]|$)/.test(url)
      && !/^\/(?:videoplayback|initplayback|dclk_video_ads)$/.test(path)){
      empty('text/plain');return;
    }
    // Optional: request higher quality within existing formats, never fabricate Premium entitlement.
    if (!AP.bool('auto_hd',false) || ctx.method==='GET' || ctx.method==='HEAD' || !ctx.body.length) return;
    if (!/^\/(?:initplayback|videoplayback)$/.test(path)) return;
    const top=AP.decode(ctx.body);
    if (path==='/initplayback') {
      const target=AP.field(top,2,2); if (!target) return;
      const opt=AP.decode(target.value);
      let changed=false;
      changed=AP.set(opt,16,0,4320)||changed;
      changed=AP.set(opt,26,0,1)||changed;
      changed=AP.set(opt,30,0,0)||changed;
      if(changed){target.value=AP.encode(opt);ctx.body=AP.encode(top);}
    }
    // videoplayback format switching is intentionally not guessed without valid server format metadata.
  }catch(e){AP.log('request passthrough: '+e);}
}
