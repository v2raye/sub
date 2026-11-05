#!/usr/bin/env python3
"""Package Anywhere-native YouTube scripts into an importable .amod file.

No Surge runtime, imports or script-path URLs are required. The build source
lives under Anywhere/scripts/; distributable standalone JS under Anywhere/dist/.
"""
from __future__ import annotations
import base64
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "scripts"
DIST = ROOT / "dist"
DIST.mkdir(exist_ok=True)
TARGET = ROOT / "YouTube-Enhance-HideShorts.amod"
UMP_TARGET = ROOT / "YouTube-Enhance-HideShorts-UMP-Experimental.amod"

CORE = (SRC / "core.js").read_text(encoding="utf-8")
SCRIPTS = {}
for name in ("request", "response", "key", "ump"):
    text = CORE + "\n" + (SRC / f"{name}.js").read_text(encoding="utf-8")
    (DIST / f"youtube-{name}.js").write_text(text, encoding="utf-8")
    SCRIPTS[name] = base64.b64encode(text.encode("utf-8")).decode("ascii")

# All patterns match the originating absolute URL. Every script is self-contained.
# Only one script of a given phase will be invoked per message.
request_pattern = r"^https?://(?:youtubei\.googleapis\.com/youtubei/v1/(?:player/ad_break|log_event)(?:\?|$)|(?:www|s)\.youtube\.com/(?:pcs/|api/stats/(?:ads|qoe)|pagead|ptracking)|[\w-]+\.googlevideo\.com/(?:initplayback|videoplayback|dclk_video_ads|[^?]+\?.*oad))"
response_pattern = r"^https://youtubei\.googleapis\.com/youtubei/v1/(?:navigation/resolve_url|browse|next|player|search|reel/reel_watch_sequence|guide|account/get_setting|get_watch)(?:\?|$)"
key_pattern = r"^https://youtubei\.googleapis\.com/youtubei/v1/(?:config|log_event)(?:\?|$)"
ump_pattern = r"^https?://[\w-]+\.googlevideo\.com/initplayback(?:\?|$)"

header = '''# Anywhere native YouTube module — built from Anywhere/scripts/ using build.py
# Surge runtime and script-path syntax are intentionally NOT used.
# Features depend on live YouTube protocol and MITM compatibility.
[Module]
name = YouTube Enhance + Hide Shorts (Anywhere)
description = Native YouTube Protobuf UI cleanup and ads filtering; UMP streaming is intentionally excluded; no Premium entitlement.

[Routing]
name = YouTube Routing
routing = 0
2, youtube.com
2, youtu.be
2, youtube-nocookie.com
2, googlevideo.com
2, youtubei.googleapis.com
2, ytimg.com

[MITM]
name = YouTube Native MITM
# Suffixes only: Anywhere does not implement Surge's -redirector*.googlevideo.com exclusion.
hostname = youtubei.googleapis.com, googlevideo.com, www.youtube.com, s.youtube.com

# Ads and upload stats: return empty data; request quality hints are opt-in.
'''

lines = [
    f"0, 100, {request_pattern}, {SCRIPTS['request']}",
    "# Native transparent URL rewrite: strip ad ctier segment on eligible CDN requests",
    r'0, 0, "^(https?://[\w-]+\.googlevideo\.com/(?!dclk_video_ads|initplayback(?:\?|$)).+?)&ctier=L(&.+?),ctier,(.+)$", 0, $1$2$3',
    "# Independent non-overlapping response scripts; source is in Anywhere/scripts/",
    f"1, 100, {key_pattern}, {SCRIPTS['key']}",
    f"1, 100, {response_pattern}, {SCRIPTS['response']}",
    "",
    "[Parameter]",
]
for key, label, default, description in [
    ("diagnostics", "Diagnostic logging", "true", "Log matched endpoints and skip reasons; no query strings or key values"),
    ("block_ads", "Block ads", "true", "Remove known ad placements and synthetic ad endpoints"),
    ("block_shorts", "Hide Shorts", "true", "Hide identified Shorts tabs, cards and ad reel entries"),
    ("block_upload", "Hide uploads", "true", "Hide upload guide entries"),
    ("auto_hd", "Quality hint", "false", "Experimental quality hint; never invent Premium bitrate"),
    ("block_games", "Hide games", "true", "Remove identified Playables shelf markers"),
    ("block_vertical_live", "Hide vertical live", "false", "Remove identified vertical live shelf markers"),
    ("jump_ahead", "Jump ahead", "true", "Adjust existing SmartSkip controls only; needs compatible UI"),
    ("block_store", "Hide stores", "true", "Remove known shopping fields and shelf markers"),
    ("block_ai", "Hide AI controls", "true", "Remove identified AI summary and Ask-AI card markers"),
]:
    lines.append(f'1, 0, {key}, {label}, {description}., {default}, "[true, false]"')
TARGET.write_text(header + "\n".join(lines) + "\n", encoding="utf-8")

# UMP is deliberately in a separately importable module variant. A buffered
# script rule can break chunked video streams beyond Anywhere's hard 4 MiB cap,
# even if the JS function immediately returns. Do not install both variants.
experimental = lines[:lines.index('[Parameter]')]
experimental.append(f"1, 100, {ump_pattern}, {SCRIPTS['ump']}")
experimental.append('[Parameter]')
experimental.extend(lines[lines.index('[Parameter]')+1:])
experimental.append('1, 0, enable_ump, UMP response processing, Experimental encrypted UMP editing up to 256 KiB., true, "[true, false]"')
UMP_TARGET.write_text(header.replace('YouTube Enhance + Hide Shorts (Anywhere)\n', 'YouTube Enhance + Hide Shorts (Anywhere UMP)\n').replace('UMP streaming is intentionally excluded', 'UMP streaming editing is experimental and may interrupt playback') + "\n".join(experimental) + "\n", encoding="utf-8")

for target in (TARGET,UMP_TARGET):
    assert target.stat().st_size < 900_000, "Module may exceed Anywhere sync budget"
    print(f"Created {target.relative_to(ROOT)} ({target.stat().st_size:,} bytes)")
assert all(len(x) < 512_000 for x in SCRIPTS.values())
for name in SCRIPTS:
    b = (DIST / f"youtube-{name}.js").read_bytes()
    print(f"  {name:9s} {len(b):7,d} bytes SHA256 {hashlib.sha256(b).hexdigest()[:16]}")
