/*
 * Anywhere-native YouTube response transformer.
 * Edits known Protobuf fields without converting binary responses to JSON.
 * Unknown fields are preserved by Anywhere.codec.protobuf (schema-free wire codec).
 */
function process(ctx) {
  AP.trace('response '+AP.path(ctx)+' phase='+ctx.phase+' status='+ctx.status+' bytes='+(ctx.body?.length||0));
  if(ctx.phase!=='response'||ctx.status!==200||!ctx.body.length)return;
  const path=AP.path(ctx);
  if(!path.startsWith('/youtubei/v1/'))return;
  const endpoint=path.substring('/youtubei/v1/'.length);
  const cfg={
    blockAds:AP.bool('block_ads',true), blockShorts:AP.bool('block_shorts',true),
    blockUpload:AP.bool('block_upload',true),blockGames:AP.bool('block_games',true),
    blockVerticalLive:AP.bool('block_vertical_live',false),
    blockStore:AP.bool('block_store',true), blockAi:AP.bool('block_ai',true),
    jumpAhead:AP.bool('jump_ahead',true)
  };
  const marker=(v,re)=>re.test(AP.toText(v));
  function replaceChild(node,fieldNo,fn){return AP.mapNested(node,fieldNo,fn);}
  function ensureChild(node,fieldNo,fn){
    let f=AP.field(node,fieldNo,2),v=f?AP.decode(f.value):[];
    const changed=fn(v);if(changed)AP.set(node,fieldNo,2,AP.encode(v));return changed;
  }
  const setBool=(node,no,b)=>AP.set(node,no,0,b?1:0);
  function setPlayback(speed){
    let changed=false;
    changed=ensureChild(speed,1,s=>AP.set(s,2,0,400))||changed;
    return changed;
  }
  function player(p){
    let ch=false;
    if(cfg.blockAds){
      for(const n of [7,61,68])ch=AP.drop(p,n)||ch;
      ch=replaceChild(p,9,track=>AP.drop(track,18))||ch;
    }
    ch=replaceChild(p,15,setPlayback)||ch;
    ch=ensureChild(p,2,status=>{
      let changed=false;
      changed=ensureChild(status,21,pip=>ensureChild(pip,151635310,ability=>{
        let c=false;for(const [n,v] of [[1,1],[4,0],[6,0],[8,1]])c=AP.set(ability,n,0,v)||c;return c;
      }))||changed;
      changed=ensureChild(status,11,bg=>ensureChild(bg,64657230,ability=>setBool(ability,1,true)))||changed;
      return changed;
    })||ch;
    return ch;
  }
  function editSmartSkipButton(node) {
    let changed=false;
    changed=replaceChild(node,13,controller=>{
      const existing=AP.field(controller,7,0);
      return existing?AP.set(controller,7,0,0):false;
    })||changed;
    const limit=AP.field(node,17,0);
    if(limit)changed=AP.set(node,17,0,2147483647)||changed;
    changed=replaceChild(node,1,actions=>replaceChild(actions,3,item=>{
      return AP.field(item,9,0)?AP.set(item,9,0,2147483647):false;
    }))||changed;
    return changed;
  }
  function filterShortsEntries(node){
    let changed=false;
    // Repeated cards/shelves/tabs: drop only a targeted matching item, never the entire list.
    const candidateFields=new Set([1,2,4,5,6,9,10,32,33,42,50195462,51431404,51845067,58174010]);
    for(let idx=node.length-1;idx>=0;idx--){
      const e=node[idx];if(e.wire!==2||!candidateFields.has(e.field))continue;
      const siblings=AP.fields(node,e.field,2);
      if(siblings.length<2)continue;
      const txt=AP.toText(e.value);
      const isShort=cfg.blockShorts && /shorts(?!_pivot_item)[\w.-]*\.eml|FEshorts/i.test(txt)
        && !/shorts_pivot_item\.eml/i.test(txt);
      const isGame=cfg.blockGames && /playables[_./-]|game_shelf\.eml/i.test(txt);
      const isLive=cfg.blockVerticalLive && /vertical_live[_./-]|vertical_live_shelf\.eml/i.test(txt);
      const isStore=cfg.blockStore && /shopping_shelf\.eml|product_shelf\.eml/i.test(txt);
      const isAi=cfg.blockAi && /ai_summary\.eml|ask[_-]ai\.eml/i.test(txt);
      if(isShort||isGame||isLive||isStore||isAi){node.splice(idx,1);changed=true;}
    }
    return changed;
  }
  function scanContainers(node,depth=0,budget={left:3000}){
    if(depth>=10||budget.left--<=0)return false;
    let changed=false;
    changed=filterShortsEntries(node)||changed;
    if(cfg.blockStore) changed=AP.drop(node,1829)||changed; // ElementData.shoppingShelf
    if(cfg.blockAds){
      changed=AP.drop(node,454362329)||changed; // VideoContent.sponsoredVideo
      changed=AP.drop(node,491441836)||changed; // VideoContent.sponsoredDisplay
    }
    if(cfg.jumpAhead){
      changed=replaceChild(node,512694658,editSmartSkipButton)||changed;
    }
    // For nested protobuf messages, only descend if they appear structurally sound
    // and are under the size cap. Do not scan opaque encrypted/video bytes.
    for(const e of node){
      if(e.wire!==2||e.value.length<2||e.value.length>200000)continue;
      let child;
      try{child=AP.decode(e.value);if(!child.length||!AP.eq(AP.encode(child),e.value))continue;}
      catch{continue;}
      if(scanContainers(child,depth+1,budget)) {e.value=AP.encode(child);changed=true;}
    }
    return changed;
  }
  function shorts(sequence){
    let changed=false;
    for(let i=sequence.length-1;i>=0;i--){
      const e=sequence[i];if(e.field!==2||e.wire!==2)continue;
      const entry=AP.decode(e.value);
      const command=AP.sub(entry,1),reel=command&&AP.sub(command,139608561);
      const params=reel&&AP.sub(reel,16);
      if(params&&AP.val(params,1)===1){sequence.splice(i,1);changed=true;}
    }return changed;
  }
  function guide(root){
    if(!cfg.blockUpload&&!cfg.blockShorts)return false;
    let changed=false;
    for(let i=root.length-1;i>=0;i--){
      const e=root[i];if(e.wire!==2 || (e.field!==4&&e.field!==6))continue;
      const txt=AP.toText(e.value);
      if(cfg.blockShorts&&txt.includes('FEshorts')||cfg.blockUpload&&txt.includes('FEuploads')){
        // Only remove specific guide entries if the field's repeated list has peers.
        if(AP.fields(root,e.field,2).length>1){root.splice(i,1);changed=true;}
      }
    }
    return changed;
  }
  function response(root){
    let changed=false;
    switch(endpoint){
      case 'player':changed=player(root);break;
      case 'reel/reel_watch_sequence':changed=shorts(root);break;
      case 'guide':changed=guide(root);break;
      case 'browse':case 'next':case 'search':case 'navigation/resolve_url':
        changed=scanContainers(root);break;
      case 'get_watch':
        changed=scanContainers(root);
        // Server's Watch schema differs across app versions; avoid guessing nested Player tags.
        break;
      case 'account/get_setting':
        // Avoid inventing Premium-only settings that the account is not entitled to.
        break;
    }
    return changed;
  }
  try {
    const root=AP.decode(ctx.body);
    if(response(root)){ctx.body=AP.encode(root);AP.trace('response '+endpoint+' changed');}
    else AP.trace('response '+endpoint+' unchanged: no supported fields edited');
  } catch(e){AP.log('response passthrough '+endpoint+': '+e);}
}
