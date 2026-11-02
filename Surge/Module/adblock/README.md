# Adblock Surge 修正版

模块入口：https://raw.githubusercontent.com/v2raye/sub/main/Adblock.sgmodule

启用模块、URL Rewrite、脚本和 MITM，并安装及信任 Surge CA。停用旧版本重复模块。适用范围仍为原模块涉及的两个站点，与 YouTube 模块的域名不重叠。

根据用户提供的 limbopro HTML 注入脚本做站点限定适配：使用有效 [Script] 区段，正文上限 2 MiB；保留 head 属性；只处理成功的 text/html 响应；异常放行且重复处理不二次注入。

保留广告请求拦截，修复 ppsuma 文件名正则并限定到目标站点及原有 CDN；取消默认 www→cn 重定向；移除没有规则使用的 xvideostream.net MITM。

网页端继续加载上游三个真实存在的组件及对应站点 CSS，使用固定提交的 jsDelivr 地址。未加入上游缺失的 autoAdDetector.js、isAgent.js、手工 CSS，也没有启用与广告过滤无关的隐私锁屏。未对上游浏览器组件内部全部功能做审计。

仅在目标站点 HTML 修改时删除 Content-Security-Policy 响应头以允许外部注入；不额外删除原脚本移除的 X-Frame-Options、Referrer-Policy 等头。HTML 内的 CSP meta 仍可能限制注入，jsDelivr 可达性和站点更新也会影响实际效果。未验证网站真实广告消除率，不能保证所有视频广告或弹窗都被阻止。

已做模拟响应与规则测试，未做真机验证。上游作者 limbopro：https://github.com/limbopro/Adblock4limbo 。
