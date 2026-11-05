/*
 * Anywhere-native UMP response processor.
 * Parses UMP frames; authenticated AES-CTR+HMAC encrypted frames are decrypted
 * using the stored YouTube client key; edits known Player/Shorts protobuf fields;
 * repacks and authenticates modified frames. Unknown formats pass through.
 * This is deliberately bounded to protect the shared JavaScript runtime.
 */
function process(ctx) {
  AP.trace('UMP entered phase='+ctx.phase+' status='+ctx.status+' bytes='+(ctx.body?.length||0));
  if(ctx.phase!=='response'||ctx.status!==200||!ctx.body.length)return;
  if(!AP.media(ctx)){AP.trace('UMP skip: content-type not yt-ump');return;}
  if(!AP.bool('enable_ump',false)){AP.trace('UMP skip: enable_ump is off');return;}
  try{
    const MAX=256*1024;
    if(ctx.body.length>MAX){AP.trace('UMP skip: body exceeds 256 KiB safety limit');return;}
    const keyConfig=AP.config()[AP.client(ctx)];
    if(!keyConfig?.clientKey){AP.trace('UMP skip: clientKey missing; check config/log_event key logs');return;}
    const keys=[keyConfig,...(keyConfig.previous||[])].slice(0,4)
      .map(item=>AP.b64.decode(item.clientKey||'')).filter(x=>x.length>=16);
    if(!keys.length){AP.trace('UMP skip: no valid decoded clientKey');return;}
    const bytes=x=>x instanceof Uint8Array?x:new Uint8Array(x);
    const cat=(...xs)=>{const out=new Uint8Array(xs.reduce((n,x)=>n+x.length,0));let offset=0;for(const x of xs){out.set(x,offset);offset+=x.length;}return out;};
    const constantEq=(a,b)=>{if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a[i]^b[i];return r===0;};
    // AES-128 block encryption for CTR. No Surge crypto or browser WebCrypto.
    function multiply(a,b){let r=0;for(let i=0;i<8;i++){if(b&1)r^=a;a=(a<<1)^((a&128)?0x11b:0);b>>=1;}return r;}
    function makeAES(key){
      const sbox=Uint8Array.from([
        99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,
        202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,
        183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,
        4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,
        9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,
        83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,
        208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,
        81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,
        205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,
        96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,
        224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,
        231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,
        186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,
        112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,
        225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,
        140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22
      ]);
      const roundKeys=new Uint8Array(176);roundKeys.set(key.subarray(0,16));
      const rcon=[0,1,2,4,8,16,32,64,128,27,54];
      for(let i=16;i<176;i+=4){const tmp=Array.from(roundKeys.subarray(i-4,i));
        if(i%16===0){tmp.push(tmp.shift());for(let k=0;k<4;k++)tmp[k]=sbox[tmp[k]];tmp[0]^=rcon[i/16];}
        for(let k=0;k<4;k++)roundKeys[i+k]=roundKeys[i-16+k]^tmp[k];
      }
      function aesBlock(input){
        const state=Uint8Array.from(input);
        const add=(r)=>{for(let i=0;i<16;i++)state[i]^=roundKeys[r*16+i];};
        add(0);
        for(let r=1;r<=10;r++){
          for(let i=0;i<16;i++)state[i]=sbox[state[i]];
          for(let row=1;row<4;row++){
            const line=[state[row],state[row+4],state[row+8],state[row+12]];
            for(let col=0;col<4;col++)state[row+4*col]=line[(col+row)%4];
          }
          if(r<10)for(let c=0;c<4;c++){
            const k=4*c,a=state[k],b=state[k+1],d=state[k+2],e=state[k+3];
            state[k]=multiply(a,2)^multiply(b,3)^d^e;
            state[k+1]=a^multiply(b,2)^multiply(d,3)^e;
            state[k+2]=a^b^multiply(d,2)^multiply(e,3);
            state[k+3]=multiply(a,3)^b^d^multiply(e,2);
          }
          add(r);
        }
        return state;
      }
      return aesBlock;
    }
    function ctr(key,iv,input){
      const block=makeAES(key.subarray(0,16)),counter=Uint8Array.from(iv),out=new Uint8Array(input.length);
      for(let i=0;i<input.length;i+=16){
        const mask=block(counter);
        for(let j=0;j<16&&i+j<input.length;j++)out[i+j]=input[i+j]^mask[j];
        for(let j=15;j>=0;j--){counter[j]=(counter[j]+1)&255;if(counter[j]!==0)break;}
      }
      return out;
    }
    function signature(fullKey,cipher,iv){return Anywhere.crypto.hmacSHA256(fullKey.subarray(16),cat(cipher,iv));}
    function decodeEnvelope(input){
      const f=AP.decode(input),cipher=AP.raw(f,1),mac=AP.raw(f,2),iv=AP.raw(f,3);
      const gzip=AP.val(f,4)||0;
      if(!cipher||mac?.length!==32||iv?.length!==16||gzip>1)return null;
      for(const key of keys){if(constantEq(signature(key,cipher,iv),mac))return{fields:f,iv,key,plain:ctr(key,iv,cipher),gzip};}
      return null;
    }
    function setProtoNested(root,path,fn){
      if(!path.length)return fn(root);
      const n=path[0];let changed=false;
      for(const entry of AP.fields(root,n,2)){
        let sub;try{sub=AP.decode(entry.value);}catch{continue;}
        if(setProtoNested(sub,path.slice(1),fn)){entry.value=AP.encode(sub);changed=true;}
      }return changed;
    }
    function transform(player){
      let ch=false;
      if(AP.bool('block_ads',true)){
        for(const n of [7,61,68])ch=AP.drop(player,n)||ch;
        ch=setProtoNested(player,[9],track=>AP.drop(track,18))||ch;
      }
      return ch;
    }
    function editPlain(buf){
      const root=AP.decode(buf);let changed=false;
      // OnesieInnertubeResponse.contents field 4 -> WatchContent.player field 2.
      changed=setProtoNested(root,[4,2],transform)||changed;
      return changed?AP.encode(root):buf;
    }
    function editEnvelope(input){
      const env=decodeEnvelope(input);if(!env){AP.trace('UMP envelope skipped: unrecognized fields or HMAC/key mismatch');return input;}
      const compressed=env.gzip===1 || env.plain[0]===0x1f&&env.plain[1]===0x8b;
      if(env.gzip===1&&!compressed)return input;
      let original=compressed?Anywhere.codec.gzip.decode(env.plain):env.plain;
      if(original.length>MAX)return input;
      const edited=editPlain(original);
      if(AP.eq(edited,original))return input;
      const output=compressed?Anywhere.codec.gzip.encode(edited):edited;
      const cipher=ctr(env.key,env.iv,output);
      AP.set(env.fields,1,2,cipher);AP.set(env.fields,2,2,signature(env.key,cipher,env.iv));
      return AP.encode(env.fields);
    }
    // UMP header integer: 1–5 bytes, first byte embeds the byte count.
    function readVar(buf,pos){
      if(pos>=buf.length)throw Error('truncated UMP');const x=buf[pos++];
      let length=5;for(let i=1;i<5;i++)if(!(x&(128>>(i-1)))){length=i;break;}
      let bits=length===5?0:8-length, value=length===5?0:x&((1<<bits)-1);
      for(let i=1;i<length;i++,bits+=8){if(pos>=buf.length)throw Error('truncated UMP');value+=buf[pos++]*2**bits;}
      if(value>4294967295)throw Error('UMP overflow');return{value,pos};
    }
    function writeVar(x){
      if(!Number.isInteger(x)||x<0||x>4294967295)throw Error('invalid UMP integer');
      const size=x<128?1:x<16384?2:x<2097152?3:x<268435456?4:5;
      const out=new Uint8Array(size);
      out[0]=size===1?x:size===5?240:256-(256>>(size-1))|(x&((1<<(8-size))-1));
      for(let i=1,bits=size===5?0:8-size;i<size;i++,bits+=8)out[i]=Math.floor(x/2**bits)&255;
      return out;
    }
    let pos=0,isEncrypted=false,changed=false,envelopeCount=0;const chunks=[];
    while(pos<ctx.body.length){
      const start=pos,t=readVar(ctx.body,pos);pos=t.pos;const l=readVar(ctx.body,pos);pos=l.pos;
      if(l.value>ctx.body.length-pos)throw Error('bad UMP length');
      const data=ctx.body.subarray(pos,pos+l.value);pos+=l.value;
      if(t.value===10){const marker=AP.decode(data);isEncrypted=AP.val(marker,1)===25;}
      let updated=data;
      if(t.value===11&&isEncrypted){envelopeCount++;updated=editEnvelope(data);isEncrypted=false;}
      if(updated!==data&&!AP.eq(updated,data)){
        chunks.push(writeVar(t.value),writeVar(updated.length),updated);changed=true;
      }else chunks.push(ctx.body.subarray(start,pos));
    }
    if(changed)ctx.body=cat(...chunks);
    AP.trace('UMP finished envelopes='+envelopeCount+' changed='+changed);
  }catch(e){AP.log('UMP passthrough: '+e);}
}
