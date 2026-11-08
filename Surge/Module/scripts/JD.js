(function(){
"use strict";
/* 京东去广告; Surge audit 2026-11-07. Source fkingikelee/fkikelee @ d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0; RuCu6[https://github.com/RuCu6], Maasea[https://github.com/Maasea]. Original JS RuCu6/QuanX. See README-Adblock-Apps.md. */
const APP="JD";
const OPERATIONS=[{"line":19,"pattern":"^https:\\/\\/api\\.m\\.jd\\.com\\/client\\.action\\?functionId=basicConfig","flags":"i","action":"replace","paths":["data.JDMessage.socketmonitor.isSocketEstablishedAhead","data.JDMessage.socketmonitor.isSocketReport","data.JDHttpToolKit.httpdns.httpdns"],"values":[0,0,0]},{"line":22,"pattern":"^https:\\/\\/api\\.m\\.jd\\.com\\/client\\.action\\?functionId=(deliverLayer|getTabHomeInfo|myOrderInfo|orderTrackBusiness|personinfoBusiness|start|welcomeHome)","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/JD/JD_remove_ads.js"}];
const UI_REQUESTS=[{"pattern":"^https:\\/\\/api\\.m\\.jd\\.com\\/client\\.action\\?(?:[^#]*&)?functionId=(searchBoxWord|stationPullService|uniformRecommend[06])(?:&|$)","flags":"i","image":false}];
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
function upstream(url,obj) {

if (url.includes("functionId=deliverLayer") || url.includes("functionId=orderTrackBusiness")) {
  // 物流页面
  if (obj?.bannerInfo) {
    // 收货时寄快递享八折 享受条件苛刻 故移除
    delete obj.bannerInfo;
  }
  if (Array.isArray(obj?.floors) && obj.floors.length > 0) {
    // 运费八折
    obj.floors = obj.floors.filter((i) => !["banner", "jdDeliveryBanner"]?.includes(i?.mId));
  }
} else if (url.includes("functionId=getTabHomeInfo")) {
  // 新品页面
  if (obj?.result?.iconInfo) {
    // 新品页 悬浮动图
    delete obj.result.iconInfo;
  }
  if (obj?.result?.roofTop) {
    // 新品页 下拉二楼
    delete obj.result.roofTop;
  }
} else if (url.includes("functionId=myOrderInfo")) {
  // 订单页面
  if (Array.isArray(obj?.floors) && obj.floors.length > 0) {
    let newFloors = [];
    for (let floor of obj.floors) {
      if(!object(floor)){newFloors.push(floor);continue;}
      if (["bannerFloor", "bpDynamicFloor", "plusFloor"]?.includes(floor?.mId)) {
        // bannerFloor满意度评分 bpDynamicFloor专属权益 plusFloor开通会员
        continue;
      } else {
        if (floor?.mId === "virtualServiceCenter") {
          // 服务中心
          if (Array.isArray(floor?.data?.virtualServiceCenters) && floor.data.virtualServiceCenters.length > 0) {
            let newItems = [];
            for (let item of floor.data.virtualServiceCenters) {
              if(!object(item)){newItems.push(item);continue;}
              if (Array.isArray(item?.serviceList) && item.serviceList.length > 0) {
                let newCards = [];
                for (let card of item.serviceList) {
                  if (card?.serviceTitle === "精选特惠") {
                    continue;
                  }
                  newCards.push(card);
                }
                item.serviceList = newCards;
              }
              newItems.push(item);
            }
            floor.data.virtualServiceCenters = newItems;
          }
        }
        if (floor?.mId === "customerServiceFloor") {
          // 客户服务
          if (floor?.data?.moreText) {
            // 点此获得更多服务
            delete floor.data.moreIcon;
            delete floor.data.moreIcon_dark;
            floor.data.moreText = " ";
          }
        }
        newFloors.push(floor);
      }
    }
    obj.floors = newFloors;
  }
} else if (url.includes("functionId=personinfoBusiness")) {
  // 个人页面
  if (Array.isArray(obj?.floors) && obj.floors.length > 0) {
    let newFloors = [];
    for (let floor of obj.floors) {
      if(!object(floor)){newFloors.push(floor);continue;}
      const items = [
        "bigSaleFloor", // 双十一
        "buyOften", // 常买常逛
        // "iconToolFloor", // 底部工具栏
        // "keyToolsFloor", // 浏览记录
        "newAttentionCard", // 关注的频道
        "newBigSaleFloor", // 双十一
        "newStyleAttentionCard", // 新版关注的频道
        // "newWalletIdFloor", // 我的钱包
        "newsFloor", // 京东快讯
        "noticeFloor", // 顶部横幅
        // "orderIdFloor", // 我的订单
        "recommendfloor" // 我的推荐
      ];
      if ((CLEANUP_UI ? items : ["bigSaleFloor","newBigSaleFloor","noticeFloor"])?.includes(floor?.mId)) {
        continue;
      } else {
        if (floor?.mId === "basefloorinfo") {
          // 弹窗
          if (CLEANUP_UI && floor?.data?.commonPopup) {
            delete floor.data.commonPopup;
          }
          // 弹窗
          if (CLEANUP_UI && floor?.data?.commonPopup_dynamic) {
            delete floor.data.commonPopup_dynamic;
          }
          // 底部会员续费横幅
          if (CLEANUP_UI && floor?.data?.commonTips?.length > 0) {
            floor.data.commonTips = [];
          }
          // 弹窗
          if (CLEANUP_UI && floor?.data?.commonWindows?.length > 0) {
            floor.data.commonWindows = [];
          }
          // 右下角动图
          if (floor?.data?.floatLayer) {
            delete floor.data.floatLayer;
          }
        } else if (floor?.mId === "iconToolFloor") {
          // 底部工具栏
          if (CLEANUP_UI && Array.isArray(floor?.data?.nodes) && floor.data.nodes.length > 0) {
            const sortLists = [
              "applezhushou", // apple助手 1-1-1
              "lingjindouxin", // 签到领豆 1-1-2
              "dongdongnongchangxin", // 京东农场 1-1-3
              "chongwangwang", // 宠汪汪 1-1-4
              "kehufuwu", // 客户服务 1-2-1
              "xianzhiguanjia", // 闲置换钱 1-2-2
              "wenyisheng", // 问医生 1-2-3
              "jijianfuwu", // 寄件服务 1-2-5
              "zhuanzuanhongbao", // 天天赚红包 2-2-1
              "huanletaojin" // 欢乐淘金 2-2-2
            ];
            let node = floor.data.nodes;
            if (Array.isArray(node?.[0]) && node[0].length > 0) {
              // 第一组十个
              node[0] = node[0]
                .filter((i) => sortLists?.includes(i?.functionId))
                .sort((a, b) => sortLists.indexOf(a?.functionId) - sortLists.indexOf(b?.functionId));
            }
            if (Array.isArray(node?.[1]) && node[1].length > 0) {
              // 第二组四个
              node[1] = node[1]
                .filter((i) => sortLists?.includes(i?.functionId))
                .sort((a, b) => sortLists.indexOf(a?.functionId) - sortLists.indexOf(b?.functionId));
            }
          }
        } else if (floor?.mId === "orderIdFloor") {
          if (CLEANUP_UI && floor?.data?.commentRemindInfo?.infos?.length > 0) {
            // 发布评价的提醒
            floor.data.commentRemindInfo.infos = [];
          }
        } else if (floor?.mId === "userinfo") {
          // 个人页 顶部背景图
          // if (floor?.data?.bgImgInfo?.bgImg) {
          //   delete floor.data.bgImgInfo.bgImg;
          // }
          // 开通plus会员卡片
          if (floor?.data?.newPlusBlackCard) {
            delete floor.data.newPlusBlackCard;
          }
        }
        newFloors.push(floor);
      }
    }
    obj.floors = newFloors;
  }
} else if (url.includes("functionId=start")) {
  // 开屏广告
  if (Array.isArray(obj?.images) && obj.images.length > 0) {
    obj.images = [];
  }
  if (obj?.showTimesDaily) {
    obj.showTimesDaily = 0;
  }
} else if (url.includes("functionId=welcomeHome")) {
  // 首页配置
  if (Array.isArray(obj?.floorList) && obj.floorList.length > 0) {
    const delItems = [
      "bottomXview", // 底部悬浮通栏推广
      "float", // 悬浮推广小圆图
      "photoCeiling", // 顶部通栏动图推广
      // "recommend", // 为你推荐
      ...(CLEANUP_UI ? ["ruleFloat"] : []), // 资质与规则
      "searchIcon", // 右上角消费券
      ...(CLEANUP_UI ? ["topRotate"] : []), // 左上角logo
      "tabBarAtmosphere" // 底部悬浮通栏推广
    ];
    // 首页 图层列表
    obj.floorList = obj.floorList.filter((i) => !delItems?.includes(i?.type));
  }
  // 首页 顶部背景图
  // if (obj?.topBgImgBig) {
  //   delete obj.topBgImgBig;
  // }
  // 首页 下拉二楼
  if (CLEANUP_UI && Array.isArray(obj?.webViewFloorList) && obj.webViewFloorList.length > 0) {
    obj.webViewFloorList = [];
  }
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
// Compatibility evidence: zbsdsb/loon-adblock-plugins JD v2. Keep inferred shapes conservative.
function jdCompat(url, root) {
  if (!/^https?:\/\/api\.m\.jd\.com\/client\.action(?:[?#]|$)/i.test(url)) return root;
  const hit=/[?&]functionId=([^&#]+)/i.exec(url);
  let id=hit?decodeURIComponent(hit[1]):'';
  const supported=['deliverLayer','getTabHomeInfo','myOrderInfo','orderTrackBusiness','personinfoBusiness','start','startup','welcomeHome','basicConfig'];
  id=supported.find(x=>x.toLowerCase()===id.toLowerCase()) || (id?'__unknown__':'');
  if (id==='basicConfig') {
    const paths=['data.JDMessage.socketmonitor.isSocketEstablishedAhead','data.JDMessage.socketmonitor.isSocketReport','data.JDHttpToolKit.httpdns.httpdns'];
    for (const path of paths) if(at(root,path)!==undefined)set(root,path,0);
    return root;
  }
  let payload=root;
  const shaped=x=>object(x) && ['images','floors','floorList','bannerInfo'].some(k=>Object.prototype.hasOwnProperty.call(x,k));
  if (!shaped(root) && shaped(root.data)) payload=root.data;
  if (id==='getTabHomeInfo' && !object(root.result) && object(root.data?.result)) payload=root.data;
  if (!id) {
    // POST-only functionId is not exposed by Surge response scripts. Require independent response shape evidence.
    if (Array.isArray(payload.images) && Object.prototype.hasOwnProperty.call(payload,'showTimesDaily')) id='start';
    else if (Array.isArray(payload.floors)) {
      const ids=payload.floors.map(x=>at(x,'mId'));
      if(ids.some(x=>['basefloorinfo','iconToolFloor','orderIdFloor','userinfo','bigSaleFloor','newAttentionCard','newBigSaleFloor','newStyleAttentionCard','newsFloor','noticeFloor','recommendfloor','buyOften'].includes(x)))id='personinfoBusiness';
      else if(ids.some(x=>['bannerFloor','bpDynamicFloor','plusFloor','customerServiceFloor','virtualServiceCenter'].includes(x)))id='myOrderInfo';
      else if(ids.some(x=>['banner','jdDeliveryBanner'].includes(x)))id='deliverLayer';
    } else if(Array.isArray(payload.floorList) && payload.floorList.some(x=>['bottomXview','float','photoCeiling','ruleFloat','searchIcon','topRotate','tabBarAtmosphere'].includes(at(x,'type'))))id='welcomeHome';
  }
  if (!id || id==='__unknown__') return root;
  if(id==='startup')id='start';
  upstream('https://api.m.jd.com/client.action?functionId='+id,payload);
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
function transform(url, root) {
  return jdCompat(url,root);
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
