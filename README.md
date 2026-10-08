# WHENRESET · Codex 重置监控

网站展示 Tibo（@thsottiaux）的 Codex 用量重置线索、预告和已确认记录。运行抓取的电脑每 10 分钟读取 X 公开 Posts 并运行本地规则；不登录、不调用 X API、不调用 AI。脚本将公开抓取结果推送到此公开仓库，GitHub Actions 随后发布静态页面。

## GitHub Pages

仓库使用 GitHub Actions 发布 Pages。到 **Settings → Pages → Build and deployment** 检查 Source 为 **GitHub Actions**。网站地址可在同一页面查看。

X 会拦截 GitHub 云端 runner 的直接抓取请求，因此抓取任务运行在已登录 GitHub 的 Windows 电脑上。电脑需开机并联网，GitHub Actions 只负责构建和发布 Pages。仓库公开包含网页代码、公开推文内容与事件历史；本机通知配置和抓取诊断文件已加入忽略规则。

## 本机监控

需要 Python 3 和 GitHub CLI 登录账号。安装或更新每 10 分钟执行一次的 Windows 计划任务：

```powershell
powershell -ExecutionPolicy Bypass -File .\install-monitor-task.ps1
```

任务会抓取公开 Posts、生成页面数据，并把更新后的公开数据推送到仓库。抓取失败时也会发布状态，网站会显示暂时受阻。移除计划任务：

```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall-monitor-task.ps1
```

也可以手动运行一次并发布：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\update-and-publish.ps1
```

在网页点击“开启本机浏览器提醒”后，保持页面打开即可接收浏览器通知。可选的飞书配置保存在运行电脑的 `data/notification-config.json`，不会进入公开仓库。

## 本地预览

```powershell
python .\server.py
```

浏览器访问 <http://127.0.0.1:4173/>。首次抓取只建立基线，不会把旧帖作为新提醒；同一重置事件的预告和到账确认会合并。

## 监控限制

- 只读取公开 Posts，不包含回复、私密帖子或已删除内容。
- X 可能返回空页或调整页面内部格式；抓取失败会保留错误状态，恢复后继续抓取。
- Pages 是静态网站；邮箱订阅、祈愿计数等需要数据库的交互不提供。
- GitHub 的定时发布会在数据推送后启动，显示时间还受 Actions 排队影响。
