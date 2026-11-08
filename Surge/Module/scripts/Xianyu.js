(function () {
"use strict";
/*
闲鱼去广告 - Surge conversion
Source: fkingikelee/fkikelee @ d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0
Original authors: 可莉🅥[https://github.com/luestr/ProxyResource/blob/main/README.md]
Original JS attribution: upstream kelee resources
See conversion notes for schema guards, log removal, and UI changes.
*/
const APP="Xianyu";
const OPERATIONS=[{"line":16,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.home\\.nextfresh\\/","flags":"i","action":"jq","data":".data.homeTopList |= map(select(.sectionType == \"kingkongDo\")) | .data.sections |= map(select(.data.clickParam.args.cardType as $ct | $ct != \"homeMultiBanner\" and $ct != \"mamaAD\")) | .data.sections |= map(select((.template.name|type==\"string\")and(.template.name==\"idlefish_home_new_commodity_card\"or(.template.name|contains(\"fish_home_tags_item_card\")))))"},{"line":18,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.widget\\.refresh\\.get\\/","flags":"i","action":"jq","data":".data.homeTopList |= map(select(.sectionType == \"kingkongDo\"))"},{"line":20,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.home\\.whale\\.modulet\\/","flags":"i","action":"jq","data":".data.container.sections |= map(select(.template.name == \"fish_home_miniapp\"))"},{"line":24,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.fun\\.follow\\.feed\\.list\\/","flags":"i","action":"jq","data":".data.sections|=map(select(.cardType==2001))"},{"line":26,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.home\\.community\\/","flags":"i","action":"jq","data":".data.feedsList |= map(select(.template.name == \"idlefish_home_new_commodity_card\" or .template.name == \"idlefish_home_new_content_card\"))"},{"line":30,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.home\\.newitem\\.page\\/","flags":"i","action":"jq","data":".data.sections |= map(select(.data.clickParam.args.cardType as $ct | $ct != \"banner\" and $ct != \"mamaAD\"))"},{"line":34,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.local\\.flow\\.plat\\.section\\/","flags":"i","action":"jq","data":".data.data.components |= map(select(.data and (.data|type==\"object\") and .data.template and (.data.template|type==\"object\") and .data.template.name and (.data.template.name|type==\"string\") and (.data.template.name|contains(\"fish_city_kingkong\"))))"},{"line":36,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.local\\.home\\.top\\/","flags":"i","action":"jq","data":".data.data.components |= map(select(.key == \"fish_home_second_stage_top_cardV3\"))"},{"line":38,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.local\\.home\\/","flags":"i","action":"jq","data":".data.sections |= map(select((.template.cardEnum != \"ads\") and (.cardType == \"common\")))"},{"line":40,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.idle\\.user\\.page\\.my\\.adapter\\/","flags":"i","action":"jq","data":".data.container.sections |= map(select((.template.name? // \"\") | test(\"^my_fy[0-9]+_(header|user_info|trade|appraise|tools)$\"))) | .data.container.sections |= map(.item |= (if .level and .level.exContent and (.level.exContent | has(\"tips\")) then del(.level) else . end)) | .data.container.sections |= map(if .sectionBizCode==\"entry2025\" then .item.tool.exContent.tools |= [[.[][] | select(.exContent.id as $id | $id==5 or $id==39 or $id==6 or $id==30 or $id==29 or $id==2 or $id==32 or $id==3 or $id==1)] | sort_by(. as $item | ([5,39,6,30,29,2,32,3,1] | index($item.exContent.id))) | [range(0;length;5) as $i | .[$i:$i+5]]][] else . end) | del(.data.ability)"},{"line":46,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.home\\.circle\\.list\\/","flags":"i","action":"jq","data":".data.circleList[]?.showInfo |= del(.titleImage, .atmosphereImageUrl) | .data.next.headList |= map(select(.bizCode == \"main\" or .bizCode == \"market\" or .bizCode == \"IDLE_CIRCLE\")) | del(.data.next.headList[]?.showInfo.rightTagImage)"},{"line":48,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlehome\\.magic\\.home\\.page\\.list\\/","flags":"i","action":"delete","data":"data.topList"},{"line":50,"pattern":"^https:\\/\\/g-acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlemtopsearch\\.search\\/","flags":"i","action":"jq","data":".data.resultList |= map(if .data.item.main.exContent.dislikeFeedback.clickParam.args.bizType == \"ad\" then empty else . end)"},{"line":52,"pattern":"^https:\\/\\/g-acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlemtopsearch\\.search\\/","flags":"i","action":"delete","data":"data.resultPrefixBar"},{"line":54,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlemtopsearch\\.search\\.discover\\/","flags":"i","action":"jq","data":".data.resultList |= map(select(.type != \"MarketHotSpot\"))"},{"line":56,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idlemtopsearch\\.item\\.search\\.activate\\/","flags":"i","action":"jq","data":".data.cardList |= map(if has(\"cardData\") and (.cardData | has(\"hotwords\")) then .cardData |= del(.hotwords) else . end)"},{"line":60,"pattern":"^https:\\/\\/acs\\.m\\.goofish\\.com\\/gw\\/mtop\\.taobao\\.idle\\.trade\\.full\\.info\\/","flags":"i","action":"jq","data":".data.components |= map(select(.render | . == \"orderStatusVO\" or . == \"addressInfoVO\" or . == \"orderInfoVO\"))"}];
const JQ_CONFIG={};
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
function xianyuJq(root, jq) {
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
