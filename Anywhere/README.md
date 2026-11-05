# Anywhere / YouTube Enhance + Hide Shorts

本目录专门保存 **Anywhere 原生 `.amod` 模块与 JavaScript**。此实现按 [NodePassProject/Anywhere](https://github.com/NodePassProject/Anywhere) 的官方规则格式重新编写；**没有运行 Surge 脚本、没有兼容 `$request`/`$response`/`$done`，也没有远程 `script-path`**。

原始功能需求参考仓库 `Surge/Module/YouTube-Enhance-HideShorts.sgmodule`，但脚本逻辑是按 Anywhere `process(ctx)`、`Anywhere.codec.protobuf`、`Anywhere.store`、`Anywhere.crypto` 原生接口重写，不是将原 Surge 代码包一层适配器。

## 目录

```text
Anywhere/
├── YouTube-Enhance-HideShorts.amod                    # 推荐：默认稳定版，未挂载 UMP 缓冲脚本
├── YouTube-Enhance-HideShorts-UMP-Experimental.amod   # 实验版：包含加密 UMP 脚本
├── scripts/
│   ├── core.js            # Anywhere 原生 Protobuf 和持久化工具
│   ├── request.js         # 广告请求空响应、可选画质提示
│   ├── response.js        # 已知 Player/Shorts/UI 字段处理
│   ├── key.js             # Protobuf 客户端密钥提取及持久化
│   └── ump.js             # UMP 帧解析、AES-CTR/HMAC、再编码（实验）
├── dist/
│   ├── youtube-request.js # 内含 core.js，直接可被 Anywhere 运行
│   ├── youtube-response.js
│   ├── youtube-key.js
│   └── youtube-ump.js
├── tests/
│   └── test_native.cjs    # 合成 Protobuf、AES-CTR/HMAC 验证（Node.js）
└── build.py               # 将源码编码为 Anywhere 接受的 Base64 内嵌 JS
```

## 安装

在 Anywhere 的 **Modules（模块）** 中，选择 **从文件导入**（或从 `.amod` URL 订阅）：

- **推荐：** `YouTube-Enhance-HideShorts.amod`
- **实验：** `YouTube-Enhance-HideShorts-UMP-Experimental.amod`

**不要同时启用两份模块**，两者有相同的 MITM hostname 匹配，会相互覆盖。订阅地址应为能够返回 `text/plain`/UTF-8 内容并以 `.amod` 结尾的 URL，例如将仓库文件推送后使用：

```
https://raw.githubusercontent.com/v2raye/sub/main/Anywhere/YouTube-Enhance-HideShorts.amod
```

该 URL **只有推送到仓库以后才会有效**。在 GitHub 提交成功前先用本地文件导入。

进入 Anywhere 开启 MITM 总开关并安装、完全信任 Anywhere 根证书。系统和 App 如果启用了证书固定，MITM 可能失败。也需确认 YouTube 流量实际经过 Anywhere 的 HTTP(S) 解密路径；QUIC 流量不保证能进入 TLS MITM。

## 功能边界（不要混淆测试与实机）

| 功能 | 原生脚本实现 | 说明 |
|---|---|---|
| `/player/ad_break` | 是 | 生成空 Protobuf 响应 |
| 广告统计 / `pagead` / `ptracking` | 是 | 按精确路径生成空响应 |
| `&ctier=L...` | 是 | Anywhere 原生透明 URL rewrite；限定 googlevideo.com |
| Player `adPlacements`/`adSlots`/`paidPromotion` | 是 | Schema-free Protobuf 删除已知字段 |
| Player 背景播放 / PiP 标志 | 是 | 仅修改客户端可见 Protobuf，不提供账户授权 |
| 最高 4x 播放速度 | 是 | 调整已知 `maximumPlaybackRate` 字段 |
| Shorts 入口和 EML 卡片 | 部分 | 移除已知 FEshorts / Shorts EML 条目，保留 Shorts Pivot |
| Shorts reel 广告 | 是 | 移除明确标记 `isAd=true` 的条目 |
| Upload 入口 | 部分 | 已知 `FEuploads` Guide 条目 |
| 游戏 / 竖屏直播 / 商店 / AI 卡片 | 部分 | 已知字段和 EML 标记启发式，存在漏网情况 |
| Jump Ahead | 部分 | 仅修改已出现的 SmartSkip 控件，不保证生成按键 |
| 自动高清 | 实验 | 默认关闭，仅增加客户端请求画质提示；不会创建不可用格式 |
| On-the-go 控件 | 未实现 | 无已验证的稳定 Anywhere 原生 Protobuf 构建规则 |
| UMP 加密播放初始化响应 | 实验 | 仅在 **UMP 实验版**启用；解析 UMP、验证 HMAC、AES-CTR，修改已知 Player 广告字段后重签名 |
| Premium 订阅权益 | 不支持 | 无法通过本地响应改写获得服务端授权 |

**重要限制：** Anywhere 的 `script` 对请求/响应缓冲上限为 **4 MiB**。超过限制的 chunked 流量可能直接失败；普通稳定版不加载 UMP 响应脚本，降低视频播放中断风险。实验性 UMP 脚本只处理 **256 KiB 内**的数据，但其规则被匹配时仍遵守 Anywhere 全局 4 MiB 缓冲约束。因此，不建议在主力设备上启用 UMP 实验版。

不同 YouTube App 版本返回的 Protobuf 标签可能发生变化。实机出现播放器卡住、视频失败或加载循环时，首先停用 UMP 实验版，并暂时关闭 `auto_hd`。

## 选项

模块提供 Anywhere 原生 `[Parameter]` 选择器（`true` / `false`）：

- `block_ads`, `block_shorts`, `block_upload`: 默认 `true`
- `block_games`, `block_store`, `block_ai`, `jump_ahead`: 默认 `true`；不是所有场景都实现
- `block_vertical_live`: 默认 `false`
- `auto_hd`: 默认 `false`
- `enable_ump`: 仅实验模块，默认 `true`

> Anywhere 不能直接写入 Surge `#!arguments`、`[Script]`、`[URL Rewrite]`、`[Map Local]`、`[MITM]` 组合。已转换为 `.amod` 的 `[Module]` / `[Routing]` / `[MITM]` / `[Parameter]` 与原生规则行。JS `process(ctx)` 被 **Base64 嵌入**模块中，这符合官方导入格式，并不影响仓库中保留可编辑的原始 `.js` 文件。

## 开发和验证

编辑 `scripts/` 后在本目录执行：

```bash
python3 build.py
node tests/test_native.cjs
```

`build.py` 会更新两份 `.amod` 和 `dist/` 中自包含脚本。`tests/test_native.cjs` 是独立 JavaScript Protobuf/加密合成测试，不代表已在 iOS 真机实测。

## 来源及许可提示

功能需求参考 `v2raye/sub` 自有 Surge 模块及其 README 列出的上游作者（gholts、Maasea、DivineEngine、app2smile、ddgksf2013、Aioneas）。本目录中的原生处理逻辑单独编写；对上游工具、商标与协议的使用仍应遵守各自许可和服务条款。没有声明已解锁 YouTube Premium。

官方格式参考：
- [Anywhere Module](https://github.com/NodePassProject/Anywhere/blob/main/Documentations/Module.md)
- [Anywhere MITM](https://github.com/NodePassProject/Anywhere/blob/main/Documentations/MITM.md)
- [Anywhere Routing](https://github.com/NodePassProject/Anywhere/blob/main/Documentations/Routing.md)

## 真机排查版 r2

两版新增 diagnostics 参数，此次排查版均默认 true。更新订阅并重连后播放视频，在 Anywhere 日志中搜索 `[YouTube/diag r2]`。

- 完全没有命中日志：先检查模块/MITM 开关、证书信任、是否有其他规则抢先命中、流量是否走 HTTP/3。源码已下载不能证明规则实际运行。
- `UMP skip: clientKey missing`：key 提取路径尚未取得解密密钥。
- `body exceeds 256 KiB`：触发保守安全限制。不要为了命中而直接取消上限，客户端仍有全局缓冲限制。
- `HMAC/key mismatch`：密钥或实际响应结构不匹配。
- `envelopes=0`：未识别出预期的加密 UMP 帧。
- `changed=false`：本次没有改动已支持的 Player 广告字段，不代表实际响应没有广告。

新增诊断只记录阶段、接口路径（无查询参数）、状态、大小和判断结果，不输出密钥及响应正文。它不新增网络上报。实验版目前仍未实现 UMP Next Shorts 过滤，原有 Shorts 过滤也有已知漏删；此版本用于定位，不能当作真机问题已经修复。排查完成后关闭 diagnostics。
