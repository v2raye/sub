# Surge 6 单节点分流

把下面的规则合并到现有配置的 `[Rule]` 段，按所示顺序排列。将 `Snell` 改成你在 `[Proxy]` 中已有的节点名。规则运行于 Surge 的规则模式。

```ini
[Rule]
RULE-SET,LAN,DIRECT,no-resolve
# DOMAIN-SET,https://raw.githubusercontent.com/v2raye/sub/main/Surge/SingleNode/Overrides/Proxy.list,Snell
# DOMAIN-SET,https://raw.githubusercontent.com/v2raye/sub/main/Surge/SingleNode/Overrides/Direct.list,DIRECT
DOMAIN-SET,https://raw.githubusercontent.com/v2raye/sub/main/Surge/SingleNode/Rules/Global.list,Snell
DOMAIN-SET,https://raw.githubusercontent.com/v2raye/sub/main/Surge/SingleNode/Rules/China.list,DIRECT
GEOIP,CN,DIRECT
FINAL,Snell,dns-failed
```

默认分支合入后，上述 URL 可用。个人清单填入规则后再启用对应配置行。两份清单可换成本地路径，避免在公开仓库记录个人域名。裸域名仅匹配该主机，前导点匹配该域名及所有子域名。两份个人清单不得有交集。内置 LAN 优先识别 `.local` 和已知的局域网地址，`no-resolve` 避免在这里主动解析域名。域名都未命中时才评估内置 GEOIP。DNS 解析失败时可由 `FINAL` 交给代理处理。规则只使用 DIRECT 和一个代理节点。

[Surge DOMAIN-SET](https://manual.nssurge.com/rules/domain.html) · [LAN](https://manual.nssurge.com/rules/ruleset.html) · [GEOIP](https://manual.nssurge.com/rules/ip.html) · [FINAL](https://manual.nssurge.com/rules/final.html)

## 数据和冲突处理

唯一上游是 [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community)，按 [MIT 许可](LICENSE-v2fly.txt) 分发派生规则。国内采用 `cn`，国外采用生成器中列出的常用服务；Google 已包含 YouTube。展开递归引用并应用上游属性过滤后，跳过广告分类及 `@ads` 标记、关键词和正则。域名转成小写，去除根点，按 Surge 的精确和后缀语义去重并删除同策略冗余。未标记的域名只参与路由。

会完全遮蔽任一保留国内规则的国外条目被移除。仍处于国内后缀下的较窄国外条目作为代理例外，依靠 Global 在 China 之前生效。`Rules/stats.json` 记录上游提交、规则数量、跳过项及每条冲突的处理结果。其余流量继续评估 GEOIP 和 FINAL。

## 生成、校验与回滚

使用 Node.js 22 或更新版本。把上游仓库检出到独立目录，复现首版或某次发布时使用 `Rules/stats.json` 中的 `revision`。

```sh
node Surge/SingleNode/generate.mjs --write /path/to/domain-list-community
node Surge/SingleNode/generate.mjs --check /path/to/domain-list-community
```

默认分支每日约在新加坡时间 04:23 执行更新，也支持手动运行。工作流只有在生成和校验成功后才提交整个快照。上游不可用、许可变更、个人规则冲突、条目跌破最低数量或较前次下降超过 20% 时不会发布。并发修改导致推送被拒时也会保留远端已有版本。默认分支需允许工作流令牌推送。Git 历史记录每次更新；需要回滚时，可用同一个历史提交下的两个 raw URL 固定规则版本，也可以回退对应更新提交。
