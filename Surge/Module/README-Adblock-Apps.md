# 五款 App 去广告（Surge iOS 6）

2026-11-11 去广告与页面精简版。页面精简默认开启。设为 cleanup_ui=false 可仅去广告。

| App | 模块 |
|---|---|
| 高德 | [Raw](https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Amap.sgmodule) |
| 京东 | [Raw](https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/JD.sgmodule) |
| 淘宝 | [Raw](https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Taobao.sgmodule) |
| 闲鱼 | [Raw](https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/Xianyu.sgmodule) |
| 汽车之家 | [Raw](https://raw.githubusercontent.com/v2raye/sub/main/Surge/Module/AutoHome.sgmodule) |

在 Surge 模块列表刷新这五个模块。启用 Rewrite、Scripting 和 MITM，确认 Surge CA 已信任，然后完全退出对应 App 再打开。脚本随模块引用加载。

- 淘宝覆盖开屏素材和活动弹层，活动的 enable 支持布尔、字符串和数字。
- 闲鱼兼容同步及异步开屏 URL 的斜线、查询参数和结尾。
- 高德的营销接口按字段清理，保留响应中的其他数据。
- 汽车之家拦截 adproxy 的 AdvertiseService 路径，保留普通报价和个人车辆响应。
- 京东保留客服入口与订单评价相关卡片，继续处理开屏和明确推广内容。

校验包括五个原生配置和 216 项合成检查。iPhone 直连模式的实机命中待复测。
