# WHENRESET · Codex 重置监控

网站展示 Tibo（@thsottiaux）的公开 Posts、从公开索引发现并经 X 原帖核验的回复候选、Codex 用量重置预告和已确认记录。抓取、去重、状态保存和 GitHub Pages 发布均由 GitHub Actions 云端完成；不需要电脑开机，也不会在本机定时运行。监控目标是每 10 分钟检查一次；抓取或解析失败时会等待 2 秒重试一次。不登录 X、不调用 X 官方 API、不调用 AI。

## 云端监控与发布

GitHub 托管 runner 直接访问 X 会返回 HTTP 403，因此工作流通过受口令保护的 Cloudflare Worker 请求固定的公开 Posts 页面；对公开索引发现的回复候选，Worker 只允许读取 `@thsottiaux` 的数字 ID 状态页。Worker 不接收任意 URL、不存储帖子，只把 X 公开 HTML 返回给 GitHub Actions。回复索引来自 whenreset.com.cn 的公开数据；索引只负责提供候选链接，入库和提醒前会重新读取 X 原帖并核对作者、正文与时间窗。Actions 解析新帖、将状态写回仓库，然后在同一轮部署 GitHub Pages。

仓库的 Actions workflow 使用 `7,17,27,37,47,57` 分钟的 UTC 时间点，每 10 分钟运行一次。GitHub 可能排队或延迟计划任务；它不是精确到分钟的保证。首次运行只建立基线，不将旧帖作为新提醒。

所需配置保存在 Cloudflare Worker secret 和 GitHub Actions secret/variable 中，不写进公开代码：`PROFILE_PROXY_TOKEN`、`WHENRESET_PROFILE_PROXY_TOKEN`、`WHENRESET_X_PROFILE_URL`。监控工作流启用 `contents: write` 和 Pages 部署权限，用于提交公开监控数据并发布站点。

## 本机任务

Windows 上的 `WHENRESET public X monitor` 计划任务已禁用。不要运行 `install-monitor-task.ps1` 重新安装它。如需手动清除该任务，可在项目目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall-monitor-task.ps1
```

本地预览只用于开发，不承担线上抓取或通知：

```powershell
python .\server.py
```

浏览器访问 <http://127.0.0.1:4173/>。

## 通知

网站可使用浏览器通知；需打开网站并允许浏览器通知。QQ 邮箱订阅和飞书通知是可选配置，需另外部署 Cloudflare 邮件 Worker/D1 或配置飞书 Webhook。云端邮件发送使用 GitHub Actions secrets：`WHENRESET_EMAIL_API_URL`、`WHENRESET_EMAIL_API_TOKEN`、`WHENRESET_SMTP_USER`、`WHENRESET_SMTP_PASSWORD` 和 `WHENRESET_SMTP_FROM`；QQ SMTP 为 `smtp.qq.com:465` SSL。未配置并验证这些服务前，不应把邮箱订阅视为已启用。

## 监控范围与限制

- 直接读取 Tibo 的公开 Posts；另由公开索引补充发现部分回复候选，再通过固定作者的 X 公开状态页核验。索引可能延迟或漏收，因此仍不能保证覆盖所有回复；不读取私密或已删除内容。
- 判断重置预告、已确认到账、额度补偿和上限提升；同一事件的预告和确认会合并。
- 识别带时间窗的 “global reset” 预告；如果原文只写 “by EOD” 而没有时区，网站保留原文并标注时区未注明，不自行换算成北京时间。历史百分比只统计常规重置，并按当前已等待时长条件估算；预存重置、补偿和社区观察不混入，页面同时显示可比样本数，尚无回测准确率。
- X 可能返回空页、调整 SSR 页面格式或拒绝抓取；状态会反映抓取失败，恢复后继续。
- GitHub Actions 的计划任务可能延迟；公开仓库会包含页面源码和公开帖子/事件数据。
