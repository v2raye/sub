(function(){
"use strict";
/* 闲鱼去广告; Surge audit 2026-11-07. Source fkingikelee/fkikelee @ d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0; 可莉🅥[https://github.com/luestr/ProxyResource/blob/main/README.md]. Original JS kelee resources. See README-Adblock-Apps.md. */
const APP="Xianyu";
const OPERATIONS=[{"line":16,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.home\\.nextfresh\\/","flags":"i","action":"jq","data":".data.homeTopList |= map(select(.sectionType == \"kingkongDo\")) | .data.sections |= map(select(.data.clickParam.args.cardType as $ct | $ct != \"homeMultiBanner\" and $ct != \"mamaAD\")) | .data.sections |= map(select((.template.name|type==\"string\")and(.template.name==\"idlefish_home_new_commodity_card\"or(.template.name|contains(\"fish_home_tags_item_card\")))))"},{"line":18,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.widget\\.refresh\\.get\\/","flags":"i","action":"jq","data":".data.homeTopList |= map(select(.sectionType == \"kingkongDo\"))"},{"line":20,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.home\\.whale\\.modulet\\/","flags":"i","action":"jq","data":".data.container.sections |= map(select(.template.name == \"fish_home_miniapp\"))"},{"line":24,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.fun\\.follow\\.feed\\.list\\/","flags":"i","action":"jq","data":".data.sections|=map(select(.cardType==2001))"},{"line":26,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.home\\.community\\/","flags":"i","action":"jq","data":".data.feedsList |= map(select(.template.name == \"idlefish_home_new_commodity_card\" or .template.name == \"idlefish_home_new_content_card\"))"},{"line":30,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.home\\.newitem\\.page\\/","flags":"i","action":"jq","data":".data.sections |= map(select(.data.clickParam.args.cardType as $ct | $ct != \"banner\" and $ct != \"mamaAD\"))"},{"line":34,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.local\\.flow\\.plat\\.section\\/","flags":"i","action":"jq","data":".data.data.components |= map(select(.data and (.data|type==\"object\") and .data.template and (.data.template|type==\"object\") and .data.template.name and (.data.template.name|type==\"string\") and (.data.template.name|contains(\"fish_city_kingkong\"))))"},{"line":36,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.local\\.home\\.top\\/","flags":"i","action":"jq","data":".data.data.components |= map(select(.key == \"fish_home_second_stage_top_cardV3\"))"},{"line":38,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.local\\.home\\/","flags":"i","action":"jq","data":".data.sections |= map(select((.template.cardEnum != \"ads\") and (.cardType == \"common\")))"},{"line":40,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.idle\\.user\\.page\\.my\\.adapter\\/","flags":"i","action":"jq","data":".data.container.sections |= map(select((.template.name? // \"\") | test(\"^my_fy[0-9]+_(header|user_info|trade|appraise|tools)$\"))) | .data.container.sections |= map(.item |= (if .level and .level.exContent and (.level.exContent | has(\"tips\")) then del(.level) else . end)) | .data.container.sections |= map(if .sectionBizCode==\"entry2025\" then .item.tool.exContent.tools |= [[.[][] | select(.exContent.id as $id | $id==5 or $id==39 or $id==6 or $id==30 or $id==29 or $id==2 or $id==32 or $id==3 or $id==1)] | sort_by(. as $item | ([5,39,6,30,29,2,32,3,1] | index($item.exContent.id))) | [range(0;length;5) as $i | .[$i:$i+5]]][] else . end) | del(.data.ability)"},{"line":46,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.home\\.circle\\.list\\/","flags":"i","action":"jq","data":".data.circleList[]?.showInfo |= del(.titleImage, .atmosphereImageUrl) | .data.next.headList |= map(select(.bizCode == \"main\" or .bizCode == \"market\" or .bizCode == \"IDLE_CIRCLE\")) | del(.data.next.headList[]?.showInfo.rightTagImage)"},{"line":48,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.magic\\.home\\.page\\.list\\/","flags":"i","action":"delete","data":"data.topList"},{"line":50,"pattern":"^https:\\/\\/g-acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlemtopsearch\\.search\\/","flags":"i","action":"jq","data":".data.resultList |= map(if .data.item.main.exContent.dislikeFeedback.clickParam.args.bizType == \"ad\" then empty else . end)"},{"line":52,"pattern":"^https:\\/\\/g-acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlemtopsearch\\.search\\/","flags":"i","action":"delete","data":"data.resultPrefixBar"},{"line":54,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlemtopsearch\\.search\\.discover\\/","flags":"i","action":"jq","data":".data.resultList |= map(select(.type != \"MarketHotSpot\"))"},{"line":56,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlemtopsearch\\.item\\.search\\.activate\\/","flags":"i","action":"jq","data":".data.cardList |= map(if has(\"cardData\") and (.cardData | has(\"hotwords\")) then .cardData |= del(.hotwords) else . end)"},{"line":60,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.trade\\.full\\.info\\/","flags":"i","action":"jq","data":".data.components |= map(select(.render | . == \"orderStatusVO\" or . == \"addressInfoVO\" or . == \"orderInfoVO\"))"}];
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
const CLEANUP_UI = false;
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
function xianyuSplash(url, root) {
  const splash=/^https:\/\/(?:g-)?acs\.m\.(?:goofish|taobao)\.com\/gw\/mtop\.taobao\.idlecommerce\.splash\.(?:async\.)?ads(?:\/|\?|$)/i;
  if(!splash.test(url))return root;
  for(const parent of [root,root.data,at(root,'data.data')])if(object(parent) && Object.prototype.hasOwnProperty.call(parent,'adMap')) {
    if(Array.isArray(parent.adMap))parent.adMap=[];
    else if(object(parent.adMap))parent.adMap={};
    else if(typeof parent.adMap==='string') {
      try {const parsed=parseJSON(parent.adMap);if(Array.isArray(parsed))parent.adMap='[]';else if(object(parsed))parent.adMap='{}';}catch(_){}
    }
  }
  return root;
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
function xianyuJq(root, jq) {
  if (!CLEANUP_UI) {
    if (jq.includes('dislikeFeedback')) array(root,'data.resultList',xs=>xs.filter(x=>at(x,'data.item.main.exContent.dislikeFeedback.clickParam.args.bizType')!=='ad'));
    if (jq.includes('mamaAD')) array(root,'data.sections',xs=>xs.filter(x=>!['homeMultiBanner','banner','mamaAD'].includes(at(x,'data.clickParam.args.cardType'))));
    if (jq.includes('cardEnum')) array(root,'data.sections',xs=>xs.filter(x=>at(x,'template.cardEnum')!=='ads'));
    return;
  }
  if (jq.includes('homeTopList')) {
    array(root,'data.homeTopList', xs => xs.filter(x => at(x,'sectionType') === 'kingkongDo'));
    if (jq.includes('homeMultiBanner')) {
      array(root,'data.sections', xs => xs.filter(x => !['homeMultiBanner','mamaAD'].includes(at(x,'data.clickParam.args.cardType'))));
      array(root,'data.sections', xs => xs.filter(x => typeof at(x,'template.name') === 'string' && (x.template.name === 'idlefish_home_new_commodity_card' || x.template.name.includes('fish_home_tags_item_card'))));
    }
  } else if (jq.includes('fish_home_miniapp')) {
    array(root,'data.container.sections', xs => xs.filter(x => at(x,'template.name') === 'fish_home_miniapp'));
  } else if (jq.includes('2001')) {
    array(root,'data.sections', xs => xs.filter(x => at(x,'cardType') === 2001));
  } else if (jq.includes('feedsList')) {
    array(root,'data.feedsList', xs => xs.filter(x => ['idlefish_home_new_commodity_card','idlefish_home_new_content_card'].includes(at(x,'template.name'))));
  } else if (jq.includes('"banner"') && jq.includes('mamaAD')) {
    array(root,'data.sections', xs => xs.filter(x => !['banner','mamaAD'].includes(at(x,'data.clickParam.args.cardType'))));
  } else if (jq.includes('fish_city_kingkong')) {
    array(root,'data.data.components', xs => xs.filter(x => object(at(x,'data')) && object(at(x,'data.template')) && typeof at(x,'data.template.name') === 'string' && x.data.template.name.includes('fish_city_kingkong')));
  } else if (jq.includes('fish_home_second_stage_top_cardV3')) {
    array(root,'data.data.components', xs => xs.filter(x => at(x,'key') === 'fish_home_second_stage_top_cardV3'));
  } else if (jq.includes('cardEnum')) {
    array(root,'data.sections', xs => xs.filter(x => at(x,'template.cardEnum') !== 'ads' && at(x,'cardType') === 'common'));
  } else if (jq.includes('my_fy')) {
    array(root,'data.container.sections', xs => xs.filter(x => /^my_fy[0-9]+_(header|user_info|trade|appraise|tools)$/.test(at(x,'template.name') || '')));
    const sections = at(root,'data.container.sections');
    if (Array.isArray(sections)) for (const section of sections) {
      if (object(section.item) && at(section.item,'level') && object(at(section.item,'level.exContent')) && Object.prototype.hasOwnProperty.call(section.item.level.exContent,'tips')) delete section.item.level;
      if (section?.sectionBizCode === 'entry2025') {
        array(section,'item.tool.exContent.tools', groups => {
          const order = [5,39,6,30,29,2,32,3,1];
          const flat = groups.flatMap(row => Array.isArray(row) ? row : []).filter(x => order.includes(at(x,'exContent.id'))).sort((a,b) => order.indexOf(a.exContent.id) - order.indexOf(b.exContent.id));
          const chunks = []; for (let i=0; i<flat.length; i+=5) chunks.push(flat.slice(i,i+5)); return chunks;
        });
      }
    }
    drop(root,'data.ability');
  } else if (jq.includes('circleList')) {
    const circles = at(root,'data.circleList');
    if (Array.isArray(circles)) for (const x of circles) delKeys(at(x,'showInfo'),['titleImage','atmosphereImageUrl']);
    array(root,'data.next.headList', xs => xs.filter(x => ['main','market','IDLE_CIRCLE'].includes(at(x,'bizCode'))));
    const heads = at(root,'data.next.headList');
    if (Array.isArray(heads)) for (const x of heads) drop(x,'showInfo.rightTagImage');
  } else if (jq.includes('dislikeFeedback')) {
    array(root,'data.resultList', xs => xs.filter(x => at(x,'data.item.main.exContent.dislikeFeedback.clickParam.args.bizType') !== 'ad'));
  } else if (jq.includes('MarketHotSpot')) {
    array(root,'data.resultList', xs => xs.filter(x => at(x,'type') !== 'MarketHotSpot'));
  } else if (jq.includes('hotwords')) {
    const cards = at(root,'data.cardList');
    if (Array.isArray(cards)) for (const x of cards) drop(x,'cardData.hotwords');
  } else if (jq.includes('orderStatusVO')) {
    array(root,'data.components', xs => xs.filter(x => ['orderStatusVO','addressInfoVO','orderInfoVO'].includes(at(x,'render'))));
  } else throw new Error('Unconverted Xianyu JQ');
}
function transform(url, root) {
  root=xianyuSplash(url,root);
  for (const op of OPERATIONS) {
    if (!(new RegExp(op.pattern, op.flags)).test(url)) continue;
    if (op.action === 'delete-ad-fields') {
      for (const path of op.data) drop(root, path);
    } else if (op.action === 'delete') for (const path of Array.isArray(op.data) ? op.data : [op.data]) {
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
  if (typeof $response === 'undefined') $done({});
  else if ((Number($response.status || $response.statusCode || 200)<200 || Number($response.status || $response.statusCode || 200)>=300) || typeof $response.body !== 'string' || !$response.body.trim()) $done({});
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
