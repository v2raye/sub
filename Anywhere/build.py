#!/usr/bin/env python3
"""Build self-contained Anywhere-native full protocol ports. No remote script URLs."""
import base64,csv,hashlib,io
from pathlib import Path
ROOT=Path(__file__).resolve().parent
DIST=ROOT/'dist';DIST.mkdir(exist_ok=True)
core=(ROOT/'scripts/core.js').read_text();sources={}
for name in ('request','response','key','ump'):
 code=core+'\n'+(ROOT/'scripts'/f'{name}.js').read_text();(DIST/f'youtube-{name}.js').write_text(code);sources[name]=base64.b64encode(code.encode()).decode()
def row(*fields):
 f=io.StringIO();csv.writer(f,lineterminator='').writerow(fields);return f.getvalue()
request=r'^https?://(?:youtubei\.googleapis\.com/youtubei/v1/(?:player/ad_break|log_event)(?:\?.*)?$|(?:www|s)\.youtube\.com/(?:pcs/|api/stats/(?:ads|qoe)|pagead|ptracking)|[\w-]+\.googlevideo\.com/(?:initplayback|videoplayback|dclk_video_ads|[^?]+\?.*oad))'
response=r'^https://youtubei\.googleapis\.com/youtubei/v1/(?:navigation/resolve_url|browse|next|player|search|reel/reel_watch_sequence|guide|account/get_setting|get_watch)(?:\?.*)?$'
key=r'^https://youtubei\.googleapis\.com/youtubei/v1/(?:config|log_event)(?:\?.*)?$'
ump=r'^https?://[\w-]+\.googlevideo\.com/initplayback(?:\?.*)?$'
opts=[('block_shorts','Hide Shorts','true'),('block_upload','Hide uploads','true'),('auto_hd','Auto HD','true'),('block_games','Hide games','true'),('block_vertical_live','Hide vertical live','false'),('jump_ahead','Jump Ahead','true'),('block_store','Hide stores','true'),('block_ai','Hide AI','true'),('on_the_go','On-the-go controls','true'),('enable_ump','UMP processing','true'),('diagnostics','Diagnostic logging','true')]
def build(filename,label,with_ump=True):
 lines=['# Full YouTube protocol port r3. See README for native platform differences.','[Module]','category = YouTube',f'name = YouTube Enhance + Hide Shorts (Anywhere {label})','description = Full Surge protocol engine port; native Anywhere lifecycle; UMP buffers up to the app limit.','[Routing]','name = YouTube Routing','routing = 0',*[f'2, {h}' for h in ('youtube.com','youtu.be','youtube-nocookie.com','googlevideo.com','youtubei.googleapis.com','ytimg.com')],'[MITM]','name = YouTube Native MITM','hostname = youtubei.googleapis.com, googlevideo.com, www.youtube.com, s.youtube.com','# Anywhere ctx headers are immutable: always remove cached-config hash on log_event to request fresh keys.',row(0,2,r'^https://youtubei\.googleapis\.com/youtubei/v1/log_event(?:\?.*)?$','x-youtube-hot-hash-data'),row(0,100,request,sources['request']),row(0,0,r'^https?://www\.youtube\.com/pcs/',2),row(0,0,r'(^https?://[\w-]+\.googlevideo\.com/(?!(?:dclk_video_ads|initplayback(?:\?|$))).+?)&ctier=L(&.+?),ctier,(.+)',1,'$1$2$3'),row(1,100,key,sources['key']),row(1,100,response,sources['response'])]
 if with_ump:lines.append(row(1,100,ump,sources['ump']))
 lines.append('[Parameter]')
 lines.append(row(1,0,'client_flavor','Client','Select YouTube or YouTube Music; response headers do not include request UA','youtube','[youtube, youtubeMusic]'))
 for name,label,default in opts:
  if not with_ump and name=='enable_ump':continue
  lines.append(row(1,0,name,label,'true or false',default,'[true, false]'))
 path=ROOT/filename;path.write_text('\n'.join(lines)+'\n');assert path.stat().st_size<900000;print(filename,path.stat().st_size)
build('YouTube-Enhance-HideShorts.amod','Full')
build('YouTube-Enhance-HideShorts-UMP-Experimental.amod','Full UMP')
build('YouTube-Enhance-HideShorts-NoUMP.amod','No UMP',False)
