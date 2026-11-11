(function(){
"use strict";
/* 高德地图去广告; Surge audit 2026-11-07. Source fkingikelee/fkikelee @ d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0; 可莉🅥[https://github.com/luestr/ProxyResource/blob/main/README.md]. Original JS kelee resources. See README-Adblock-Apps.md. */
const APP="Amap";
const OPERATIONS=[{"line":16,"pattern":"^https:\\/\\/m5\\.amap\\.com\\/ws\\/shield\\/frogserver\\/aocs\\/updatable\\/1\\?","flags":"i","action":"delete","data":["data.adStatementConfig","data.adCustomerRetainArchitecture","data.adImEntryConfig","data.adVenueConfig","data.adPerfSwitch","data.EndNaviC3AdCard","data.infoCpcReport","data.hotsaleConfig","data.marketing_resource_config","data.coupon_risk_asac","data.commonCouponSceneLog","data.sug_coupon_opt","data.giftEntryConfig","data.splashscreen","data.SplashScreenControl","data.splashview_config","data.feedback_banner","data.TrainOrderBanner","data.nearby_business_popup","data.shortcut_popup_frequency","data.tel_retention_popup","data.hotel_activity","data.taxi_activity","data.hotel_privilege","data.sportsActivityConfig","data.activity_qingke_contry_control","data.920bestwishes","data.custom_consultdata.widget_guide","data.free_ride","data.homepage_resource_config","data.home_message_guide","data.hotel_tipsicon","data.sur_bar","data.nearby_map_entry_guide","data.comment_info","data.small_biz_index","data.small_biz_fun","data.setpagesearch","data.wallet"]},{"line":18,"pattern":"^https:\\/\\/m5\\.amap\\.com\\/ws\\/shield\\/frogserver\\/aocs\\/updatable\\/1\\?","flags":"i","action":"jq_file","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JQLang/Amap/updatable.jq"},{"line":20,"pattern":"^https:\\/\\/m5\\.amap\\.com\\/ws\\/shield\\/dsp\\/profile\\/index\\/nodefaasv3\\?","flags":"i","action":"jq","data":"del(.data.tipData, .data.wallet) | .data.cardList |= map(select(.dataKey == \"MineNewFootprintCard\" or .dataKey == \"MineNewBEntranceCardV4\")) | (.data.cardList[] | select(.dataKey == \"MineNewBEntranceCardV4\") | .content.entranceList_1) |= map(select(.id == 7 or .id == 8 or .id == 10 or .id == 17)) | (.data.cardList[] | select(.dataKey == \"MineNewBEntranceCardV4\") | .content.entranceList_2) |= map(select(.id == 32 or .id == 4 or .id == 9 or .id == 16 or .id == 14))"},{"line":22,"pattern":"^https:\\/\\/m5\\.amap\\.com\\/ws\\/shield\\/scene\\/recommend\\?","flags":"i","action":"delete","data":"$.data.shadingWords"},{"line":23,"pattern":"^https:\\/\\/m5\\.amap\\.com\\/ws\\/shield\\/scene\\/recommend\\?","flags":"i","action":"jq","data":".data.toolsRecommend.data.default |= map(select(.id == 102 or .id == 103 or .id == 106 or .id == 151))"},{"line":25,"pattern":"^https:\\/\\/sns\\.amap\\.com\\/ws\\/opc\\/tools\\/list\\?","flags":"i","action":"jq","data":"(if (type == \"object\") and ((.data | type) == \"object\") and ((.data.category | type) == \"array\") then (.data.category[] | select(type == \"object\") | .tools | select(type == \"array\") | .[] | select(type == \"object\")) |= del(.tips) else . end) | (if (type == \"object\") and ((.data | type) == \"object\") and ((.data.category | type) == \"array\") then (.data.category[] | select(type == \"object\") | .tools | select(type == \"array\")) |= map(select(if type == \"object\" then (((.id | type) == \"string\" and .id == \"547\") or ((.id | type) == \"number\" and .id == 547)) | not else true end)) else . end)"},{"line":32,"pattern":"^https:\\/\\/info\\.amap\\.com\\/ws\\/c3frontend\\/af-search\\/search\\?","flags":"i","action":"jq","data":"if (try (.data.modules.quickLink.data.list | type) catch null) == \"array\" then .data.modules.quickLink.data.list |= map(if type == \"object\" and (.badge | type) == \"object\" and (.badge | has(\"text\")) then .badge.text = \"\" else . end) else . end"},{"line":36,"pattern":"^https:\\/\\/m5-zb\\.amap\\.com\\/ws\\/boss\\/car\\/order\\/content_info\\?","flags":"i","action":"delete","data":["data.lubanData.skin","data.lubanData.kingToolBoxBubble","data.lubanData.popup"]},{"line":38,"pattern":"^https:\\/\\/m5-zb\\.amap\\.com\\/ws\\/boss\\/car\\/order\\/content_info\\?","flags":"i","action":"jq","data":"def on_path($p; $t; f): if (try (getpath($p) | type == $t) catch false) then getpath($p) |= f else . end; (on_path([\"data\",\"lubanData\",\"kingToolSort\",\"dataList\"]; \"array\"; map(if type == \"object\" then (if ((try (.biz | type) catch null) == \"object\" and (.biz | has(\"kingToolIdList\"))) then (.biz.kingToolIdList |= (if type == \"array\" then map(select(IN(\"dache_toolbox_GDIntercity\",\"dache_toolbox_hitch\",\"dache_toolbox_chauffeur\",\"dache_toolbox_quality\",\"dache_toolbox_charterCar\"))) else . end)) else . end) else . end))) | on_path([\"data\",\"lubanData\",\"kingToolBox\",\"dataList\"]; \"array\"; map(select(if type == \"object\" then ((try (.biz | type) catch null) == \"object\" and (try (.biz.id | IN(\"dache_toolbox_GDIntercity\",\"dache_toolbox_hitch\",\"dache_toolbox_chauffeur\",\"dache_toolbox_quality\",\"dache_toolbox_charterCar\")) catch false)) else false end)))"},{"line":40,"pattern":"^https:\\/\\/m5-zb\\.amap\\.com\\/ws\\/amap\\/hitch\\/passenger\\/content_info\\?","flags":"i","action":"delete","data":"data.lubanData.banner"},{"line":44,"pattern":"^https:\\/\\/center\\.amap\\.com\\/ws\\/amc\\/server\\/conv\\/raise_list\\?","flags":"i","action":"jq","data":"def on_path($p; $t; f): if (try (getpath($p) | type == $t) catch false) then getpath($p) |= f else . end; on_path([\"data\",\"dataList\"]; \"array\"; map(select(if type == \"object\" then (has(\"categoryId\") or ((.data | type) == \"object\" and .data.id == \"M_100007\")) else false end)))"},{"line":46,"pattern":"^https:\\/\\/m5\\.amap\\.com\\/ws\\/shield\\/scene\\/recommend\\?","flags":"i","action":"jq","data":"(if (try (.data.shadingWords.data.regions.content | type == \"array\") catch false) then .data.shadingWords.data.regions.content |= map(select(IN(\"quickLink\",\"history\",\"searchFind\"))) else . end) | (if (try (.data.shadingWords.data.modules | type == \"object\") catch false) then .data.shadingWords.data.modules |= with_entries(select(.key == \"searchFind\")) else . end)"},{"line":48,"pattern":"^https:\\/\\/info\\.amap\\.com\\/ws\\/shield\\/search_business\\/process\\/middleLayer\\/sug\\?","flags":"i","action":"jq","data":".tip_list |= map(select(.tip.task_tag == \"common_content_general\" or .tip.task_tag == \"sp\"))"},{"line":50,"pattern":"^https:\\/\\/info\\.amap\\.com\\/ws\\/shield\\/search\\/poi\\/detail\\?","flags":"i","action":"delete","data":["data.modules.combineReviews.data.write_comment.btnRightTag","data.modules.combineReviews.data.write_comment.title"]},{"line":52,"pattern":"^https:\\/\\/info\\.amap\\.com\\/ws\\/shield\\/search\\/poi\\/detail\\?","flags":"i","action":"jq_file","data":"https://raw.githubusercontent.com/fkingikelee/fkikelee/main/Resource/kelee/JQLang/Amap/search_poi_detail.jq"},{"line":54,"pattern":"^https:\\/\\/m5\\.amap\\.com\\/ws\\/smartui\\/near_recommend\\?","flags":"i","action":"delete","data":"data.operation_activity"},{"pattern":"^https://m5\\.amap\\.com/ws/shield/search_business/process/marketingOperationStructured(?:\\?|$)","flags":"i","action":"delete-ad-fields","data":["data.commonMaterial","data.tipsOperationLocation","data.resourcePlacement"]}];
const JQ_CONFIG={"basemapDelete":["splash","ai_splash","ipSquare_window_video_config","usercenter_lottery_switch","coins_lottery","coins_wish","newYearLotteryTips","mileage_coin_scene","licheng_coin_mine_entry","member_grabbing","vip_checkout_welfare_dialog_config","task_poi_card_coupon_switch","jay_act","pointExchangeCenter","pointExchangeGoCommentUrl","batchCheckIn","batchCheckIn_new","fireworks","fireworkFeatureCodes","setFireworksNightMode","fireworks_click_change_night","2024greetingTofireworks","greeting_widget_switch","newYearSystemScreenRecordListenSwitch","ugcActivityH5","study_create_url","asset_space_pilot","ipSquare_goods_tab_desc","vip_member_config","recently_activity","business_position","carLogos","voiceLogos","increase_product_name_account","invite_poi_share_pic","block_increase_product_detail_share_button","mainIcon","mainBubble","blueBar","presetWord","homepage_tabguide","suit_set_popup","pop_selection","ipsqure_free_pop_hours","desk_card_footprint_check_in","desk_card_searchtool","arLayerDialogConfig","geochoBackConfirmDialogConfig","followGuidePopupConfig","growth_bubble_guide_config","bottom_login_guide_config","frequent_location_login_guide_config","login_guide_show_rules","show_landmark_exploration_card","reachFrequency","reachTaskFrequency","msgbox_show_popwindow","aiqs_pull_up_guide","new_aiqs_pull_up_guide","full_screen_guide_video_config","ai_guideo_video_map","feature_guide_switch","geoechoGuideLottieConfig","level_page_slide","level_page_tips","garage_top_button","ThemeSquareSwiperCanJumpUrlList"],"naviDelete":["long_trip_service_coupon","long_trip_service_coupon_enter","long_trip_service_coupon_links","QQMusicVipText","QQMusicMembershipVoice","ETCGuide","etc_banner","music_config","music_sdk_recommend_title","music_ai_guide_fatigue","music_ai_next_login_rate","music_source","DownloadQQplayerSDK","voicePlayground","route_search_Starbucks","Starbucksfinish","H5guidelottie","route_search_guide_lottie","via_result_bottomtext","planHomeGuideConfig","energy_add_plate_list","operation_consumer_bubble","bubble_priority","desk_card_commute","consumeAfterPopup_days","Rescue_popup_service","smart_drive_tips","city_drive_tips","BackCar","customized_navigation","TabRecommend","newTabRecommendSwitch","ExtremelyRecommendCount","tab_recommend_filter","tab_recommend_switch_third_schema","dropby_scroll","gas_path_bubble","carowner","operation_chat_add_group","noInternetCardSwitch"],"taxiDelete":["denghuo_ad","banner_picture_url","carpool_city","carpool_intercity","intercity_index_page_header","skin_show","hq_112background","chauffeurBannerSort","hitch_other_tab","hitch_other_tab_v2","dache_toolbox_promo","dache_toolbox_marketing","dache_toolbox_remote","dache_toolbox_carpool","dache_toolbox_chauffeur","PaymentOneClickLayerInfo","s_reward_center_config","taxi_personal_virtual_gold_url","student_url","student_icon","student_title","student_describe","chauffeurTabKingToolConfig_left","chauffeurTabBubbleText","discount_bubble","coupon_traction_bubble_v3","intercity_entrance_tag","long-dis_preferential","taxi_shortcut_manager","vip_88_guide_fatigue","vip-h5","taxi_commercialization","isUseChauffeurNewMarketingSlot","operation_module_render_new","retainPopupDiscount","taxi_coupon_entry_new","thailandCouponRedirectAimap","isChauffeurUseNewCouponCenter","chauffeurComboCouponSwitch","couponNewStyleV730","is_favorable_show","taxi_personal_virtual_gold","taxi_personal_virtual_gold_title","student_entry","unionvip_white_list","premium_customer_card_config","chauffeurTabKingToolConfig_alternative","chauffeurTabKingToolConfig_right","chauffeur_fatigue_config","hitch_101_popup_polling","ChauffeurViaPoisConfig","driveDiversionCardHitchTab","pinzhi_daoliu","CancelRetentionTec","intercity_atmosphere_config","carpool_waiting_config"],"poiAllowed":["baseInfo","poiDetailCommonConfig","navbarMore","backToTop","poiDetailBottomBar","poiMapModule","anchor","reSortContentAndSimilar","comprehensiveEditEntrance","functionZone","poiTipBar","floatTelButton","footer_tel_button","footer_retain_button","attractGalleryInfo","combineReviews","evaluateVO","reviews","inviteReview","seriousPublicExperience","societyPublicExperience","poiDetailRankUpCard","travelGuideAndQa","poiDetailAQModule","AIStreetTips","expertNote","recommend_food","shopNews","mallNews","shopBaseCase","wikiInfo","wikiInfoBelow","poiDetailNote","poiDetailWikiAndLOI","human_traffic","floorGuideGbf","houseEvaluationInfo","residentialOwnersVO","realtorRealStep","houseOfficeInfo","houseOfficeService","houseOfficeBrandIntroduction","houseOfficeNotice","newHouseDetailInfo","house_apart_info","scenic_mustplay","hotelGraphicDetail","homestayGraphicDetail","hotelFacilities","hotelMustRead","shoppingMallEvent","enhanceIMQuestions","enhanceCustomerServicePoiModule","aiAgentFooterBar","imBottomGuide","enhanceCustomerServiceFixedBottom","shopBasePerson","shopServiceBffvo","service_process","shopCourseList","poiDetailJobList","jobRec","shop_vip_card","shopStdActivity","privateSphereChannel","kaShopService","ka_not_enter","company1688Info","thirdparty_info","expressEntryCard","poi_intercept","aiAgentEntry","commonAiAgent","poiCardAiAgentEntryV2","storeDirections","shopFindWayGuide","shopQualifications","businessQualifications","legal_document","home_legal_document","rec_legal_document","business_scope","governmentInformation","official_account","merchantSettlement","shop_settlement","scenic_ticket","movieBookingShelf","hotelRooms","ktvBookingShelf","venueBookingShelfModule","reserveShelf","DinnerBottomBar","poiDetailAppointmentRegister"]};
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
function amapUpdatable(root) {
  if (!CLEANUP_UI) {
    for (const k of ['sportsGroupConfig','sportsRouteConfig']) inner(root,k,x=>delete x.group_banner);
    inner(root,'engine_render',x=>delKeys(x,['can_show_advert','advert_note_num']));
    for (const [name,keys] of [['amap_basemap_config',JQ_CONFIG.basemapDelete],['navi_cloud',JQ_CONFIG.naviDelete],['taxi',JQ_CONFIG.taxiDelete]]) inner(root,name,x=>delKeys(x,keys.filter(marketingKey)));
    return;
  }
  for (const k of ['sportsGroupConfig', 'sportsRouteConfig']) inner(root, k, x => delete x.group_banner);
  inner(root, 'his_input_tip', x => {
    delete x.channel_zhitiao; x.his_recommend_bangdan = 0;
    const y = nestedObject(x, 'nearby_hotword'); if (y) y.search_detail = 0;
  });
  inner(root, 'navi_end', x => delete x.operator_btns);
  inner(root, 'engine_render', x => delKeys(x, ['can_show_advert', 'advert_note_num']));
  inner(root, 'detail_config', x => {
    delete x.shelf_coupon_refresh; x.isGoodsShelfPerfV2 = 0; x.NearbySearchOptimization = 0;
    for (const k of ['poiDetailScreenCacheConfig', 'poiDetailScreenCacheOtherConfig']) {
      const y = nestedObject(x, k); if (y) y.secondScreenAnchorModule = '';
    }
  });
  inner(root, 'amap_basemap_config', x => delKeys(x, JQ_CONFIG.basemapDelete));
  inner(root, 'navi_cloud', x => {
    delKeys(x, JQ_CONFIG.naviDelete); x.end_auto_foot_explore = 0; x.ExtremelyRecommendCount = 0;
  });
  inner(root, 'taxi', x => {
    delKeys(x, JQ_CONFIG.taxiDelete);
    for (const k of ['recommend_point_optimization', 'recommend_point_service_overview', 'end_point_optimization', 'hitch_way_point_nav_default']) x[k] = 0;
  });
  inner(root, 'poi_folder_modules', x => {
    const keep = ['enhanceIMQuestions','platformCustomerCommonModule','platformCustomerComplianceInfo','evaluateVO'];
    for (const k of ['folder_modules','newFolderModules']) if (Array.isArray(x[k])) x[k] = x[k].filter(v => keep.includes(v));
  });
  inner(root, 'favorites_info', x => { x.nearby_picture_on = 0; x.nearby_picture_distance = 0; });
  inner(root, 'container_isolation', x => { x.nearby_feed_poi_card_v2_multi_img = 0; });
  inner(root, 'nore_rec', x => { x.recommend = 0; });
  inner(root, 'engine_eyrie', x => delete x.poi_area_bubble);
  inner(root, 'WIA', x => delete x.orgGuideVideoConfig);
}
function amapPoi(root) {
  if (!CLEANUP_UI) return;
  if (!object(root.data)) return;
  const allowed = new Set(JQ_CONFIG.poiAllowed);
  const refs = list => list.filter(v => typeof v !== 'string' || allowed.has(v));
  if (object(root.data.regions)) for (const k of Object.keys(root.data.regions)) {
    if (Array.isArray(root.data.regions[k])) root.data.regions[k] = refs(root.data.regions[k]);
  }
  if (object(root.data.modules)) for (const k of Object.keys(root.data.modules)) {
    if (!allowed.has(k)) delete root.data.modules[k];
  }
  array(root, 'data.meta.half_hidden_modules', refs);
  delKeys(at(root, 'data.modules.baseInfo.data.user'), ['userLocRgeo','homeInfo','companyInfo']);
  const kept = list => list.some(v => typeof v === 'string' && allowed.has(v));
  array(root, 'data.modules.anchor.data.items', xs => xs.filter(x => object(x) && Array.isArray(x.anchor) && kept(x.anchor)));
  array(root, 'data.modules.poiDetailCommonConfig.data.swipeUpPanelConfig.swipeUpPanelTextList', xs => xs.filter(x => !object(x) || !Array.isArray(x.modulesMap) || kept(x.modulesMap)));
}
function amapJq(root, jq) {
  if (!CLEANUP_UI) {
    if (jq.includes('.tip_list')) array(root,'tip_list',xs=>xs.filter(x=>at(x,'tip.task_tag')!=='ad'));
    return;
  }
  if (jq.includes('MineNewFootprintCard')) {
    delKeys(root.data, ['tipData','wallet']);
    array(root, 'data.cardList', xs => xs.filter(x => ['MineNewFootprintCard','MineNewBEntranceCardV4'].includes(at(x,'dataKey'))));
    const cards = at(root, 'data.cardList');
    if (Array.isArray(cards)) for (const card of cards) if (card?.dataKey === 'MineNewBEntranceCardV4') {
      array(card, 'content.entranceList_1', xs => xs.filter(x => [7,8,10,17].includes(at(x,'id'))));
      array(card, 'content.entranceList_2', xs => xs.filter(x => [32,4,9,16,14].includes(at(x,'id'))));
    }
  } else if (jq.includes('toolsRecommend.data.default')) {
    array(root, 'data.toolsRecommend.data.default', xs => xs.filter(x => [102,103,106,151].includes(at(x,'id'))));
  } else if (jq.includes('.data.category')) {
    const categories = at(root, 'data.category');
    if (Array.isArray(categories)) for (const c of categories) if (object(c) && Array.isArray(c.tools)) {
      for (const tool of c.tools) if (object(tool)) delete tool.tips;
      c.tools = c.tools.filter(x => !object(x) || ![547,'547'].includes(x.id));
    }
  } else if (jq.includes('quickLink.data.list')) {
    const list = at(root,'data.modules.quickLink.data.list');
    if (Array.isArray(list)) for (const x of list) if (object(x) && object(x.badge) && Object.prototype.hasOwnProperty.call(x.badge,'text')) x.badge.text = '';
  } else if (jq.includes('kingToolSort')) {
    const ids = ['dache_toolbox_GDIntercity','dache_toolbox_hitch','dache_toolbox_chauffeur','dache_toolbox_quality','dache_toolbox_charterCar'];
    const list = at(root,'data.lubanData.kingToolSort.dataList');
    if (Array.isArray(list)) for (const x of list) if (object(x) && object(x.biz) && Array.isArray(x.biz.kingToolIdList)) x.biz.kingToolIdList = x.biz.kingToolIdList.filter(v => ids.includes(v));
    array(root,'data.lubanData.kingToolBox.dataList', xs => xs.filter(x => object(x) && object(x.biz) && ids.includes(x.biz.id)));
  } else if (jq.includes('categoryId')) {
    array(root,'data.dataList', xs => xs.filter(x => object(x) && (Object.prototype.hasOwnProperty.call(x,'categoryId') || at(x,'data.id') === 'M_100007')));
  } else if (jq.includes('shadingWords.data.regions')) {
    array(root,'data.shadingWords.data.regions.content', xs => xs.filter(x => ['quickLink','history','searchFind'].includes(x)));
    const modules = at(root,'data.shadingWords.data.modules');
    if (object(modules)) for (const k of Object.keys(modules)) if (k !== 'searchFind') delete modules[k];
  } else if (jq.includes('.tip_list')) {
    array(root,'tip_list', xs => xs.filter(x => ['common_content_general','sp'].includes(at(x,'tip.task_tag'))));
  } else throw new Error('Unconverted Amap JQ');
}
function transform(url, root) {
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
