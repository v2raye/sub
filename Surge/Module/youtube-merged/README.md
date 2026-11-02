# YouTube Enhance + Hide Shorts（Surge iOS 6）

## 安装

在 Surge → 模块 → 安装新模块中添加：

https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/YouTube-Enhance-HideShorts.sgmodule

开启模块、URL Rewrite、脚本及 MITM；安装并在 iOS 设置中完全信任 Surge 的 MITM CA 证书。停止使用原先的 YouTube 模块，包括本仓库已有的 YouTube.sgmodule，避免匹配冲突。重新启动 YouTube App。无需在手机保存脚本文件夹。

## 合并说明

- 基于 gholts 的 response/request/key/ump 四份脚本快照；它们通过 YouTubeConfig 持久存储共享密钥与清晰度信息，应配套更新。
- API 响应仅运行统一 response.js，避免 Surge 每个响应只运行首个匹配脚本的问题。
- 保留 Enhance 的广告处理、后台播放、PiP、最高 4x、自动高清、Jump Ahead、商店/AI/游戏/竖屏直播过滤、On-the-go 控件等处理。实际可用性取决于 YouTube 版本、账号及地区；不解锁 Premium 授权。
- 移植 Aioneas 的 /shorts(?!_pivot_item)/ EML 过滤，默认同时隐藏 Shorts 入口。block_shorts=false 可关闭 EML 和入口隐藏；Shorts 广告处理仍保留。
- 合并 reel_watch_sequence：过滤明确广告条目，并保留 Aioneas 对缺少 overlay 条目的过滤。后者与原模块一样可能受 YouTube 协议变化影响。
- 保留 Aioneas 的 ctier 302 重写、oad 空响应、广告统计/pagead/ptracking/qoe 空响应；pagead 与 stats/ads 的重复 reject 合并为 Map Local 的 200 空响应。pcs 的 reject 单独保留。
- MITM 合并并保留 redirector 排除项。没有额外添加全域名解密。
- Aioneas 原配置 lyricLang=off、captionLang=off、blockImmersive=false、debug=false；这些未启用功能没有新增开关。
- 脚本为已审阅快照，不自动跟随上游；模块会从本仓库 Raw 下载脚本并由 Surge 缓存。四份脚本没有运行时 import/require 或远程代码加载。

## 验证与限制

已检查四份脚本的 JavaScript 语法；用合成 Protobuf 测试 Shorts EML 开关、pivot 排除、普通卡片保留，以及 reel overlay / isAd 条件。已检查模块参数、脚本引用和同类型规则匹配互斥性。

尚未在 Surge iOS 真机导入或实时 YouTube 流量上测试，不能据此保证每个 App 版本均生效。若播放异常，可先关闭 auto_hd 或停用模块定位问题。max-size=-1 和二进制响应处理沿用上游，较大响应可能增加内存占用。

## 来源与署名

- https://github.com/gholts/surge/blob/main/modules/youtube-enhance.sgmodule
- https://github.com/gholts/surge/tree/main/scripts/youtube
- https://github.com/Aioneas/Surge/blob/main/Module/youtube.aioneas.hide-shorts.sgmodule
- https://github.com/Aioneas/Surge/blob/main/Script/youtube.response.js

上游署名：DivineEngine、app2smile、Maasea、ddgksf2013、gholts、Aioneas。Enhance 模块注明基于 Maasea Apache-2.0 代码；脚本内已有的第三方许可注释保持原样。本合并不替其他作者声明新的许可。

修改日期：2026-11-02。response.js 修改了 EML Shorts 判断和 reel 条目过滤；其他三份脚本保持下载时内容。
