# 五款 App 去广告（Surge iOS 6）

2026-11-07 审查修订版。默认过滤已适配的开屏与广告字段，保留正常业务入口；额外页面精简独立为 `cleanup_ui` 参数，默认 `false`。完成静态及合成响应测试，未完成 iPhone 真机或真实抓包回放验证。

## 安装与更新

Surge → 模块 → 安装新模块，按需添加：

| App | 模块地址 |
|---|---|
| 京东 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/JD.sgmodule |
| 淘宝 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Taobao.sgmodule |
| 闲鱼 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Xianyu.sgmodule |
| 高德地图 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Amap.sgmodule |
| 汽车之家 | https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/AutoHome.sgmodule |

脚本均在同仓库 `Surge/Module/scripts/`，无须手动下载。此次必须**更新模块内容**，使规则、参数和脚本地址一起更新到 `?v=20261107-audit1`；仅开关旧模块不会更新。开启 Rewrite、Scripting、MITM，并安装且信任 Surge CA。模块追加 hostname，不覆盖证书或主配置。更新后完全结束对应 App 再打开。避免同时启用处理相同接口的其他脚本模块。

模块参数 `cleanup_ui=false` 为默认模式；`true` 开启上游额外页面精简，会隐藏部分推荐、工具、订单组件、地点详情模块等正常功能。两种模式都保留已适配的开屏广告清理。不同 App 版本与未识别的新广告结构仍需实机确认。

## 本次发现与修复

| 范围 | 原问题 | 修复 |
|---|---|---|
| 共用 JSON 处理 | 改写广告字段时，JSON.parse 会使超出安全整数范围的订单/商品 ID 丢精度 | 保留不安全整数的原始数字字面量，覆盖整体 JSON、JSONP、Base64 及高德内嵌 JSON 字符串；不转成带引号的 ID |
| 京东 | 根部 `result` 元数据可能遮蔽 `data.images` 中真正的开屏数据；异常卡片可能影响整组处理 | 按已知结构选取 payload；增加数组和单条记录类型检查 |
| 淘宝 | 单条缺少 bizData 的记录可使整个开屏清理回退；把布尔/数值字段一律写成字符串 | 跳过异常单条记录，继续处理正常广告；保留已有布尔、数字、字符串类型 |
| 汽车之家 | 无条件删除卡片列表第一项；单条贷款推广导致整个服务分组删除 | 按明确广告标记移除卡片；仅过滤推广子项，保留同组正常服务和元数据 |
| 汽车之家规则 | mycardv6 请求直接被 Map Local 返回空 JSON，响应过滤无法执行 | 删除此请求空响应，交给响应脚本定点过滤 |
| 高德、闲鱼 | 入口/工具/订单/地点模块白名单可能删除新版正常功能 | 白名单精简只在 cleanup_ui=true 执行；默认保留未知入口、钱包、通勤地址和业务组件 |
| 请求阶段 | 推荐、AI 入口、洗车/经销商等接口被一律返回空 JSON；按尺寸匹配图片可能误伤正常图 | 区分明确广告与可选 UI；可选接口仅 cleanup_ui=true 返回合成响应，图片返回透明 GIF，不返回 JSON |
| 共用格式和错误保护 | 三份脚本只支持明文 JSON；错误响应可能被业务过滤器修改 | 五份统一支持明文/JSONP/Base64；非 2xx HTTP 和 MTOP FAIL 响应保持原文；异常、未知格式原样放行 |
| Base64 解码 | 构造整条正文的百分号编码临时字符串增加内存 | 改成 Uint8Array 加分块 UTF-8 解码，降低该临时字符串开销；不代表消除 iOS 内存限制 |

## 当前处理范围

- 京东：start/startup 开屏、已知营销楼层、物流及订单推广、源插件 basicConfig 开关。工具排序、评价提醒、关注/常购等精简默认关闭。
- 淘宝：已知开屏图片/视频配置和广告接口；上游域名拒绝仍保留。按图片尺寸拦截与部分活动/二楼入口精简默认关闭。
- 闲鱼：同步开屏 Map Local、异步开屏 adMap（acs/g-acs、goofish/taobao 四个主机）、已知 mamaAD/banner/ads 卡片及搜索广告。订单组件与个人工具白名单默认关闭。
- 高德：已知开屏/营销接口、明确广告配置及横幅、搜索明确 ad 标记。正常钱包、工具、打车功能、POI 地址及未知详情模块默认保留。
- 汽车之家：已知广告服务接口、推广子项、直播浮窗及明确广告卡片。默认不整页清空 mycardv6，不按位置删除第一项。

## 验证与仍存在的边界

367 项合成检查全部通过：117 项源行为/结构检查（使用 cleanup_ui=true 对照原处理范围）、71 项京东闲鱼开屏兼容检查、179 项新增数据精度、异常、类型、默认业务保留、条件请求、编码及接口匹配检查。包含与上游 JQ/JS 的代表输入对照；不是对所有生产协议的证明。

五份模块均通过 Surge Mac 原生模块 LSP 检查（零诊断），合入最小 profile 后 `surge-cli --check` 全部 OK。测试覆盖默认参数展开；尚未实测 iPhone 的模块参数界面、联网执行及五款 App 的完整业务流程。

- 2 MiB 正文缓冲上限、5 秒脚本超时仍存在。超限正文可能跳过改写；加大上限会增加 iOS 内存压力。本地 Node 测试不能证明 iPhone 内存足够。
- HTTPS 依赖 MITM 成功；证书固定、未经过 HTTP 引擎、其他新域名/接口/结构、已有广告缓存可能导致漏拦。无法据此保证京东或闲鱼所有新版开屏都已生效。
- Surge 每个阶段只执行首条匹配脚本；重复模块仍可能抢先处理。可选 UI 请求脚本即使默认放行，也占用该匹配请求的脚本阶段，不应与其他同接口请求脚本叠加。
- 上游淘宝域名拒绝及汽车之家平安等共用广告接口会作用于其他 App 的相同请求；不是按进程隔离。
- 不安全整数保留原字面量；普通小数仍遵循 JavaScript JSON 数值处理语义，未实现任意精度十进制计算。未知协议发生异常时保留原始数据，可能同时保留广告。
- cleanup_ui=true 是较激进的页面精简，正常服务可能被隐藏；默认 false 是为了减少这类影响。正常业务保留为本次测试样例结论，不承诺所有版本完全无影响。

脚本无新增网络、持久化、通知、Cookie 捕获或正文日志 API。模块不修改会员权益、账号、主配置、代理节点；无额外订阅依赖。

## 来源与转换

上游固定提交：https://github.com/fkingikelee/fkikelee/commit/d62650fa4b5d8c03f65f03ff0ec2e8afed3226c0

原插件为 lpx/JD_remove_ads.lpx、Taobao_remove_ads.lpx、FleaMarket_remove_ads.lpx、Amap_remove_ads.lpx、AutoHome_remove_ads.lpx；引用 JS/JQ 位于同仓库 Resource/kelee/。原作者标注：京东 RuCu6、Maasea；淘宝 RuCu6；闲鱼、高德、汽车之家 可莉；京东和淘宝原 JS 引用 RuCu6/QuanX。保留作者归属，不额外假定上游授权。

上游 5 个 LPX、3 个 JS、2 个 JQ 的源快照哈希已核对。源插件的 delete/replace/jq/jq_file 合并为每款 App 一条有序响应脚本，jq 无需在手机上安装。默认模式是有意收窄的清理范围；可选精简也包含本次误删和类型修复，不宣称与上游逐字节等价。上一版京东/闲鱼开屏兼容保留，五份脚本统一升级编码处理。

参考：[Surge 模块及参数](https://manual.nssurge.com/profile/module.html)、[请求脚本及合成响应](https://manual.nssurge.com/scripting/http-request.html)、[响应脚本与限制](https://manual.nssurge.com/scripting/http-response.html)。
