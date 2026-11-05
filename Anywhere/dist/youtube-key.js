/*
 * Anywhere-native YouTube protobuf utilities.
 * Build-time included in each standalone process(ctx) script.
 * API: Anywhere.codec.protobuf / Anywhere.codec.utf8 / Anywhere.store.
 * No Surge globals, compatibility shims, dynamic code loading or network requests.
 */
const AP = (() => {
  const pb = Anywhere.codec.protobuf;
  const utf8 = Anywhere.codec.utf8;
  const b64 = Anywhere.codec.base64;
  const LIMIT_DEPTH = 16;
  const bytes = x => x instanceof Uint8Array ? x : new Uint8Array(x || 0);
  const decode = x => pb.decode(bytes(x));
  const encode = fields => pb.encode(fields);
  const field = (f, n, w) => f.find(e => e.field === n && (w == null || e.wire === w));
  const fields = (f, n, w) => f.filter(e => e.field === n && (w == null || e.wire === w));
  const sub = (f, n) => { const e=field(f,n,2); return e ? decode(e.value) : null; };
  const val = (f,n) => {const e=field(f,n,0); return e ? Number(e.value) : null;};
  const raw = (f,n) => {const e=field(f,n,2);return e ? e.value : null;};
  const str = (f,n) => {const v=raw(f,n);return v ? utf8.decode(v) : null;};
  const bool = (name, d=true) => {
    const value=Anywhere.params.get(name);
    return value == null || value === '' ? d : /^(true|yes|on|1)$/i.test(value);
  };
  const log = msg => Anywhere.log.warning('[YouTube] '+msg);
  const set = (f,n,w,value) => {
    const entry=field(f,n,w);const v=w===0?BigInt(value):bytes(value);
    if(entry){ if(w===0 ? entry.value===v : eq(entry.value,v))return false; entry.value=v; }
    else f.push({field:n,wire:w,value:v});
    return true;
  };
  const drop = (f,n) => {let changed=false;for(let i=f.length-1;i>=0;i--)if(f[i].field===n){f.splice(i,1);changed=true;}return changed;};
  const eq=(a,b)=>a===b || !!a && !!b && a.length===b.length && a.every((v,i)=>v===b[i]);
  const mapNested=(f,n,modify)=>{
    let changed=false;
    for(const e of fields(f,n,2)){
      const inner=decode(e.value);if(modify(inner)){e.value=encode(inner);changed=true;}
    }return changed;
  };
  const view=(f,path)=>{let node=f;for(const p of path){node=sub(node,p);if(!node)return null;}return node;};
  const config=()=>{try{const s=Anywhere.store.getString('YouTubeConfig',true);const a=JSON.parse(s||'{}');return a&&typeof a==='object'&&!Array.isArray(a)?a:{};}catch{return {};}};
  const saveConfig=data=>{try{Anywhere.store.set('YouTubeConfig',JSON.stringify(data),true);}catch(e){log('persist config: '+e);}};
  const client=ctx=>ctx.headers.some(([name,value])=>name.toLowerCase()==='user-agent'&&/music/i.test(value))?'youtubeMusic':'youtube';
  const u8=str=>utf8.encode(str);
  const toText=buf=>utf8.decode(buf);
  const path=ctx=>{const m=/^https?:\/\/[^/?#]+([^?#]*)/.exec(ctx.url||'');return m?(m[1]||'/'):'';};
  const media=ctx=>ctx.headers.some(([name,value])=>name.toLowerCase()==='content-type'&&/application\/vnd\.yt-ump/i.test(value));
  const safe=(fn,msg)=>{try{return fn();}catch(e){log(msg+': '+e);return null;}};
  const trace = message => {
    try { if (bool('diagnostics', false)) Anywhere.log.warning('[YouTube/diag r2] '+message); }
    catch (_) { /* Diagnostics must never prevent passthrough. */ }
  };
  const kv=(f,n)=>[...fields(f,n,2)];
  return {pb,utf8,b64,decode,encode,field,fields,sub,val,raw,str,bool,log,set,drop,eq,mapNested,view,config,saveConfig,client,u8,toText,path,media,safe,bytes,kv,LIMIT_DEPTH,trace};
})();

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
