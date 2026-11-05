# Source snapshot

These four engines and the source module were read from v2raye/sub at commit 28ab42d2bb7737732bfe956af109362b2c38905f, under Surge/Module/youtube-merged/ and Surge/Module/YouTube-Enhance-HideShorts.sgmodule.

They derive from gholts/surge YouTube Enhance, based on Maasea (Apache-2.0 per upstream module), with Shorts EML and reel filtering adapted from Aioneas. Original internal third-party license comments remain in source. No new license is asserted over other authors' work.

Run python3 port.py then python3 build.py from Anywhere/ to regenerate native scripts and modules. The upstream/ sources are build-time references only; modules never fetch or execute them at runtime.
