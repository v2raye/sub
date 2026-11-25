# Surge 6 单节点分流

把下面的规则合并到现有配置的 `[Rule]` 段，按所示顺序排列。将 `Snell` 改成你在 `[Proxy]` 中已有的节点名。规则运行于 Surge 的规则模式。

```ini
[Rule]
RULE-SET,LAN,DIRECT,no-resolve
# RULE-SET,https://raw.githubusercontent.com/v2raye/sub/main/Surge/SingleNode/Overrides/Proxy.list,Snell
# RULE-SET,https://raw.githubusercontent.com/v2raye/sub/main/Surge/SingleNode/Overrides/Direct.list,DIRECT
RULE-SET,https://raw.githubusercontent.com/v2raye/sub/main/Surge/SingleNode/Rules/Global.list,Snell
RULE-SET,https://raw.githubusercontent.com/v2raye/sub/main/Surge/SingleNode/Rules/China.list,DIRECT
GEOIP,CN,DIRECT
FINAL,Snell,dns-failed
```

默认分支合入后，上述 URL 可用。个人清单填入规则后再启用对应配置行。两份清单可换成本地路径，避免在公开仓库记录个人域名。清单中的 `DOMAIN,host.example` 精确匹配主机，`DOMAIN-SUFFIX,example.com` 匹配该域名及所有子域名。已有配置若引用这些 URL，请把引用它们的 `DOMAIN-SET` 同时改为 `RULE-SET`。两份个人清单不得有交集。内置 LAN 优先识别 `.local` 和已知的局域网地址，`no-resolve` 避免在这里主动解析域名。域名都未命中时才评估内置 GEOIP。DNS 解析失败时可由 `FINAL` 交给代理处理。规则只使用 DIRECT 和一个代理节点。

[Surge RULE-SET 与 LAN](https://manual.nssurge.com/rules/ruleset.html) · [GEOIP](https://manual.nssurge.com/rules/ip.html) · [FINAL](https://manual.nssurge.com/rules/final.html)

## 数据、许可和冲突处理

国内和国外清单由两个上游合并生成。v2fly 使用 `cn` 和生成器中列出的国外常用服务分类。Sukka 使用 `domestic.conf`、`global.conf`、`stream.conf`、`ai.conf` 和 `gitlab.conf` 非 IP 清单，仅导入精确域名和域名后缀，跳过关键词、通配符、User-Agent、进程名、URL 正则和上游标识域名。电影、电视、直播及其他代理服务统一进入国外清单。Telegram 和 Spotify 专属域名从国外清单排除，仍由后续 GEOIP 和 FINAL 分流。配置只需订阅本仓库生成的两份清单。

- [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community) 的原始数据采用 [MIT](LICENSE-v2fly.txt)，保留原版权和许可。
- [SukkaW/Surge](https://github.com/SukkaW/Surge) 的输入与合并后的规则清单按 [AGPL-3.0-only](LICENSE-Sukka.txt) 分发。合并快照的输入和构建方法随仓库发布，Sukka 原始导出保存在 [Sources/Sukka](Sources/Sukka)。本次归档的 Sukka 输入取自其 GitHub 导出镜像。后续更新从 [Sukka 发布服务器](https://ruleset.skk.moe/)拉取。

同策略重复和冗余条目会被删除。国外规则按具体域名匹配，去除 `.sx`、`.jp` 等整个顶级域后缀。Google Search、YouTube、YouTube Go 和 Blogspot 的地区入口按服务系列精简，保留各自的 `.com` 主域名、`google.cn` 原有处理，以及 `youtu.be`、`googlevideo.com` 等独立域名。访问已移除的地区域名时，按 GEOIP 和 FINAL 分流；只有 Google Search 和 Blogger 的官方说明确认了地区入口的重定向策略。其他服务的地区站点继续按原规则处理。会完全遮蔽任一保留国内规则的国外条目也会被移除。仍处于国内后缀下的较窄国外条目作为代理例外，依靠 Global 在 China 之前生效。`Rules/stats.json` 记录 v2fly 提交、Sukka 输入的 SHA-256、数量、跳过项及冲突处理。

## 生成、校验与回滚

使用 Node.js 22 或更新版本。把上游仓库检出到独立目录，复现首版或某次发布时使用 `Rules/stats.json` 中的 `revision`。生成器同时读取随快照归档的 Sukka 输入。

```sh
node Surge/SingleNode/generate.mjs --write /path/to/domain-list-community
node Surge/SingleNode/generate.mjs --check /path/to/domain-list-community
```

默认分支每日约在新加坡时间 04:23 执行更新，也支持手动运行。工作流只有在生成和校验成功后才提交整个快照。任一上游不可用、许可标记变更、Sukka 导出截断、个人规则冲突、条目跌破最低数量或较前次下降超过 20% 时不会发布。并发修改导致推送被拒时也会保留远端已有版本。默认分支需允许工作流令牌推送。Git 历史记录每次更新；需要回滚时，可用同一个历史提交下的两个 raw URL 固定规则版本，也可以回退对应更新提交。
