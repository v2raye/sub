(function () {
"use strict";
/*
汽车之家去广告 - Surge conversion
Source: fkingikelee/fkikelee @ d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0
Original authors: 可莉🅥[https://github.com/luestr/ProxyResource/blob/main/README.md]
Original JS attribution: upstream kelee resources
See conversion notes for schema guards, log removal, and UI changes.
*/
const APP="AutoHome";
const OPERATIONS=[{"line":53,"pattern":"^https:\\/\\/news\\.app\\.autohome\\.com\\.cn\\/news_v\\d+(?:\\.\\d+){2}\\/news\\/homenavigation","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/AutoHome/AutoHome_remove_ads.js"},{"line":55,"pattern":"^https:\\/\\/(a\\.athm\\.cn\\/)?mobile\\.app\\.autohome\\.com\\.cn\\/platform\\/carserver\\/((usercenter\\/getservicecards)|(carcard\\/allcard)|(carcard\\/mycardv\\d+)|(carcard\\/cards))","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/AutoHome/AutoHome_remove_ads.js"},{"line":57,"pattern":"^https:\\/\\/(a\\.athm\\.cn\\/)?club\\.app\\.autohome\\.com\\.cn\\/club_v\\d+(?:\\.\\d+){2}\\/club\\/index\\/businessv\\d+","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/AutoHome/AutoHome_remove_ads.js"},{"line":59,"pattern":"^https:\\/\\/(a\\.athm\\.cn\\/)?cars\\.app\\.autohome\\.com\\.cn\\/carstreaming\\/selectcarportal\\/reclist","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/AutoHome/AutoHome_remove_ads.js"},{"line":61,"pattern":"^https:\\/\\/(a\\.athm\\.cn\\/)?cars\\.app\\.autohome\\.com\\.cn\\/carstreaming\\/selectcarportal\\/seriestopwithtagscard","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/AutoHome/AutoHome_remove_ads.js"},{"line":63,"pattern":"^https:\\/\\/(a\\.athm\\.cn\\/)?apiautoappusc\\.che168\\.com\\/apic\\/v\\d+\\/gethomepagefeed","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/AutoHome/AutoHome_remove_ads.js"}];
const JQ_CONFIG={};
function upstream(url,obj) {

    // 删除首页 - 左上角以旧换新
    if (/\/news_v\d+(?:\.\d+){2}\/news\/homenavigation/.test(url)) {
        delete obj.result.leftops;
    }

    // 删除社区广场 - 广告轮播图
    if (/\/club_v\d+(?:\.\d+){2}\/club\/index\/businessv\d+/.test(url)) {
        delete obj.result.bannerlist;
    }

    // 删除选车 - 直播浮窗
    if (url.includes("/carstreaming/selectcarportal/reclist")) {
        delete obj.result.liveinfo;
    }
    
    // 删除我的页面 - 移除添加我的爱车领券
    if (/\/platform\/carserver\/carcard\/mycardv\d+/.test(url)) {
      delete obj.result.nocartext;
  }

    // 删除我的页面 - 热门活动
    if (/\/platform\/carserver\/carcard\/cards/.test(url)) {
      if (Array.isArray(obj.result.list)) obj.result.list.splice(0,1);
  }

    // 遍历关键词删除
    function removeItemsWithKeywords(objc, keyword) {
        var otherlist = objc["result"]["otherlist"]
        if (Array.isArray(otherlist)) {
          otherlist = otherlist.filter(function(ol) {
            var lists = ol["list"]
            if (Array.isArray(lists)) {
              for (let index in lists) {
                var item = lists[index]
                if (item["title"] === keyword) {
                  return false
                }
              }
            }
            return true
          });
        }
        objc["result"]["otherlist"] = otherlist
        return objc
    }

    // 选车 - 新车报价页面直播内容
    if (url.includes("/carstreaming/selectcarportal/seriestopwithtagscard")) {
        obj = removeItemsWithKeywords(obj, "直播中");
        obj = removeItemsWithKeywords(obj, "报价中");
    }

    // 删除二手车 - 竖版轮播图
    if (/\/apic\/v\d+\/gethomepagefeed/.test(url)) {
        obj = removeItemsWithKeywords(obj, "车抵贷");
    }

    // 精简精选服务、全部服务
    if (/\/platform\/carserver\/((usercenter\/getservicecards)|(carcard\/allcard))/.test(url)) {
        obj = removeItemsWithKeywords(obj, "低息借钱");
        obj = removeItemsWithKeywords(obj, "分期购车");
        obj = removeItemsWithKeywords(obj, "车主贷");
        obj = removeItemsWithKeywords(obj, "测贷款额度");
        obj = removeItemsWithKeywords(obj, "测贷款额");
    }

    
return obj;
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
