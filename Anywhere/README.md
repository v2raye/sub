# Anywhere YouTube 完整协议移植 r3

以本仓库 Surge 模块的四份最新协议引擎为基线，保留其已知 Protobuf schema、延迟解析、未知字段保留及 UI 处理逻辑；使用 Anywhere 原生 process(ctx)、store、编码、gzip 和响应接口。没有运行时 Surge 全局变量，也没有远程脚本依赖。不是把旧的简化扫描继续补丁化。

## 安装

单一主模块（完整 API + UMP）：
https://raw.githubusercontent.com/v2raye/sub/main/Anywhere/YouTube.mod

旧文件已改名，原订阅需要更换地址。只启用这一份模块。确认模块/MITM 开关及证书信任，重连后重启 YouTube。auto_hd、enable_ump 等参数仍保留。

## 移植范围

- API 的 Player、Browse、Next、Search、Guide、Watch/get_watch、resolve_url 嵌套 Player、设置与 Shorts reel 处理。
- 广告字段、后台播放、PiP、4x、Shorts EML/入口、上传入口、游戏、竖屏直播、商店、AI、Jump Ahead、On-the-go；均以源脚本支持的结构为限，不承诺新版本 UI 或服务端授权。
- 完整自动高清元数据缓存及 videoplayback 请求处理，不再仅填写一个画质提示。
- config/log_event 密钥捕获、历史密钥、initplayback 请求校验及密钥失配清理。
- 完整 UMP 帧、HMAC、AES-CTR、gzip、Player 和 Next 处理；API 与 UMP 使用对应源引擎的完整逻辑。
- ctier 按源模块使用 302，排除 initplayback；oad 空响应也排除播放初始化。

## 已确认的平台差异

1. Anywhere 的 ctx.headers 不可由脚本修改，无法按缓存状态条件删除请求头。模块用原生 header-delete 在每次 log_event 请求移除 x-youtube-hot-hash-data，尝试获取完整配置；比 Surge 的“仅缺少密钥时删除”更频繁，可能增加配置返回开销，也不保证服务端一定返回密钥。
2. Anywhere 的 MITM hostname 是后缀，无法表达 Surge 的 -redirector*.googlevideo.com 解密排除。已在请求脚本、UMP 响应和 ctier 规则中排除 redirector 前缀主机，且四个脚本入口均提前跳过；但 TLS 解密本身仍可能发生。
3. 响应脚本只能改正文，不再沿用源 UMP 错误分支的空正文。缺少密钥、认证失败、解析/解压失败等错误返回原响应快照；密钥失配清理仍保留，以便后续刷新。明确识别的广告请求仍按请求阶段规则拦截。原生请求拒绝以合成响应表达，非完全相同的断连方式。
4. Anywhere 缓冲脚本和原生压缩 codec 有 4 MiB 限制。客户端缓冲上限之外，针对已报告的 out of memory 另加模块内资源预算：UMP 512 KiB，其他脚本正文 1 MiB；超限保留原响应。关闭 enable_ump 仍会先匹配缓冲；此主模块不提供避免 UMP 缓冲的独立版本。
5. Anywhere 响应 ctx.headers 不含原始请求 UA，无法完全复刻源脚本的自动 Music 识别。client_flavor 默认 youtube；仅用于 YouTube Music 时选择 youtubeMusic。两种 App 混用时不能声称自动分类等价。
6. 文本解码前新增严格 UTF-8 检查，拒绝截断、非法续字节、过长编码、代理项和超出 Unicode 范围的码点。Base64 校验字符、长度、填充和解码结果长度，兼容 YouTube 的无填充 Base64URL；保留原引擎的宽松尾部填充位语义，避免破坏其格式兼容处理。压缩仍使用 Anywhere 原生 codec，受客户端 4 MiB 限制。

因此“完整协议移植”指移植源脚本现有处理范围，并非承诺平台完全等价或 YouTube 所有版本均可去广告。Shorts 的新结构仍可能漏网；没有解锁 Premium 权益。

## 日志及隐私

已移除诊断日志代码及 diagnostics 开关，不再输出接口命中、大小、密钥缓存状态或处理结果。保留源引擎的异常错误日志，不新增网络上报。

## 源码和测试

upstream/ 保留 source snapshot 与署名；port.py 把运行入口和平台 API 移植为 Anywhere 原生接口，scripts/ 是可读可编辑移植代码，dist/ 为独立执行脚本。Base64 仅用于 amod 内嵌分发。

重新生成：python3 port.py && python3 build.py

验证：node tests/test_native.cjs

测试用同一份二进制输入对照源 Surge 引擎和移植引擎，包括曾复现的 Shorts/Guide/嵌套 Player 漏处理，以及 UMP 加密、认证、gzip 和未知字段保留。测试使用原生 API 模拟，不等于 Anywhere iOS 真机测试。还需用户真机验证密钥是否返回以及实际 YouTube 版本的效果。

## 本次三项兼容性修正

只修改 redirector 规则门控、异常响应恢复与编码校验，名称/分类/开关和正常广告/Shorts 协议逻辑保持不变。协议引擎以只读方式使用输入，异常时返回原始正文引用；已通过输入字节不可变测试，避免再复制一份完整响应；转换结果若超过 4 MiB 也保留原响应。这无法避免脚本执行前的客户端缓冲限制。异常放行可能保留该次响应里的广告，以优先保持原始播放数据。

验证：node tests/test_native.cjs（23 项协议和异常场景）；python3 tests/test_module.py（模块内嵌及规则匹配）。本次补丁尚未真机验证。

## out of memory 修正

错误日志 [YouTube] InternalError: out of memory 表示运行时分配内存失败；4 MiB HTTP 缓冲上限不等于脚本堆内存可用量。尚未定位真机具体抛出点，以下是降低已发现开销的修正，不宣称完全排除 OOM。

- 移除额外的整份响应副本；不修改输入字节，异常继续返回原输入引用。
- UMP 使用小型 AES-CTR 实现与 Anywhere 原生 HMAC-SHA256，移除两个 65,536 项 Uint32 表及一个 Uint16 表，减少约 640 KiB 的查找表分配；不是减少全部内存的测量结果。
- UMP 输入及 gzip 处理预算 512 KiB；其他脚本输入 1 MiB。压缩扩张先检查 gzip 尾部声明大小，再检查原生解压结果；多 gzip member 等特殊输入仍受客户端原生限制。
- 每次脚本最多解析 20,000 个底层 Protobuf 字段（含重复扫描），限制对象膨胀。
- 超限会输出异常保护提示并保留原响应，可能让其中的广告通过；这些保护不代表彻底去广告。客户端在执行脚本前仍可能分配/缓冲较大响应，模块无法完全控制。

27 项模拟协议/异常/资源保护检查通过，尚无此补丁的真机内存测量。更新后须重连并关闭旧 YouTube 会话再试。
