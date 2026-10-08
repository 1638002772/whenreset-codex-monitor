# WHENRESET · Codex 重置监控

公开页面会展示 Tibo（@thsottiaux）的 Codex 用量重置线索、预告和已确认记录。GitHub Actions 每 10 分钟读取 X 公开 Posts 页面并运行本地规则；不登录、不调用 X API、不调用 AI。抓取结果和公开历史保存在此仓库，GitHub Pages 负责展示。

## GitHub Pages 部署

1. 将仓库设为公开。
2. 在仓库 **Settings → Pages → Build and deployment** 中，将 Source 设为 **GitHub Actions**。
3. 在 **Settings → Actions → General → Workflow permissions** 中允许读写仓库内容。
4. 在 **Actions** 页面手动运行一次 **Update monitor and publish Pages**。
5. 完成后从 **Settings → Pages** 打开站点地址。之后工作流每 10 分钟抓取、更新历史并发布网页。

GitHub 的定时工作流可能延迟启动。浏览器通知需要先在页面点击“开启本机浏览器提醒”，并保持页面打开。若要发送飞书消息，在仓库 **Settings → Secrets and variables → Actions** 中配置 `WHENRESET_FEISHU_WEBHOOK`；机器人启用了签名时，再配置 `WHENRESET_FEISHU_SECRET`。这些值不会进入公开仓库或网页。

公开仓库会包含站点代码、抓取到的公开推文文本和重置事件历史。不要把个人资料、订阅者信息、Webhook、签名密钥或其它凭据提交到仓库。

## 本地预览

需要 Python 3：

```powershell
python .\server.py
```

浏览器访问 <http://127.0.0.1:4173/>。如需手动更新抓取数据：

```powershell
python .\monitor.py --once
python .\tools\build_site.py
```

## 监控规则和限制

- 首次运行只建立基线，不会把旧帖作为新提醒；历史帖子与事件按本地规则归档，预告和到账确认会合并。
- 通知只针对明确关联 Codex 用量/额度的重置信号；普通动态不触发。
- 只读取公开 Posts，不包含回复、私密帖子或已删除内容。X 偶尔返回空页，也可能静默改变页面内部格式。
- GitHub Actions 免费额度适用于公开仓库；工作流每次更新监控状态和公开数据，再部署静态页面。
- 静态 Pages 不提供邮箱订阅、祈愿计数等需要数据库的表单服务。
