# 五款 App 去广告（Surge 转换版）

从 fkingikelee/fkikelee 的 Loon 插件及其引用的 JS/JQ 转换，适用于 Surge iOS 6；仅完成静态与合成响应测试，尚未进行五款 App 的 iPhone 实测。

## 安装地址

在 Surge → 模块 → 安装新模块，分别粘贴需要的地址：

| App | 模块 |
|---|---|
| 京东 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/JD.sgmodule |
| 淘宝 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Taobao.sgmodule |
| 闲鱼 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Xianyu.sgmodule |
| 高德地图 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Amap.sgmodule |
| 汽车之家 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/AutoHome.sgmodule |

模块脚本位于 Surge/Module/scripts/，模块已引用对应的 GitHub Raw 地址，无需手工拷贝脚本。开启 Rewrite、Scripting、MITM，并安装和信任 Surge CA 证书；模块仅追加必要 MITM 主机，不覆盖证书。停用其他重复处理同一 App 接口的模块，避免响应脚本竞争。安装后结束对应 App 进程再打开；服务器变更或既有广告缓存仍可能使部分广告出现。

## 功能与范围

保留源插件现有的广告/推荐清理和页面精简范围：

- 京东：开屏、首页悬浮推广、我的/订单/物流页营销位，基本配置中的原有 HTTPDNS/监测开关处理。
- 淘宝：开屏图片/视频/活动及源规则中列出的广告接口、广告域名。源插件还包括其他阿里 App 共用接口，开启后可能同时影响相应广告/统计请求。
- 闲鱼：开屏、首页与搜索广告/推荐、同城、圈子、我的及订单页面原版精简。
- 高德：开屏、营销配置、搜索推荐、工具列表、打车营销、我的页与地点详情清理；包括原 JQ 的嵌套 JSON 字符串配置处理。
- 汽车之家：开屏和营销接口、直播浮窗、社区横幅、我的服务及二手车相关推广。

这是源插件页面精简策略的移植，并非“只删确定广告”的最小模式。例如闲鱼订单详情原规则只保留状态、地址、订单信息三类组件；高德我的页保留入口白名单。这可能减少正常推荐或业务入口；不需要相应精简时应关闭对应模块。不能承诺登录、支付、导航等所有版本和流程都无影响。

## 转换处理

1. Loon reject_dict(200) 转为 Surge Map Local，返回 HTTP 200 + JSON `{}`，不变成断连式拒绝。
2. 保留原域名/URL 拒绝规则；正则保留源规则大小写不敏感语义。
3. Loon response.json.delete/replace/jq/jq_file 转成自包含 Surge JavaScript，不在手机上下载或执行 jq，不需要 Loon、jq 或 Node。
4. 同一 App 的响应操作按源文件顺序合成一个调度脚本，避免 Surge 第一条响应脚本命中后阻止后续步骤。
5. MITM 使用 `%APPEND%`；补上淘宝图片规则引用、但源插件 MITM 漏写的 gw.alicdn.com。
6. 非 JSON、空响应、未知类型发生错误时保留原响应，不输出响应正文、Cookie、账号数据，也不调用通知、外发、持久化 API。
7. 保留原三份 JS 的主体处理；增加统一 JSON/异常保护，保证一次完成回调。移除汽车之家打印整条响应的日志；删除首个卡片时用 splice，避免 delete 数组元素形成 null 占位。
8. 高德/闲鱼仅在目标路径和数组存在、类型符合预期时改写，不在缺失字段处凭空生成空业务结构。嵌套 JSON 解析失败保留原字段；这与部分原 JQ 在异常输入下的报错/empty 语义不同。
9. 每条响应脚本使用 2 MiB 正文上限、5 秒执行超时。超过正文上限由 Surge 跳过脚本并透传；原版没有在这些声明中显式设置同一上限，因此不宣称对所有大小的响应完全等价。
10. 未额外加入追踪上报、签到、Cookie 捕获、会员权益修改、订阅或代理策略；未修改用户主配置。

## 验证

- 117 项合成响应/失败保护检查通过。其中包含全部内联 JQ 表达式的代表样例与 `/usr/bin/jq` 原表达式对照，高德两个完整 JQ 文件的代表性输入对照，以及京东/淘宝/汽车之家原 JS 的代表性响应对照。
- 每个响应源规则均检查了匹配 URL 下的异常结构处理；不是生产流量抓包回放。
- 五个 .sgmodule 文件通过 Surge 原生离线语言服务器的模块诊断，全部零诊断项。
- 五个模块内容分别装入最小测试 profile，经本机 Surge Mac 原生 `surge-cli --check` 返回 OK；尚未在 iPhone 实际导入测试。
- 上游 5 份 LPX、3 份 JS、2 份 JQ 的 Git blob 哈希与固定源提交一致。后续上游更新不会自动改变本次转换脚本，需要重新审查转换。

## 来源与致谢

上游固定提交：https://github.com/fkingikelee/fkikelee/commit/d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0

| App | 上游插件 | 原作者标注 |
|---|---|---|
| 京东 | lpx/JD_remove_ads.lpx | RuCu6、Maasea |
| 淘宝 | lpx/Taobao_remove_ads.lpx | RuCu6 |
| 闲鱼 | lpx/FleaMarket_remove_ads.lpx | 可莉 |
| 高德 | lpx/Amap_remove_ads.lpx | 可莉 |
| 汽车之家 | lpx/AutoHome_remove_ads.lpx | 可莉 |

JS/JQ 来自同一仓库 Resource/kelee/；京东、淘宝原 JS 另标注引用 RuCu6/QuanX。这里保留作者归属与来源，不宣称拥有上游作品版权，也不对上游授权作额外假定。

Surge 语义参考：[模块](https://manual.nssurge.com/profile/module.html)、[Map Local](https://manual.nssurge.com/http/map-local.html)、[响应脚本](https://manual.nssurge.com/scripting/http-response.html)。

## 2026-11-07 京东 / 闲鱼开屏兼容修复

上一版按原 Loon 源插件移植，通过样例测试不代表适配所有新版 App。本次针对用户反馈的开屏问题补足已确认的捕获缺口：

- 京东：捕获范围改为精确的 api.m.jd.com/client.action 接口，不再要求 functionId 位于 URL 首个参数。兼容明文 JSON、整体 Base64 JSON、JSON 字符串包装的 Base64；只在已知 functionId 或已有响应结构提供独立识别证据时处理。新旧 startup/start 入口兼容，无 functionId 时仅凭 images 字段不清空商品图片，开屏推断要求 showTimesDaily 等已知结构。无法识别的新协议继续原样放行，不将所有 client.action 请求拒绝。
- 闲鱼：新增 splash.async.ads 响应处理，保留响应业务信封及返回状态，只清空已知 adMap 广告字段；兼容相应接口的 goofish / taobao、acs / g-acs 主机以及 JSONP/明文/Base64 响应。已有同步开屏 Map Local 规则保留。
- 脚本 URL 版本参数变为 ?v=20261107-splash2；需在 Surge 中更新模块内容，才能拉取新地址。仅开关旧模块不会更新其匹配规则。更新后完全结束 App 进程再打开。
- 原 117 项回归测试和新增 71 项开屏样例测试均通过，合计 188 项；包含不改写无关商品图片、订单、认证响应的用例。两模块内容合入测试 profile 的原生校验通过。尚无用户真实开屏响应回放和 iPhone 实测，不能据此承诺所有开屏广告均已拦截。

兼容参考：[京东公开适配代码与记录](https://github.com/zbsdsb/loon-adblock-plugins)、[闲鱼异步开屏接口的公开记录](https://github.com/skernelx/SurgeScripts)。这些是外部适配证据，未据此推断用户确切 App 版本。未增加 Cookie 捕获、持久化记录、外发或正文日志。
