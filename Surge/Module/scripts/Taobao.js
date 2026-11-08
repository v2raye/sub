(function(){
"use strict";
/* 淘宝去广告; Surge audit 2026-11-07. Source fkingikelee/fkikelee @ d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0; RuCu6[https://github.com/RuCu6]. Original JS RuCu6/QuanX. See README-Adblock-Apps.md. */
const APP="Taobao";
const OPERATIONS=[{"line":35,"pattern":"^https:\\/\\/guide-acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.taobao\\.(cloudvideo\\.video\\.query|wireless\\.home\\.splash\\.awesome\\.get)","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/Taobao/Taobao_remove_ads.js"},{"line":37,"pattern":"^https:\\/\\/poplayer\\.template\\.alibaba\\.com\\/\\w+\\.json","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/Taobao/Taobao_remove_ads.js"}];
const UI_REQUESTS=[{"pattern":"^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.alimusic\\.common\\.mobileservice\\.startinit","flags":"i","image":false},{"pattern":"^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.trip\\.activity\\.querytmsresources","flags":"i","image":false},{"pattern":"^https:\\/\\/(?:gw|heic)\\.alicdn\\.com\\/imgextra\\/i\\d\\/\\d*\\/?[\\w!]+-\\d-(?:octopus|tps)-(?:1080|1125)-\\d{4}\\.(?:jpg|png)_(?:1\\d{3}|9\\d{2})x(?:\\d|1\\d{3}|9\\d{2})q[59]0","flags":"i","image":true},{"pattern":"^https:\\/\\/guide-acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.taobao\\.(volvo\\.secondfloor\\.getconfig|wireless\\.home\\.newface\\.awesome\\.get)","flags":"i","image":false}];
const JQ_CONFIG={};
// Preserve unsafe integer/scientific-integer literals without requiring BigInt support.
class RawInteger {
  constructor(raw) { Object.defineProperty(this, 'raw', {value: raw}); }
}
let unsafeIntegerSeen = false;
function parseJSON(text) {
  const tokens = [];
  const quoted = [];
  const re = /"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const raw = match[0];
    if (raw[0] === '"') { if (raw.includes('_') || /\\u/i.test(raw)) quoted.push(raw); continue; }
    const number = Number(raw);
    if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number))) tokens.push({start:match.index,end:re.lastIndex,raw});
  }
  if (!tokens.length) return JSON.parse(text);
  const strings = quoted.map(x => JSON.parse(x));
  let prefix = '__SG_RAW_INT_0_'; let serial = 0;
  while (strings.some(x => x.startsWith(prefix))) prefix = '__SG_RAW_INT_' + (++serial) + '_';
  const values = new Map(); const parts = []; let offset = 0;
  tokens.forEach((token, index) => { const key = prefix + index + '__'; values.set(key,token.raw); parts.push(text.slice(offset,token.start), JSON.stringify(key)); offset = token.end; });
  parts.push(text.slice(offset));
  const result = JSON.parse(parts.join(''), (_key,value) => typeof value === 'string' && values.has(value) ? new RawInteger(values.get(value)) : value);
  unsafeIntegerSeen = true;
  return result;
}
function stringifyJSON(value) {
  if (!unsafeIntegerSeen) return JSON.stringify(value);
  let serial = 0;
  while (true) {
    const prefix = '__SG_SERIAL_INT_' + serial++ + '_'; const records = []; let collision = false;
    const result = JSON.stringify(value, (key,item) => {
      if (key.startsWith(prefix)) collision = true;
      if (item instanceof RawInteger) { const token=prefix+records.length+'__'; records.push(item.raw); return token; }
      if (typeof item==='string' && item.startsWith(prefix)) collision=true;
      return item;
    });
    if (collision) continue;
    return typeof result==='string' ? result.replace(new RegExp('"'+prefix+'(\\d+)__"','g'), (raw,index) => records[Number(index)] ?? raw) : result;
  }
}
const CLEANUP_UI = typeof $argument === 'string' && /(?:^|[;,\s])cleanup_ui=(?:true|1)(?:$|[;,\s])/i.test($argument);
function keepKnown(items, predicate) {
  const kept=items.filter(predicate);
  return kept.length || !items.length ? kept : items;
}
function marketingKey(key) {
  return /splash|advert|(?:^|_)ad(?:_|$)|^ad[A-Z_]|lottery|coupon|marketing|promo|banner|welfare|discount|coins|vip|grabbing|qqmusic|starbucks/i.test(key);
}
function isExplicitAd(item) {
  return object(item) && (item.isAd===true || item.isAd===1 || item.ad===true || item.ad===1 || item.cardType==='ad' || item.type==='advertisement');
}
function upstream(url, obj) {
  const data=object(obj.data)?obj.data:null;
  if (/^https:\/\/guide-acs\.m\.taobao\.com\/gw\/mtop\.taobao\.cloudvideo\.video\.query/i.test(url)) {
    if (!data) return obj;
    if (typeof data.duration==='string') data.duration='0'; else if (typeof data.duration==='number') data.duration=0;
    if (Array.isArray(data.resources)) data.resources=[];
    if (Array.isArray(data.caches)) data.caches=[];
    if (typeof data.respTimeInMs==='string') data.respTimeInMs='3818332800000'; else if (typeof data.respTimeInMs==='number') data.respTimeInMs=3818332800000;
  } else if (/^https:\/\/guide-acs\.m\.taobao\.com\/gw\/mtop\.taobao\.wireless\.home\.splash\.awesome\.get/i.test(url)) {
    const sections=at(obj,'data.containers.splash_home_base.base.sections');
    if (!Array.isArray(sections)) return obj;
    for (const section of sections) {
      const items=at(section,['bizData','taobao-splash','data']);
      if (!Array.isArray(items)) continue;
      for (const item of items) if (object(item)) {
        for (const key of ['waitTime','times']) item[key]=typeof item[key]==='number'?0:'0';
        for (const key of ['hotStart','haveVoice','hideTBLogo','enable4G','coldStart']) item[key]=typeof item[key]==='boolean'?false:typeof item[key]==='number'?0:'false';
        for (const key of ['startTime','gmtStartMs']) item[key]=typeof item[key]==='number'?3818332800000:'3818332800000';
        for (const key of ['endTime','gmtEndMs']) item[key]=typeof item[key]==='number'?3818419199000:'3818419199000';
        item.gmtStart='2090-12-31 00:00:00'; item.gmtEnd='2090-12-31 23:59:59';
        if (typeof item.imgUrl==='string') item.imgUrl='';
        if (typeof item.videoUrl==='string') item.videoUrl='';
      }
    }
  } else if (/^https:\/\/poplayer\.template\.alibaba\.com\/\w+\.json/i.test(url)) {
    if (Array.isArray(at(obj,'res.images'))) obj.res.images=[];
    if (Array.isArray(at(obj,'res.videos'))) obj.res.videos=[];
    if (Array.isArray(at(obj,'mainRes.images'))) obj.mainRes.images=[];
    if (typeof obj.enable==='boolean') obj.enable=false;
  }
  return obj;
}
// Bounded format compatibility, independent of Buffer/atob/TextDecoder globals.
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64JsonDecode(raw) {
  let text = raw.replace(/\s+/g, '');
  if (!text || !/^[A-Za-z0-9+/_-]*={0,2}$/.test(text) || text.length % 4 === 1) throw new Error('Not base64');
  const unpadded = text.replace(/=+$/, '');
  if (text.includes('=') && text.length % 4 !== 0) throw new Error('Bad padding');
  text = unpadded.replace(/-/g,'+').replace(/_/g,'/');
  let buffer = 0, bits = 0; const bytes=new Uint8Array(Math.floor(text.length*3/4)); let byteLength=0;
  for (const char of text) {
    buffer = (buffer << 6) | BASE64_ALPHABET.indexOf(char); bits += 6;
    if (bits >= 8) { bits -= 8; bytes[byteLength++]=(buffer >>> bits) & 255; }
  }
  if (bits && (buffer & ((1 << bits) - 1))) throw new Error('Noncanonical trailing bits');
  let decoded='';
  for(let i=0;i<byteLength;) { let end=Math.min(i+8192,byteLength); while(end<byteLength && (bytes[end]&192)===128)end--; if(end===i)throw new Error('Bad UTF8'); let part=''; for(let j=i;j<end;j++)part+='%'+bytes[j].toString(16).padStart(2,'0'); decoded+=decodeURIComponent(part); i=end; }
  return parseJSON(decoded);
}
function base64JsonEncode(json, format) {
  const bytes = unescape(encodeURIComponent(json));
  let output = '';
  for (let i=0; i<bytes.length; i+=3) {
    const a=bytes.charCodeAt(i), hasB=i+1<bytes.length, hasC=i+2<bytes.length;
    const b=hasB?bytes.charCodeAt(i+1):0, c=hasC?bytes.charCodeAt(i+2):0;
    output += BASE64_ALPHABET[a>>>2] + BASE64_ALPHABET[((a&3)<<4)|(b>>>4)] + (hasB?BASE64_ALPHABET[((b&15)<<2)|(c>>>6)]:'=') + (hasC?BASE64_ALPHABET[c&63]:'=');
  }
  if (format.urlSafe) output=output.replace(/\+/g,'-').replace(/\//g,'_');
  if (!format.padded) output=output.replace(/=+$/,'');
  return format.quoted ? stringifyJSON(output) : output;
}
function decodeCompatibleBody(raw) {
  const text=raw.trim();
  let value;
  try {
    value=parseJSON(text);
    if (typeof value !== 'string') return {value,kind:'json'};
  } catch (_) {}
  const callback=/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(([\s\S]*)\)\s*;?$/.exec(text);
  if (callback) return {value:parseJSON(callback[2]),kind:'jsonp',callback:callback[1],semicolon:text.endsWith(';')};
  const quoted=typeof value==='string', encoded=quoted?value:text;
  return {value:base64JsonDecode(encoded),kind:'base64',quoted,urlSafe:/[-_]/.test(encoded),padded:/=\s*$/.test(encoded)};
}
function encodeCompatibleBody(json, format) {
  if (format.kind==='base64') return base64JsonEncode(json,format);
  if (format.kind==='jsonp') return format.callback+'('+json+')'+(format.semicolon?';':'');
  return json;
}
// Pure JSON transforms. No network, storage, notification, cookie, or account APIs.
function object(v) { return v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof RawInteger); }
function at(root, path) {
  let value = root;
  for (const key of Array.isArray(path) ? path : path.replace(/^\$\./, '').split('.')) {
    if (!object(value) && !Array.isArray(value)) return undefined;
    value = value[key];
  }
  return value;
}
function drop(root, path) {
  const keys = Array.isArray(path) ? path : path.replace(/^\$\./, '').split('.');
  const parent = at(root, keys.slice(0, -1));
  if (object(parent)) delete parent[keys[keys.length - 1]];
}
function set(root, path, value) {
  const keys = Array.isArray(path) ? path : path.split('.');
  const parent = at(root, keys.slice(0, -1));
  if (object(parent)) parent[keys[keys.length - 1]] = value;
}
function array(root, path, fn) {
  const value = at(root, path);
  if (Array.isArray(value)) set(root, path, fn(value));
}
function delKeys(root, keys) { if (object(root)) for (const k of keys) delete root[k]; }
function inner(root, name, fn) {
  const record = at(root, ['data', name]);
  if (!object(record) || typeof record.value !== 'string') return;
  let value;
  try { value = parseJSON(record.value); } catch (_) { return; }
  if (!object(value)) return;
  const before = stringifyJSON(value);
  fn(value);
  if (stringifyJSON(value) !== before) record.value = stringifyJSON(value);
}
function nestedObject(parent, key) {
  if (parent[key] === undefined || parent[key] === null) parent[key] = {};
  return object(parent[key]) ? parent[key] : null;
}
function transform(url, root) {
  for (const op of OPERATIONS) {
    if (!(new RegExp(op.pattern, op.flags)).test(url)) continue;
    if (op.action === 'delete') for (const path of Array.isArray(op.data) ? op.data : [op.data]) {
      if (!CLEANUP_UI && !/(?:^|\.)(?:ad[A-Z]\w*|EndNaviC3AdCard|splash\w*|SplashScreenControl|\w*[Bb]anner|\w*_popup|operation_activity|marketing_resource_config|hotsaleConfig|coupon_risk_asac|commonCouponSceneLog|sug_coupon_opt)$/.test(path)) continue;
      drop(root,path);
    }
    else if (op.action === 'replace') op.paths.forEach((path,i) => { if (at(root,path) !== undefined) set(root,path,op.values[i]); });
    else if (op.action === 'jq_file') {
      if (op.data.endsWith('/updatable.jq')) amapUpdatable(root);
      else if (op.data.endsWith('/search_poi_detail.jq')) amapPoi(root);
      else throw new Error('Unconverted jq_file');
    } else if (op.action === 'jq') {
      if (APP === 'Amap') amapJq(root,op.data);
      else if (APP === 'Xianyu') xianyuJq(root,op.data);
      else throw new Error('Unexpected JQ app');
    } else if (op.action === 'upstream_js') root = upstream(url,root);
    else throw new Error('Unconverted response operation');
  }
  return root;
}
try {
  if (typeof $response === 'undefined') {
    const match=UI_REQUESTS.find(x=>new RegExp(x.pattern,x.flags).test($request.url));
    $done(CLEANUP_UI && match ? {response:{status:200,headers:{'Content-Type':match.image?'image/gif':'application/json; charset=utf-8'},body:match.image?new Uint8Array([71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,255,255,255,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59]):'{}'}} : {});
  } else if ((Number($response.status || $response.statusCode || 200)<200 || Number($response.status || $response.statusCode || 200)>=300) || typeof $response.body !== 'string' || !$response.body.trim()) $done({});
  else {
    const format=decodeCompatibleBody($response.body); const original=format.value;
    if (!object(original) || (Array.isArray(original.ret) && original.ret.some(x=>typeof x==='string' && /^FAIL/i.test(x)))) $done({});
    else {
      const before = stringifyJSON(original);
      const result = transform($request.url,original);
      const body = stringifyJSON(result);
      $done(body === before ? {} : {body:encodeCompatibleBody(body,format)});
    }
  }
} catch (_) {
  // Fail open on new schemas or non-JSON responses, without logging user response content.
  $done({});
}

})();
