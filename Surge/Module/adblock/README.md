# 纯去广告版

安装地址：https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Adblock.sgmodule

仅保留两个站点的已知广告请求拦截和精简的广告 CSS 隐藏。response.js 在 Surge 内运行，只插入内联样式，不向网页插入任何 JavaScript、外部 CSS 或外部链接。

已移除 Adblock4limbo.user.js、Adblock4limbo.function.js、elementBlocker.user.js 及所有递归依赖，因此不再带入其导航、反馈、调试面板、使用统计、存储操作、翻译、下载、工具箱或外部脚本加载功能。无网页 URL/标题/UA 的反馈采集逻辑。

广告 CSS 参考 limbopro/Adblock4limbo 的站点选择器，仅选取明确的广告元素；不隐藏年龄验证、Cookie 提示、正常图片或通用播放器容器。作者来源：https://github.com/limbopro/Adblock4limbo 。

范围：普通网站/浏览器的已知广告请求和广告元素，不保证全部视频广告或弹窗均被拦截，不修改视频播放器内部配置。移除上游工具脚本也意味着其额外动态去广告功能不再提供。仅在目标 HTML 响应移除 CSP 响应头以允许内联样式；不修改其他安全头，页面自己的 CSP meta 可能仍会限制样式生效。

使用：启用模块、重写、脚本和 MITM，安装并信任证书。更新模块及脚本缓存后重新加载网页。已有标签页中运行的旧脚本需关闭页面后重新打开才能清除；旧脚本写入的浏览器本地数据不会由本版本自动删除。

已完成静态及模拟响应测试，尚未真机验证。
