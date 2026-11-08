(function () {
"use strict";
/*
京东去广告 - Surge conversion
Source: fkingikelee/fkikelee @ d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0
Original authors: RuCu6[https://github.com/RuCu6], Maasea[https://github.com/Maasea]
Original JS attribution: RuCu6/QuanX
See conversion notes for schema guards, log removal, and UI changes.
*/
const APP="JD";
const OPERATIONS=[{"line":19,"pattern":"^https:\\/\\/api\\.m\\.jd\\.com\\/client\\.action\\?functionId=basicConfig","flags":"i","action":"replace","paths":["data.JDMessage.socketmonitor.isSocketEstablishedAhead","data.JDMessage.socketmonitor.isSocketReport","data.JDHttpToolKit.httpdns.httpdns"],"values":[0,0,0]},{"line":22,"pattern":"^https:\\/\\/api\\.m\\.jd\\.com\\/client\\.action\\?functionId=(deliverLayer|getTabHomeInfo|myOrderInfo|orderTrackBusiness|personinfoBusiness|start|welcomeHome)","flags":"i","action":"upstream_js","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JavaScript/JD/JD_remove_ads.js"}];
const JQ_CONFIG={};
function upstream(url,obj) {

if (url.includes("functionId=deliverLayer") || url.includes("functionId=orderTrackBusiness")) {
  // 物流页面
  if (obj?.bannerInfo) {
    // 收货时寄快递享八折 享受条件苛刻 故移除
    delete obj.bannerInfo;
  }
  if (obj?.floors?.length > 0) {
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
  if (obj?.floors?.length > 0) {
    let newFloors = [];
    for (let floor of obj.floors) {
      if (["bannerFloor", "bpDynamicFloor", "plusFloor"]?.includes(floor?.mId)) {
        // bannerFloor满意度评分 bpDynamicFloor专属权益 plusFloor开通会员
        continue;
      } else {
        if (floor?.mId === "virtualServiceCenter") {
          // 服务中心
          if (floor?.data?.virtualServiceCenters?.length > 0) {
            let newItems = [];
            for (let item of floor.data.virtualServiceCenters) {
              if (item?.serviceList?.length > 0) {
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
  if (obj?.floors?.length > 0) {
    let newFloors = [];
    for (let floor of obj.floors) {
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
      if (items?.includes(floor?.mId)) {
        continue;
      } else {
        if (floor?.mId === "basefloorinfo") {
          // 弹窗
          if (floor?.data?.commonPopup) {
            delete floor.data.commonPopup;
          }
          // 弹窗
          if (floor?.data?.commonPopup_dynamic) {
            delete floor.data.commonPopup_dynamic;
          }
          // 底部会员续费横幅
          if (floor?.data?.commonTips?.length > 0) {
            floor.data.commonTips = [];
          }
          // 弹窗
          if (floor?.data?.commonWindows?.length > 0) {
            floor.data.commonWindows = [];
          }
          // 右下角动图
          if (floor?.data?.floatLayer) {
            delete floor.data.floatLayer;
          }
        } else if (floor?.mId === "iconToolFloor") {
          // 底部工具栏
          if (floor?.data?.nodes?.length > 0) {
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
            if (node?.[0]?.length > 0) {
              // 第一组十个
              node[0] = node[0]
                .filter((i) => sortLists?.includes(i?.functionId))
                .sort((a, b) => sortLists.indexOf(a?.functionId) - sortLists.indexOf(b?.functionId));
            }
            if (node?.[1]?.length > 0) {
              // 第二组四个
              node[1] = node[1]
                .filter((i) => sortLists?.includes(i?.functionId))
                .sort((a, b) => sortLists.indexOf(a?.functionId) - sortLists.indexOf(b?.functionId));
            }
          }
        } else if (floor?.mId === "orderIdFloor") {
          if (floor?.data?.commentRemindInfo?.infos?.length > 0) {
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
  if (obj?.images?.length > 0) {
    obj.images = [];
  }
  if (obj?.showTimesDaily) {
    obj.showTimesDaily = 0;
  }
} else if (url.includes("functionId=welcomeHome")) {
  // 首页配置
  if (obj?.floorList?.length > 0) {
    const delItems = [
      "bottomXview", // 底部悬浮通栏推广
      "float", // 悬浮推广小圆图
      "photoCeiling", // 顶部通栏动图推广
      // "recommend", // 为你推荐
      "ruleFloat", // 资质与规则
      "searchIcon", // 右上角消费券
      "topRotate", // 左上角logo
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
  if (obj?.webViewFloorList?.length > 0) {
    obj.webViewFloorList = [];
  }
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
