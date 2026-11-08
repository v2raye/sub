(function () {
"use strict";
/*
淘宝去广告 - Surge conversion
Source: fkingikelee/fkikelee @ d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0
Original authors: RuCu6[https://github.com/RuCu6]
Original JS attribution: RuCu6/QuanX
See conversion notes for schema guards, log removal, and UI changes.
*/
const APP="Taobao";
const OPERATIONS=[{"line":35,"pattern":"^https:\\/\\/guide-acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.taobao\\.(cloudvideo\\.video\\.query|wireless\\.home\\.splash\\.awesome\\.get)","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/Taobao/Taobao_remove_ads.js"},{"line":37,"pattern":"^https:\\/\\/poplayer\\.template\\.alibaba\\.com\\/\\w+\\.json","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/Taobao/Taobao_remove_ads.js"}];
const JQ_CONFIG={};
function upstream(url,obj) {
const isResp=true; let body=JSON.stringify(obj);
switch (isResp) {
  // 淘宝-开屏视频广告
  case /^https:\/\/guide-acs\.m\.taobao\.com\/gw\/mtop\.taobao\.cloudvideo\.video\.query/.test(url):
    try {
      let obj = JSON.parse(body);
      if (obj?.data?.duration) {
        obj.data.duration = "0";
      }
      if (obj?.data?.resources?.length > 0) {
        obj.data.resources = [];
      }
      if (obj?.data?.caches?.length > 0) {
        obj.data.caches = [];
      }
      if (obj?.data?.respTimeInMs) {
        obj.data.respTimeInMs = "3818332800000";
      }
      body = JSON.stringify(obj);
    } catch (err) {
      
    }
    break;
  // 淘宝-开屏图片广告
  case /^https:\/\/guide-acs\.m\.taobao\.com\/gw\/mtop\.taobao\.wireless\.home\.splash\.awesome\.get/.test(url):
    try {
      let obj = JSON.parse(body);
      if (obj?.data?.containers?.splash_home_base) {
        let splash = obj.data.containers.splash_home_base;
        if (splash?.base?.sections?.length > 0) {
          for (let items of splash.base.sections) {
            if ("taobao-splash" in items.bizData) {
              if (items?.bizData?.["taobao-splash"]?.data?.length > 0) {
                for (let item of items.bizData["taobao-splash"].data) {
                  item.waitTime = "0";
                  item.times = "0";
                  item.hotStart = "false";
                  item.haveVoice = "false";
                  item.hideTBLogo = "false";
                  item.enable4G = "false";
                  item.coldStart = "false";
                  item.waitTime = "0";
                  item.startTime = "3818332800000";
                  item.endTime = "3818419199000";
                  item.gmtStart = "2090-12-31 00:00:00";
                  item.gmtEnd = "2090-12-31 23:59:59";
                  item.gmtStartMs = "3818332800000";
                  item.gmtEndMs = "3818419199000";
                  if (item?.imgUrl) {
                    item.imgUrl = "";
                  }
                  if (item?.videoUrl) {
                    item.videoUrl = "";
                  }
                }
              }
            }
          }
        }
      }
      body = JSON.stringify(obj);
    } catch (err) {
      
    }
    break;
  // 淘宝-开屏活动
  case /^https:\/\/poplayer\.template\.alibaba\.com\/\w+\.json/.test(url):
    try {
      let obj = JSON.parse(body);
      if (obj?.res?.images?.length > 0) {
        obj.res.images = [];
      }
      if (obj?.res?.videos?.length > 0) {
        obj.res.videos = [];
      }
      if (obj?.enable) {
        obj.enable = false;
      }
      if (obj?.mainRes?.images?.length > 0) {
        obj.mainRes.images = [];
      }
      body = JSON.stringify(obj);
    } catch (err) {
      
    }
    break;
  default:
    break;
}


return JSON.parse(body);
}
// Pure JSON transforms. No network, storage, notification, cookie, or account APIs.
function object(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
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
  try { value = JSON.parse(record.value); } catch (_) { return; }
  if (!object(value)) return;
  const before = JSON.stringify(value);
  fn(value);
  if (JSON.stringify(value) !== before) record.value = JSON.stringify(value);
}
function nestedObject(parent, key) {
  if (parent[key] === undefined || parent[key] === null) parent[key] = {};
  return object(parent[key]) ? parent[key] : null;
}
function transform(url, root) {
  for (const op of OPERATIONS) {
    if (!(new RegExp(op.pattern, op.flags)).test(url)) continue;
    if (op.action === 'delete') for (const path of Array.isArray(op.data) ? op.data : [op.data]) drop(root,path);
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
  if (typeof $response === 'undefined' || typeof $response.body !== 'string' || !$response.body.trim()) $done({});
  else {
    const original = JSON.parse($response.body);
    if (!object(original)) $done({});
    else {
      const before = JSON.stringify(original);
      const result = transform($request.url,original);
      const body = JSON.stringify(result);
      $done(body === before ? {} : {body});
    }
  }
} catch (_) {
  // Fail open on new schemas or non-JSON responses, without logging user response content.
  $done({});
}

})();
