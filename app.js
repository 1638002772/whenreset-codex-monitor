const translations = {
  zh: {
    demoBadge: 'GitHub Actions 云端监控 · 正在连接', navRadar: '重置雷达', navGuide: '重置问答', navCases: '动态记录', miniProgram: '小程序', pageLanguage: '页面语言',
    timezoneLabel: '选择显示时区', tzBeijing: '北京', tzLosAngeles: '洛杉矶', tzNewYork: '纽约', tzLondon: '伦敦', tzTokyo: '东京',
    heroEyebrow: '重点关注 · 本地时间', heroTitle: '正在读取监控数据', heroSummary: '页面会读取 GitHub Actions 云端监控抓取的 Tibo 公开 Posts。',
    viewPost: '查看相关原帖', whySignal: '判定依据', heroDisclaimer: '根据 Tibo 的公开 Posts 自动更新；仅将明确重置消息标作信号', wish: '开启提醒', localDemo: '自动抓取 · 每 10 分钟',
    lastReset: '最近一次 Codex 重置', oneDayAgo: '—', cardIssued: '重置卡发放', communityConfirm: '公开帖子与历史档案', forecastKicker: 'FORECAST', forecastTitle: '未来重置概率',
    within24: '未来 24 小时', within48: '未来 48 小时', within72: '未来 72 小时', sampleModel: '历史间隔估计', accuracy: '预测准确率', accuracyHint: '本地尚无足够的预测回测记录', updatedAt: '等待首次数据更新',
    probDisclaimer: '按已记录重置的历史间隔估算；这是简单统计模型，不是 AI 预测。', notifyKicker: 'STAY IN THE LOOP', notifyTitle: '接收重置提醒', emailTitle: 'QQ 邮箱提醒', emailHint: '任意邮箱可收；由云端定时任务发信', emailLabel: '邮箱地址', emailPlaceholder: 'name@qq.com', emailConsent: '我同意将邮箱保存在通知服务中，仅用于 Codex 重置提醒，可随时退订。', emailSubmit: '确认并订阅', emailSending: '正在提交订阅…', emailReady: '提交后请查收确认邮件；云端监控每 10 分钟检查并投递邮件。', emailNotReady: '邮件订阅服务尚未启用。', emailServiceOffline: '邮件服务暂时不可用，请稍后再试。', emailSent: '新订阅会收到确认邮件；已有订阅不会重复发信。邮件由云端任务投递。', emailFailed: '暂时无法提交订阅，请稍后重试。', emailTooMany: '提交过于频繁，请稍后再试。', browserTitle: '浏览器提醒', browserHint: '打开网页并允许通知后接收更新', feishuTitle: '飞书群机器人', feishuHint: '尚未配置', feishuConfigured: '已配置 · 由定时任务推送', feishuBody: '有明确的新重置消息时，由云端定时任务发送到已配置的群聊。', setupGuide: '配置教程 ↗',
    browserAlert: '开启本机浏览器提醒', browserEnabled: '本机浏览器提醒已开启', browserDenied: '浏览器通知被禁用，请在站点设置中打开', browserUnsupported: '此浏览器不支持通知', formDisclaimer: '邮件会发送到已确认订阅的地址；每封提醒都附有退订入口。浏览器提醒需要保持网页打开。',
    historyKicker: 'LOOKING BACK', historyTitle: '过去的重置', resetLegend: '额度重置', cardLegend: '重置卡发放', historyDetails: '查看统计口径', statResets: '记录重置', statCards: '重置卡发放', statAverage: '平均间隔', statLongest: '最长等待', times: '次', days: '天', sinceApril: '自 4 月开始统计', fromHistory: '按历史事件估算',
    feedKicker: 'SIGNALS & UPDATES', feedTitle: '最新动态', allUpdates: '全部', signalOnly: '重置信号', feedEnd: '云端监控每 10 分钟抓取；有新内容时更新页面', howKicker: 'HOW IT WORKS', howTitle: '把信号看清楚，再决定要不要等',
    howCopy: 'GitHub Actions 云端工作流每 10 分钟读取 Tibo 的公开 Posts，不登录、不调用 X API，也不调用 AI。页面区分重置预告和已确认到账；邮件订阅者确认邮箱后，只有明确的 Codex 重置预告或确认才会收到邮件。', backToTop: '回到雷达 ↑', footerCopy: '记录公开信号，等待下一次重置。', previewOnly: 'GitHub Actions 云端监控 · 每 10 分钟',
    info: '说明', ok: '知道了', month: '月', all: '全部', signal: '重置信号', activeSignal: '活动暗示', notice: '重置预告', confirmed: '已确认重置', compensation: '额度补偿', capIncrease: '上限提升', normalPost: '普通动态', community: '社区观测', summary: '摘要', original: '原文',
    modal: {
      basisTitle: '为什么把它标作重置信号？', basisBody: '只有帖子明确把 reset 与 Codex 用量、额度、付费账户或预存重置联系起来，才会进入重置信号。时间窗原样记录；公告和到账确认归并到同一事件。',
      probabilityTitle: '概率卡片说明', probabilityBody: '概率使用公开历史记录中的重置间隔作简单统计估算；历史间隔样本不足 4 个时不显示。它不是官方预测，也不调用 AI。',
      resetCardTitle: '重置卡发放', resetCardBody: '这里会展示额度补偿或额外重置卡发放的公开消息，并和常规额度重置分开统计。此卡片当前仅用于展示交互。',
      feishuHelpTitle: '飞书机器人配置', feishuHelpBody: '公开网页不保存机器人密钥。可在运行抓取脚本的电脑上创建被忽略的 data/notification-config.json，填写飞书 Webhook 和可选签名密钥；该文件不会上传到公开仓库。',
      historyHelpTitle: '历史统计口径', historyHelpBody: '历史档案由公开推文抓取与公开历史数据快照组成；同一事件的预告和到账确认会合并。网页读取仓库中的公开数据，并由抓取脚本定时更新。',
      miniTitle: '小程序入口', miniBody: '这里可以放置真实的小程序码或跳转入口。当前预览没有绑定小程序，也没有可用的入群二维码。',
    },
    toast: { feishu: '飞书测试消息已发送，配置保存在服务端。', wish: '已记录一次祈愿。', charge: '这里显示的是基于历史的估算概率。', copied: '数据来自公开页面监控。' }
  },
  en: {
    demoBadge: 'GitHub Actions cloud monitor · connecting', navRadar: 'Reset radar', navGuide: 'How it works', navCases: 'Activity', miniProgram: 'Mini program', pageLanguage: 'Language',
    timezoneLabel: 'Choose timezone', tzBeijing: 'Beijing', tzLosAngeles: 'Los Angeles', tzNewYork: 'New York', tzLondon: 'London', tzTokyo: 'Tokyo',
    heroEyebrow: 'SIGNAL WATCH · LOCAL TIME', heroTitle: 'Loading monitor data', heroSummary: 'This page reads Tibo’s public Posts collected by the monitor script.',
    viewPost: 'View the original post', whySignal: 'Classification details', heroDisclaimer: 'Automatically updated from Tibo’s public Posts', wish: 'Get alerts', localDemo: 'Automatic fetch · every 10 minutes',
    lastReset: 'Most recent Codex reset', oneDayAgo: '—', cardIssued: 'Reset cards', communityConfirm: 'Public posts and archived history', forecastKicker: 'FORECAST', forecastTitle: 'Reset probability',
    within24: 'Next 24 hours', within48: 'Next 48 hours', within72: 'Next 72 hours', sampleModel: 'Historical interval estimate', accuracy: 'Forecast accuracy', accuracyHint: 'Not enough local forecast history yet', updatedAt: 'Waiting for the first data update',
    probDisclaimer: 'Estimated from recorded reset intervals using a simple statistical model, not an AI prediction.', notifyKicker: 'STAY IN THE LOOP', notifyTitle: 'Get reset alerts', emailTitle: 'QQ Mail alerts', emailHint: 'Any inbox works; sent by the cloud monitor', emailLabel: 'Email address', emailPlaceholder: 'name@qq.com', emailConsent: 'I agree to store this address for Codex reset alerts only. I can unsubscribe at any time.', emailSubmit: 'Confirm and subscribe', emailSending: 'Submitting…', emailReady: 'Check your inbox for a confirmation email; the cloud monitor checks every 10 minutes.', emailNotReady: 'Email subscriptions are not enabled yet.', emailServiceOffline: 'The email service is temporarily unavailable. Try again later.', emailSent: 'New subscribers receive a confirmation email; active addresses are not sent another. Mail is delivered by the cloud monitor.', emailFailed: 'Could not submit the subscription. Try again later.', emailTooMany: 'Too many attempts. Try again later.', browserTitle: 'Browser alerts', browserHint: 'Keep this page open and allow notifications', feishuTitle: 'Feishu bot', feishuHint: 'Not configured', feishuConfigured: 'Configured · sent by the scheduled job', feishuBody: 'When a clear reset update appears, the cloud workflow sends it to the configured group.', setupGuide: 'Setup guide ↗',
    browserAlert: 'Enable browser alerts on this computer', browserEnabled: 'Browser alerts are enabled', browserDenied: 'Notifications are blocked; allow them in site settings', browserUnsupported: 'This browser does not support notifications.', formDisclaimer: 'Confirmation and alert emails are sent by the cloud monitor using QQ Mail SMTP and may take up to 10 minutes. Every alert includes an unsubscribe link.',
    historyKicker: 'LOOKING BACK', historyTitle: 'Reset history', resetLegend: 'Usage reset', cardLegend: 'Reset card issued', historyDetails: 'View counting rules', statResets: 'Resets recorded', statCards: 'Reset cards issued', statAverage: 'Average interval', statLongest: 'Longest wait', times: ' times', days: ' days', sinceApril: 'Tracking since April', fromHistory: 'Estimated from past events',
    feedKicker: 'SIGNALS & UPDATES', feedTitle: 'Latest activity', allUpdates: 'All', signalOnly: 'Reset signals', feedEnd: 'The cloud monitor checks every 10 minutes and updates the site when data changes', howKicker: 'HOW IT WORKS', howTitle: 'Read the signal before deciding to wait',
    howCopy: 'A cloud workflow reads Tibo’s public Posts every 10 minutes without login, X API, or AI calls. The site distinguishes reset forecasts from confirmed delivery. After confirming an email address, subscribers receive mail only for clear Codex reset forecasts or confirmations. Mail is delivered through QQ Mail SMTP by the cloud workflow; no monitor needs to run on your computer.', backToTop: 'Back to radar ↑', footerCopy: 'Tracking public signals, waiting for the next reset.', previewOnly: 'GitHub Actions cloud monitor · every 10 minutes',
    info: 'About', ok: 'Got it', month: '', all: 'All', signal: 'Reset signal', activeSignal: 'Signal', notice: 'Forecast', confirmed: 'Confirmed reset', compensation: 'Usage compensation', capIncrease: 'Limit increase', normalPost: 'Update', community: 'Community report', summary: 'Summary', original: 'Original',
    modal: {
      basisTitle: 'Why is this a reset signal?', basisBody: 'A post is classified as a reset signal only when it clearly connects reset language with Codex usage, quota, paid accounts, or banked resets. Time windows stay in the original wording; announcements and delivery confirmations are merged into one event.',
      probabilityTitle: 'About the probability cards', probabilityBody: 'Probabilities use a simple estimate from archived reset intervals. They stay hidden until at least four intervals are available. This is not an official forecast and does not call AI.',
      resetCardTitle: 'Reset cards', resetCardBody: 'This area can show public updates about compensation or extra reset cards, tracked separately from routine usage resets. It is display-only in this preview.',
      feishuHelpTitle: 'Feishu bot setup', feishuHelpBody: 'The public site does not store bot credentials. Create the ignored data/notification-config.json on the computer running the monitor and add the Feishu webhook and optional signing secret there. That file is excluded from the public repository.',
      historyHelpTitle: 'History counting rules', historyHelpBody: 'The history combines public X posts and a public historical snapshot. A forecast and its later landing confirmation are merged as one event. This page reads public repository data refreshed by the monitor script.',
      miniTitle: 'Mini program', miniBody: 'A live mini-program QR code or entry link can go here. This preview is not connected to a mini program or group QR code.',
    },
    toast: { feishu: 'Feishu test sent; settings saved on the server.', wish: 'Wish recorded.', charge: 'This shows an estimated historical probability.', copied: 'Data comes from the public page monitor.' }
  }
};

const monthNames = ['4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月'];
const monthLengths = { 3: 30, 4: 31, 5: 30, 6: 31, 7: 31, 8: 30, 9: 31 };
const state = { lang: 'zh', feedLang: 'zh', timezone: 'Asia/Shanghai', month: 9, feedFilter: 'all', liveData: null, apiUnavailable: false, toastTimer: 0 };
const BROWSER_ALERTS_KEY = 'whenreset-browser-alerts-seen';
const emailApiBase = String(window.WHENRESET_EMAIL_API_BASE || '').replace(/\/$/, '');
let emailServiceReady = false;
let emailSubmitting = false;
let emailStatusKey = 'emailNotReady';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const toast = (message) => {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  window.clearTimeout(state.toastTimer); state.toastTimer = window.setTimeout(() => node.classList.remove('show'), 2600);
};

function renderEmailSubscriptionState() {
  const button = $('#emailSubscribeButton');
  const buttonText = $('#emailSubscribeButtonText');
  const status = $('#emailSubscribeStatus');
  if (!button || !buttonText || !status) return;
  const dict = translations[state.lang];
  button.disabled = !emailServiceReady || emailSubmitting;
  buttonText.textContent = dict[emailSubmitting ? 'emailSending' : 'emailSubmit'];
  status.textContent = dict[emailStatusKey] || dict.emailNotReady;
  status.classList.toggle('email-status--error', ['emailServiceOffline', 'emailFailed', 'emailTooMany'].includes(emailStatusKey));
}

async function checkEmailSubscriptionService() {
  if (!emailApiBase) {
    emailStatusKey = 'emailNotReady';
    renderEmailSubscriptionState();
    return;
  }
  try {
    const response = await fetch(new URL('/api/health', emailApiBase), { cache: 'no-store' });
    const health = await response.json();
    if (!response.ok || !health.ready) throw new Error('service unavailable');
    emailServiceReady = true;
    emailStatusKey = 'emailReady';
  } catch (_error) {
    emailServiceReady = false;
    emailStatusKey = 'emailServiceOffline';
  }
  renderEmailSubscriptionState();
}

async function submitEmailSubscription(event) {
  event.preventDefault();
  if (!emailServiceReady || emailSubmitting) return;
  const form = event.currentTarget;
  const formData = new FormData(form);
  emailSubmitting = true;
  renderEmailSubscriptionState();
  try {
    const response = await fetch(new URL('/api/subscribe', emailApiBase), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        consent: $('#emailConsent').checked,
        website: formData.get('website'),
      }),
    });
    if (!response.ok) {
      emailStatusKey = response.status === 429 ? 'emailTooMany' : response.status >= 500 ? 'emailServiceOffline' : 'emailFailed';
    } else {
      emailStatusKey = 'emailSent';
      form.reset();
    }
  } catch (_error) {
    emailStatusKey = 'emailServiceOffline';
  } finally {
    emailSubmitting = false;
    renderEmailSubscriptionState();
  }
}

function applyLanguage() {
  const dict = translations[state.lang];
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  $$('[data-copy]').forEach((node) => {
    const key = node.dataset.copy; if (dict[key] !== undefined) node.innerHTML = dict[key];
  });
  $$('.language-switch:not(.language-switch--feed) button').forEach((button) => button.classList.toggle('selected', button.dataset.lang === state.lang));
  $$('.language-switch--feed button').forEach((button) => button.classList.toggle('selected', button.dataset.feedLang === state.feedLang));
  const emailInput = $('#subscriberEmail');
  if (emailInput) emailInput.placeholder = dict.emailPlaceholder;
  renderEmailSubscriptionState();
  renderMonthTabs(); renderCalendar(); renderFeed(); renderLiveData();
}

function formatPostTime(iso) {
  const date = new Date(iso);
  const locale = state.lang === 'zh' ? 'zh-CN' : 'en-US';
  return new Intl.DateTimeFormat(locale, { timeZone: state.timezone, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: state.lang === 'en' }).format(date);
}

function normalizeLivePost(post) {
  const related = state.liveData?.events?.find((event) => event.id === post.id || (event.postIds || []).includes(post.id));
  const timelineEntry = related?.timeline?.find((entry) => entry.postId === post.id);
  const category = post.classification || (post.displayType === 'card' ? 'compensation' : post.displayType === 'reset' ? 'usage_reset' : null) || related?.category;
  const rawStatus = post.eventStatus || post.displayState || timelineEntry?.status || related?.status;
  const tag = ['confirmed', 'completed'].includes(rawStatus) ? 'confirmed' : rawStatus === 'community' ? 'community' : ['forecast', 'announced'].includes(rawStatus) ? 'notice' : rawStatus === 'compensation' ? 'compensation' : rawStatus === 'cap_increase' ? 'capIncrease' : null;
  const signal = Boolean(category || tag);
  const summaryZh = post.summaryZh || (tag === 'confirmed' ? '原帖确认相关额度已到账。' : tag === 'notice' ? (category === 'banked_reset' ? 'Tibo 宣布正在加载预存重置额度，等待到账确认。' : '出现与 Codex 额度重置相关的新帖，等待后续确认。') : tag === 'compensation' ? 'Tibo 发布了额度补偿消息。' : tag === 'capIncrease' ? 'Tibo 发布了额度上限提升消息。' : related?.summaryZh || related?.titleZh || 'Tibo 发布了一条新动态。');
  const summaryEn = post.summaryEn || (tag === 'confirmed' ? 'The post confirms that the related usage has landed.' : tag === 'notice' ? (category === 'banked_reset' ? 'Tibo says a banked reset is loading; delivery is not yet confirmed.' : 'A new Codex reset post is awaiting follow-up confirmation.') : tag === 'compensation' ? 'Tibo posted an update about usage compensation.' : tag === 'capIncrease' ? 'Tibo posted an update about a higher usage cap.' : related?.summaryEn || related?.titleEn || 'Tibo published a new update.');
  return {
    id: post.id, kind: signal ? 'signal' : 'normal', author: post.author || 'Tibo', handle: '@thsottiaux',
    time: post.createdAt || post.created_at || '', tag: tag || 'normal', summaryZh, summaryEn,
    original: post.textEn || post.text || '', link: post.url || `https://x.com/thsottiaux/status/${post.id}`,
  };
}

function makeNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function renderFeed() {
  const t = translations[state.lang];
  const rawItems = (state.liveData?.posts || []).slice(0, 24).map(normalizeLivePost);
  const visibleItems = rawItems.filter((item) => state.feedFilter === 'all' || item.kind === 'signal');
  const list = $('#feedList'); list.replaceChildren();
  for (const item of visibleItems) {
    const tag = item.tag === 'confirmed' ? t.confirmed : item.tag === 'community' ? t.community : item.tag === 'notice' ? t.notice : item.tag === 'compensation' ? t.compensation : item.tag === 'capIncrease' ? t.capIncrease : t.normalPost;
    const badgeClass = item.tag === 'confirmed' ? '' : item.tag === 'notice' ? ' feed-pill--amber' : item.tag === 'community' ? ' feed-pill--muted' : item.tag === 'compensation' ? ' feed-pill--amber' : item.tag === 'capIncrease' ? ' feed-pill--muted' : '';
    const summary = state.feedLang === 'zh' ? item.summaryZh : item.summaryEn;
    const article = makeNode('article', 'feed-item'); article.dataset.kind = item.kind;
    const avatar = makeNode('div', `feed-avatar${item.author === 'WHENRESET' ? ' feed-avatar--site' : ''}`, item.author === 'WHENRESET' ? 'W' : 'T');
    const content = makeNode('div', 'feed-content');
    const meta = makeNode('div', 'feed-meta');
    meta.append(makeNode('span', 'feed-name', item.author), makeNode('span', 'feed-handle', item.handle), makeNode('span', 'feed-sep', '·'));
    const time = makeNode('time', '', item.time ? formatPostTime(item.time) : ''); if (item.time) time.dateTime = item.time;
    meta.append(time, makeNode('span', `feed-pill${badgeClass ? badgeClass : ''}`, tag));
    content.append(meta, makeNode('p', 'feed-summary', summary));
    const original = makeNode('blockquote', 'feed-original'); original.append(makeNode('b', '', t.original), document.createTextNode(item.original || ''));
    content.append(original); article.append(avatar, content);
    if (item.link) {
      const link = makeNode('a', 'feed-source', '𝕏 ↗'); link.href = item.link; link.target = '_blank'; link.rel = 'noreferrer';
      link.setAttribute('aria-label', state.lang === 'zh' ? '在 X 查看原帖' : 'View post on X'); article.append(link);
    } else article.append(makeNode('span', 'feed-source', '𝕏'));
    list.append(article);
  }
  $('#feedEnd').textContent = state.liveData ? translations[state.lang].feedEnd : state.apiUnavailable ? (state.lang === 'zh' ? '暂未读取到抓取数据' : 'No monitor data is available yet') : (state.lang === 'zh' ? '正在读取监控数据…' : 'Loading monitor data…');
}

function renderMonthTabs() {
  const current = state.month;
  $('#monthTabs').innerHTML = monthNames.map((name, index) => {
    const month = index + 3; const label = state.lang === 'zh' ? name : new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, month, 1)));
    return `<button class="month-tab${current === month ? ' selected' : ''}" type="button" data-month="${month}" aria-pressed="${current === month}">${label}</button>`;
  }).join('');
}

function renderCalendar() {
  const m = state.month;
  const monthDate = new Date(Date.UTC(2026, m, 1));
  const days = monthLengths[m];
  const firstMondayOffset = (monthDate.getUTCDay() + 6) % 7;
  const weekdays = state.lang === 'zh' ? ['一', '二', '三', '四', '五', '六', '日'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const marks = { reset: [], card: [] };
  if (state.liveData) {
    for (const event of state.liveData.events || []) {
      const category = event.category || (event.type === 'card' ? 'compensation' : event.type === 'reset' ? 'usage_reset' : '');
      const stamp = event.confirmedAt || event.completedAt || event.updatedAt || event.timestamp || event.createdAt;
      if (!stamp) continue;
      const date = new Date(stamp);
      const parts = new Intl.DateTimeFormat('en-US', {timeZone: state.timezone, year: 'numeric', month: 'numeric', day: 'numeric'}).formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      if (Number(values.year) !== 2026 || Number(values.month) - 1 !== m) continue;
      const day = Number(values.day);
      if (category === 'compensation') marks.card.push(day);
      else if (['usage_reset', 'banked_reset'].includes(category) && ['confirmed', 'community', 'completed'].includes(event.status)) marks.reset.push(day);
    }
  }
  const todayParts = new Intl.DateTimeFormat('en-US', {timeZone: state.timezone, year: 'numeric', month: 'numeric', day: 'numeric'}).formatToParts(new Date());
  const todayValues = Object.fromEntries(todayParts.map((part) => [part.type, part.value]));
  const today = Number(todayValues.year) === 2026 && Number(todayValues.month) - 1 === m ? Number(todayValues.day) : -1;
  const cells = weekdays.map((day) => `<div class="calendar-weekday">${state.lang === 'zh' ? `周${day}` : day}</div>`);
  for (let i = 0; i < firstMondayOffset; i += 1) cells.push('<div class="calendar-day empty" aria-hidden="true"></div>');
  for (let day = 1; day <= days; day += 1) {
    const reset = marks.reset.includes(day); const card = marks.card.includes(day);
    const classes = ['calendar-day', reset ? 'reset-day' : '', card ? 'card-day' : '', today === day ? 'today' : ''].filter(Boolean).join(' ');
    const label = reset ? (state.lang === 'zh' ? `${day} 日 · 额度重置` : `${day} · usage reset`) : card ? (state.lang === 'zh' ? `${day} 日 · 重置卡发放` : `${day} · reset card issued`) : `${day}`;
    cells.push(`<div class="${classes}" title="${label}">${day}</div>`);
  }
  $('#calendarGrid').innerHTML = cells.join('');
  const zhName = `${m + 1} 月`; const enName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(monthDate);
  $('#selectedMonthLabel').textContent = state.lang === 'zh' ? zhName : enName;
  $('#calendarCaption').textContent = state.liveData ? (state.lang === 'zh' ? `${zhName} · 历史记录` : `${enName} · history`) : (state.lang === 'zh' ? `${zhName} · 等待抓取数据` : `${enName} · waiting for monitor data`);
  $('#prevMonth').disabled = m <= 3; $('#nextMonth').disabled = m >= 9;
  $('#prevMonth').style.opacity = m <= 3 ? '.45' : '1'; $('#nextMonth').style.opacity = m >= 9 ? '.45' : '1';
}

function showModal(key) {
  const dict = translations[state.lang]; const modal = dict.modal;
  const keyMap = { basis: ['basisTitle', 'basisBody'], probability: ['probabilityTitle', 'probabilityBody'], resetCard: ['resetCardTitle', 'resetCardBody'], feishuHelp: ['feishuHelpTitle', 'feishuHelpBody'], historyHelp: ['historyHelpTitle', 'historyHelpBody'], mini: ['miniTitle', 'miniBody'] };
  const [titleKey, bodyKey] = keyMap[key] || keyMap.basis;
  $('#dialogKicker').textContent = state.lang === 'zh' ? 'ABOUT THIS PREVIEW' : 'ABOUT THIS PREVIEW';
  $('#dialogTitle').textContent = modal[titleKey]; $('#dialogBody').textContent = modal[bodyKey];
  $('#dialogOk').textContent = dict.ok; $('#infoDialog').showModal();
}

function localDateTime(value, withTime = true) {
  if (!value) return '—';
  const options = withTime ? {timeZone: state.timezone, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: state.lang === 'en'} : {timeZone: state.timezone, month: 'short', day: 'numeric', year: 'numeric'};
  return new Intl.DateTimeFormat(state.lang === 'zh' ? 'zh-CN' : 'en-US', options).format(new Date(value));
}

function relativeDate(value) {
  if (!value) return state.lang === 'zh' ? '暂无记录' : 'No record yet';
  const hours = Math.max(0, (Date.now() - new Date(value).getTime()) / 3600000);
  if (state.lang === 'zh') {
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} 分钟前`;
    if (hours < 24) return `${Math.floor(hours)} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  }
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function browserAlertKeys(data = state.liveData) {
  return (data?.notifications?.browserEvents || []).map((item) => item.key).filter(Boolean);
}

function processBrowserAlerts(data) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const alerts = data?.notifications?.browserEvents || [];
  let seen;
  try {
    const saved = localStorage.getItem(BROWSER_ALERTS_KEY);
    if (saved === null) {
      localStorage.setItem(BROWSER_ALERTS_KEY, JSON.stringify(alerts.map((item) => item.key)));
      return;
    }
    seen = new Set(JSON.parse(saved));
  } catch (_error) { return; }
  const fresh = alerts.filter((item) => item.key && !seen.has(item.key));
  for (const item of fresh) {
    try {
      const notice = new Notification(item.title || 'WHENRESET 更新', {body: item.body || '', tag: item.key});
      notice.onclick = () => {
        window.focus();
        if (item.url) window.open(item.url, '_blank', 'noopener');
        notice.close();
      };
      seen.add(item.key);
    } catch (_error) { break; }
  }
  try { localStorage.setItem(BROWSER_ALERTS_KEY, JSON.stringify([...seen].slice(-50))); } catch (_error) {}
}

function renderLiveData() {
  const data = state.liveData;
  if (!data) {
    if (state.apiUnavailable) {
      $('#demoBadge').textContent = state.lang === 'zh' ? '抓取数据暂不可用' : 'Monitor data unavailable';
      $('#connectionBadge').textContent = state.lang === 'zh' ? '等待定时抓取任务发布数据' : 'Waiting for the scheduled monitor to publish data';
      $('#heroTitle').textContent = state.lang === 'zh' ? '暂时无法读取监控数据' : 'Monitor data is unavailable';
      $('#heroSummary').textContent = state.lang === 'zh' ? '页面没有读取到定时抓取生成的数据。' : 'No data from the scheduled monitor is available.';
      $('#lastResetValue').textContent = '—';
      $('#statResetsValue').innerHTML = '—'; $('#statCardsValue').innerHTML = '—';
      $('#statAverageValue').innerHTML = '—'; $('#statLongestValue').innerHTML = '—';
      for (const horizon of [24, 48, 72]) { $(`#prob${horizon}`).textContent = '—'; $(`#prob${horizon}Suffix`).textContent = ''; $(`#meter${horizon}`).style.setProperty('--meter', '0%'); }
      $('#batteryFill').style.height = '0%'; $('#batteryPercent').textContent = '—';
    }
    return;
  }
  const t = translations[state.lang]; const status = data.status || {}; const summary = data.summary || {};
  const browserButton = $('#browserAlertButton');
  if (!('Notification' in window)) browserButton.textContent = t.browserUnsupported;
  else if (Notification.permission === 'granted') browserButton.textContent = t.browserEnabled;
  else if (Notification.permission === 'denied') browserButton.textContent = t.browserDenied;
  else browserButton.textContent = t.browserAlert;
  const connected = data.connected === true;
  const failures = Number(status.consecutiveFailures || 0);
  $('#connectionDot').classList.toggle('connection-dot--error', !connected);
  $('#demoBadge').textContent = connected ? (state.lang === 'zh' ? 'GitHub Actions 云端监控 · 每 10 分钟' : 'GitHub Actions cloud monitor · every 10 minutes') : failures ? (state.lang === 'zh' ? `抓取受阻 · 连续失败 ${failures} 次` : `Fetch issue · ${failures} failures`) : (state.lang === 'zh' ? '监控正在启动' : 'Monitor starting');
  $('#lastUpdatedAt').textContent = status.lastSuccessAt ? localDateTime(status.lastSuccessAt) : (state.lang === 'zh' ? '等待首次数据更新' : 'Waiting for the first data update');
  $('#connectionBadge').textContent = connected ? (state.lang === 'zh' ? 'X 公开 Posts · 监控服务已连接' : 'Public X Posts · monitor connected') : (state.lang === 'zh' ? `X 抓取暂时不可用${status.error ? `：${status.error}` : ''}` : `X fetch temporarily unavailable${status.error ? `: ${status.error}` : ''}`);

  const resetEvent = (data.events || []).find((event) => ['usage_reset', 'banked_reset'].includes(event.category) || event.type === 'reset');
  if (resetEvent) {
    const confirmed = ['confirmed', 'completed'].includes(resetEvent.status);
    const community = resetEvent.status === 'community';
    const title = state.lang === 'zh'
      ? (resetEvent.status === 'compensation' ? '发现额度补偿消息' : resetEvent.status === 'cap_increase' ? '额度上限有所提升' : community ? '社区实测显示额度已恢复' : confirmed ? (resetEvent.category === 'banked_reset' ? '预存重置额度已到账' : 'Codex 重置已确认到账') : '出现新的重置预告')
      : (resetEvent.status === 'compensation' ? 'Usage compensation update' : resetEvent.status === 'cap_increase' ? 'Usage cap increased' : community ? 'Community reports restored usage' : confirmed ? (resetEvent.category === 'banked_reset' ? 'Banked reset confirmed' : 'Codex reset confirmed') : 'A new reset forecast');
    const summaryText = state.lang === 'zh' ? (resetEvent.summaryZh || resetEvent.titleZh || '') : (resetEvent.summaryEn || resetEvent.titleEn || '');
    const rawText = resetEvent.latestText || '';
    const windowText = resetEvent.timeWindow ? `${state.lang === 'zh' ? '原文时间窗' : 'Source time window'}：${resetEvent.timeWindow}` : '';
    $('#heroTitle').textContent = title;
    $('#heroSummary').textContent = [summaryText, windowText, rawText ? `${state.lang === 'zh' ? '英文原文' : 'Original'}: “${rawText}”` : ''].filter(Boolean).join(' · ');
    const postUrl = resetEvent.lastPostUrl || resetEvent.lastPostId && `https://x.com/thsottiaux/status/${resetEvent.lastPostId}`;
    if (postUrl) $('.hero-actions .button--dark').href = postUrl;
  } else {
    $('#heroTitle').textContent = state.lang === 'zh' ? '暂未发现明确重置消息' : 'No clear reset signal found';
    $('#heroSummary').textContent = state.lang === 'zh' ? '监控服务正在检查 Tibo 的公开 Posts；普通动态不会作为重置预告。' : 'The monitor checks Tibo’s public Posts and ignores unrelated updates.';
  }

  $('#lastResetValue').textContent = relativeDate(summary.lastResetAt);
  const resetCount = Number(summary.resetCount || 0); const cardCount = Number(summary.cardCount || 0);
  $('#statResetsValue').innerHTML = `${resetCount}<span>${t.times}</span>`;
  $('#statCardsValue').innerHTML = `${cardCount}<span>${t.times}</span>`;
  $('#statAverageValue').innerHTML = `${summary.averageIntervalDays == null ? '—' : summary.averageIntervalDays}<span>${t.days}</span>`;
  $('#statLongestValue').innerHTML = `${summary.longestIntervalDays == null ? '—' : summary.longestIntervalDays}<span>${t.days}</span>`;
  $('#statSource').textContent = state.lang === 'zh' ? `${resetCount} 条公开确认记录` : `${resetCount} confirmed public records`;
  const probabilities = summary.probabilities;
  for (const horizon of [24, 48, 72]) {
    const value = probabilities?.[String(horizon)];
    $(`#prob${horizon}`).textContent = value == null ? '—' : value;
    $(`#prob${horizon}Suffix`).textContent = value == null ? '' : '%';
    $(`#meter${horizon}`).style.setProperty('--meter', `${value || 0}%`);
    $(`#prob${horizon}Note`).textContent = value == null ? (state.lang === 'zh' ? '历史样本不足' : 'Not enough history') : (state.lang === 'zh' ? `${resetCount} 次历史记录` : `${resetCount} events`);
  }
  $('#accuracyValue').textContent = '—';
  $('#accuracyHint').textContent = state.lang === 'zh' ? '尚未积累预测回测记录' : 'No forecast backtest yet';
  $('#updatedAt').textContent = status.lastSuccessAt ? `${state.lang === 'zh' ? '数据更新于 ' : 'Data updated '}${localDateTime(status.lastSuccessAt)}` : t.updatedAt;
  $('#probDisclaimer').textContent = probabilities
    ? (state.lang === 'zh' ? `按 ${resetCount} 条历史确认记录的间隔估算；仅作参考，不是 AI 预测。` : `Estimated from ${resetCount} archived reset records; informational only, not an AI forecast.`)
    : (state.lang === 'zh' ? '确认事件积累到足够数量后才显示概率；当前不会用静态数值冒充预测。' : 'Probabilities appear after enough confirmed events are recorded; no static values are shown as live forecasts.');
  $('#feishuStatus').textContent = data.notifications?.feishuConfigured ? t.feishuConfigured : t.feishuHint;
  $('#formDisclaimer').textContent = t.formDisclaimer;
  const forecast = probabilities?.['24'];
  $('#batteryFill').style.height = `${forecast || 0}%`;
  $('#batteryPercent').textContent = forecast == null ? '—' : `${forecast}%`;
  renderFeed(); renderCalendar();
}

async function loadLiveData() {
  try {
    const response = await fetch(`data/site-data.json?refresh=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.liveData = await response.json(); state.apiUnavailable = false; processBrowserAlerts(state.liveData); renderLiveData();
  } catch (_error) {
    state.apiUnavailable = true; renderLiveData();
  }
}

document.addEventListener('click', (event) => {
  const langButton = event.target.closest('[data-lang]');
  if (langButton) { state.lang = langButton.dataset.lang; applyLanguage(); if (langButton.closest('#mobileNav')) $('#mobileNav').classList.remove('open'); return; }
  const feedLang = event.target.closest('[data-feed-lang]');
  if (feedLang) { state.feedLang = feedLang.dataset.feedLang; applyLanguage(); return; }
  const monthButton = event.target.closest('[data-month]');
  if (monthButton) { state.month = Number(monthButton.dataset.month); renderMonthTabs(); renderCalendar(); return; }
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) { state.feedFilter = filterButton.dataset.filter; $$('.feed-filter button').forEach((button) => button.classList.toggle('selected', button === filterButton)); renderFeed(); return; }
  const modalButton = event.target.closest('[data-modal]');
  if (modalButton) { showModal(modalButton.dataset.modal); return; }
});

$('#timezone').addEventListener('change', (event) => { state.timezone = event.target.value; renderFeed(); renderCalendar(); renderLiveData(); });
$('#prevMonth').addEventListener('click', () => { if (state.month > 3) { state.month -= 1; renderMonthTabs(); renderCalendar(); } });
$('#nextMonth').addEventListener('click', () => { if (state.month < 9) { state.month += 1; renderMonthTabs(); renderCalendar(); } });
$('#emailSubscribeForm').addEventListener('submit', submitEmailSubscription);
$('#browserAlertButton').addEventListener('click', async () => {
  if (!('Notification' in window)) { toast(translations[state.lang].browserUnsupported); return; }
  if (Notification.permission === 'denied') { toast(translations[state.lang].browserDenied); return; }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try { localStorage.setItem(BROWSER_ALERTS_KEY, JSON.stringify(browserAlertKeys())); } catch (_error) {}
      toast(state.lang === 'zh' ? '本机通知已开启；网页需保持打开以接收脚本更新。' : 'Browser alerts enabled; keep this page open to receive monitor updates.');
      renderLiveData();
    } else toast(state.lang === 'zh' ? '未获得浏览器通知权限。' : 'Browser notification permission was not granted.');
  } catch (_error) { toast(state.lang === 'zh' ? '无法开启浏览器通知。' : 'Could not enable browser notifications.'); }
});
$('#miniProgramButton').addEventListener('click', () => showModal('mini'));
$('#dialogClose').addEventListener('click', () => $('#infoDialog').close());
$('#dialogOk').addEventListener('click', () => $('#infoDialog').close());
$('#infoDialog').addEventListener('click', (event) => { if (event.target === $('#infoDialog')) $('#infoDialog').close(); });
$('#mobileMenu').addEventListener('click', () => $('#mobileNav').classList.toggle('open'));
$('#mobileNav').addEventListener('click', (event) => { if (event.target.closest('a')) $('#mobileNav').classList.remove('open'); });

applyLanguage();
checkEmailSubscriptionService();
loadLiveData();
window.setInterval(loadLiveData, 30000);
