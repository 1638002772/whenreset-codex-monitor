import { seed } from './seed-data.js';

const PROFILE_URL = 'https://x.com/thsottiaux';
const BASELINE_ID = '2107676072871600470';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MAX_POSTS = 200;
const MAX_EVENTS = 200;
const MAX_SEEN = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function now() { return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); }
function dateValue(value) { const time = Date.parse(value || ''); return Number.isFinite(time) ? time : null; }
function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
function safeEqual(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}
async function readBody(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length <= 0 || length > 16_384) throw new Error('请求为空或超过 16 KB。');
  const value = await request.json();
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('请求内容格式不正确。');
  return value;
}
async function getSnapshot(env) {
  const row = await env.DB.prepare('SELECT payload FROM app_state WHERE id = 1').first();
  if (row?.payload) return JSON.parse(row.payload);
  return structuredClone(seed);
}
async function saveSnapshot(env, snapshot) {
  await env.DB.prepare('INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at')
    .bind(JSON.stringify(snapshot), now()).run();
}
function isReset(event) { return ['usage_reset', 'banked_reset'].includes(event.category) || event.type === 'reset'; }
function isCompleted(event) { return ['confirmed', 'community', 'completed'].includes(event.status) || Boolean(event.completedAt); }
function buildSummary(snapshot, wishCount, emailSubscribers, feishuConfigured) {
  const { posts = [], events = [], state = {}, archive = null } = snapshot;
  const orderedEvents = [...events].sort((a, b) => (b.updatedAt || b.timestamp || '').localeCompare(a.updatedAt || a.timestamp || ''));
  const completed = events.filter((event) => isReset(event) && isCompleted(event))
    .sort((a, b) => (a.confirmedAt || a.completedAt || a.updatedAt || a.timestamp || '').localeCompare(b.confirmedAt || b.completedAt || b.updatedAt || b.timestamp || ''));
  const moments = completed.map((event) => dateValue(event.confirmedAt || event.completedAt || event.updatedAt || event.timestamp)).filter(Number.isFinite);
  const intervals = moments.slice(1).map((value, index) => (value - moments[index]) / 3_600_000).filter((value) => value > 0);
  const average = intervals.length ? intervals.reduce((sum, item) => sum + item, 0) / intervals.length : null;
  const pending = events.some((event) => isReset(event) && event.status === 'forecast');
  const probabilities = intervals.length >= 4 && average > 0
    ? Object.fromEntries([24, 48, 72].map((hours) => [String(hours), Math.round(Math.min(99, Math.max(1, (1 - Math.exp(-hours / average)) * (pending ? 1.12 : 1) * 100)))]))
    : null;
  const lastReset = completed.at(-1);
  const pendingEvent = orderedEvents.find((event) => isReset(event) && event.status === 'forecast');
  return {
    connected: Boolean(state.lastSuccessAt && state.monitorState === 'ok'),
    status: {
      state: state.monitorState || 'starting', lastAttemptAt: state.lastAttemptAt || null,
      lastSuccessAt: state.lastSuccessAt || null, lastNewPostAt: state.lastNewPostAt || null,
      nextCheckAt: null, consecutiveFailures: Number(state.consecutiveFailures || 0),
      error: state.lastError || null, postsFetched: Number(state.postsFetched || 0),
    },
    posts: [...posts].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 100),
    events: orderedEvents.slice(0, 100),
    summary: {
      resetCount: completed.length,
      cardCount: events.filter((event) => event.category === 'compensation' || event.type === 'card').length,
      averageIntervalDays: average == null ? null : Math.round(average / 24 * 10) / 10,
      longestIntervalDays: intervals.length ? Math.round(Math.max(...intervals) / 24 * 10) / 10 : null,
      lastResetAt: lastReset ? (lastReset.confirmedAt || lastReset.completedAt || lastReset.updatedAt || lastReset.timestamp) : null,
      pendingEventId: pendingEvent?.id || null, probabilities, accuracy: null,
    },
    notifications: { emailConfigured: false, emailSubscribers, feishuConfigured, browserEvents: (state.browserAlerts || []).slice(-50) },
    wishes: wishCount,
    archive,
  };
}
function decodeRsc(value) {
  try { return JSON.parse(`"${value}"`); }
  catch { return value.replace(/\\n/g, '\n').replace(/\\u0026/g, '&').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>'); }
}
function extractPosts(html) {
  const entries = [...html.matchAll(/(?:"entry_id"|entry_id)\s*:\s*"?tweet-(\d+)"?/g)].map((match) => match[1]);
  const fallback = entries.length ? [] : [...html.matchAll(/data-href="\/thsottiaux\/status\/(\d+)"/g)].map((match) => match[1]);
  const ids = [...new Set(entries.length ? entries : fallback)];
  if (!ids.length) throw new Error('X 页面没有找到 Posts 时间线数据。');
  const fetchedAt = now();
  const posts = [];
  for (const id of ids) {
    const key = btoa(`Tweet:${id}`);
    let position = html.indexOf(key);
    let post = null;
    while (position >= 0) {
      const before = html.slice(Math.max(0, position - 8000), position);
      const textMatches = [...before.matchAll(/(?:"full_text"|full_text)\s*:\s*"((?:\\.|[^"\\])*)"/g)];
      const dateMatches = [...before.matchAll(/(?:"created_at_ms"|created_at_ms)\s*:\s*(\d+)/g)];
      if (textMatches.length && dateMatches.length) {
        const text = decodeRsc(textMatches.at(-1)[1]).trim();
        const createdAt = new Date(Number(dateMatches.at(-1)[1])).toISOString().replace(/\.\d{3}Z$/, 'Z');
        const authorWindow = before.slice(Math.max(0, textMatches.at(-1).index - 2400));
        const authors = [...authorWindow.matchAll(/(?:"screen_name"|screen_name)\s*:\s*"([^"]+)"/g)];
        if (!authors.length || authors.at(-1)[1].toLowerCase() === 'thsottiaux') {
          post = { id, author: 'thsottiaux', createdAt, text, url: `https://x.com/thsottiaux/status/${id}`, fetchedAt };
          break;
        }
      }
      position = html.indexOf(key, position + key.length);
    }
    if (!post) throw new Error(`X 页面解析失败：帖子 ${id} 缺少正文或时间。`);
    posts.push(post);
  }
  return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}
const WINDOW_PATTERNS = [
  /\bby\s+EOD\s+(?:PST|PDT|PT)\b/i,
  /\bby\s+the\s+end\s+of\s+(?:today|the\s+day)(?:\s+(?:PST|PDT|PT|Pacific\s+Time))?\b/i,
  /\bwithin\s+(?:the\s+)?(?:next\s+)?(?:\d+\s+)?(?:minutes?|hours?|days?|hour|day)\b/i,
  /\bin\s+\d+\s+(?:minutes?|hours?|days?)\b/i,
  /\b(?:later\s+today|tonight|tomorrow)\b/i,
  /\bat\s+\d{1,2}(?::\d{2})?\s*(?:a\.m\.|p\.m\.|am|pm)\s*(?:PST|PDT|PT)\b/i,
];
const DELIVERY = /\b(reset|land|landed|arrive|arrival|available|live|receive|received|load|loading|issue|issued|roll\s*out)\b/i;
const CONFIRMED = /\b(confirmed|landed|now\s+live|are\s+live|is\s+live|fully\s+live|has\s+arrived|have\s+arrived|received|issued|applied)\b/i;
const RESET = /\b(reset|resets|resetting|banked\s+reset|reset\s+card)\b/i;
const CONTEXT = /\b(codex|usage|quota|credit|credits|paid\s+accounts?|all\s+accounts?|limit|allowance|banked)\b/i;
function timeWindow(text) {
  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    const match = WINDOW_PATTERNS.map((pattern) => sentence.match(pattern)).find(Boolean);
    if (!match) continue;
    const phrase = match[0];
    if (/^(tomorrow|later today|tonight)$/i.test(phrase) && !DELIVERY.test(text)) continue;
    return phrase;
  }
  return null;
}
function categoryFor(text) {
  const lower = text.toLowerCase();
  if (/\b(cap|limit)\s+(is\s+)?(raised|increased|expanded)|higher\s+(usage|limit|cap)\b/.test(lower)) return 'cap_increase';
  if (/\b(compensat\w*|credit\s+grant|extra\s+credit|reset\s+card)\b/.test(lower)) return 'compensation';
  if (/\bbanked\s+reset\b/.test(lower)) return 'banked_reset';
  return RESET.test(text) && CONTEXT.test(text) ? 'usage_reset' : null;
}
function pendingFor(events, createdAt) {
  const current = dateValue(createdAt);
  if (current == null) return null;
  return events.filter((event) => event.status === 'forecast')
    .map((event) => ({ event, age: current - dateValue(event.createdAt) }))
    .filter((item) => item.age >= 0 && item.age <= 36 * 3_600_000)
    .sort((a, b) => a.age - b.age)[0]?.event || null;
}
function classify(post, events) {
  let category = categoryFor(post.text);
  if (post.id === BASELINE_ID) category = 'usage_reset';
  const pending = pendingFor(events, post.createdAt);
  const followup = !category && pending && /\b(confirmed|landed|now\s+live|all\s+accounts|already\s+live)\b/i.test(post.text);
  if (followup) category = pending.category;
  if (!category) return null;
  let completion = CONFIRMED.test(post.text);
  if (post.id === BASELINE_ID || (followup && /\b(confirmed|landed|now\s+live|already\s+live)\b/i.test(post.text))) completion = true;
  const status = category === 'cap_increase' ? 'cap_increase' : category === 'compensation' ? 'compensation' : completion ? 'confirmed' : 'forecast';
  return { category, status, timeWindow: timeWindow(post.text), isFollowup: Boolean(followup) };
}
function titleFor(category, status) {
  const names = { usage_reset: ['额度重置', 'Usage reset'], banked_reset: ['预存重置额度', 'Banked reset'], compensation: ['额度补偿', 'Usage compensation'], cap_increase: ['额度上限提升', 'Usage cap increase'] };
  const labels = { forecast: ['重置预告', 'Reset forecast'], confirmed: ['已确认到账', 'Confirmed landed'], compensation: ['额度补偿', 'Usage compensation'], cap_increase: ['上限提升', 'Limit increase'] };
  const name = names[category] || ['额度动态', 'Usage update'];
  const label = labels[status] || ['动态', 'Update'];
  return [`${name[0]} · ${label[0]}`, `${name[1]} · ${label[1]}`];
}
function pendingMatchingEvent(events, category, createdAt) {
  const current = dateValue(createdAt);
  return [...events].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).find((event) => {
    const age = Math.abs(current - dateValue(event.updatedAt));
    return event.category === category && age <= 36 * 3_600_000 && event.status !== 'confirmed';
  }) || null;
}
function applyPost(events, post) {
  const classification = classify(post, events);
  if (!classification) return { events, result: null };
  const { category, status } = classification;
  let event = pendingMatchingEvent(events, category, post.createdAt);
  if (!event && classification.isFollowup) event = pendingFor(events, post.createdAt);
  const created = !event;
  if (!event) {
    const [titleZh, titleEn] = titleFor(category, status);
    event = { id: post.id, category, status, titleZh, titleEn, createdAt: post.createdAt, updatedAt: post.createdAt,
      confirmedAt: status === 'confirmed' ? post.createdAt : null, timeWindow: classification.timeWindow, postIds: [], timeline: [], lastAlertedStatus: null };
    events.push(event);
  }
  event.postIds ||= [];
  event.timeline ||= [];
  if (!event.postIds.includes(post.id)) event.postIds.push(post.id);
  event.updatedAt = post.createdAt;
  event.lastPostId = post.id;
  event.lastPostUrl = post.url;
  event.timeWindow = classification.timeWindow || event.timeWindow;
  event.timeline.push({ postId: post.id, createdAt: post.createdAt, url: post.url, text: post.text, status, timeWindow: classification.timeWindow });
  if (['confirmed', 'compensation', 'cap_increase'].includes(status)) {
    event.status = status;
    if (status === 'confirmed') event.confirmedAt = post.createdAt;
  } else if (!['confirmed', 'compensation', 'cap_increase'].includes(event.status)) event.status = 'forecast';
  [event.titleZh, event.titleEn] = titleFor(category, event.status);
  event.latestText = post.text;
  const shouldAlert = event.lastAlertedStatus !== event.status && (['confirmed', 'compensation', 'cap_increase'].includes(event.status) || (event.status === 'forecast' && Boolean(event.timeWindow)));
  return { events, result: { event, shouldAlert, created } };
}
function queueBrowserAlert(state, key, title, body, url = null) {
  state.browserAlerts ||= [];
  if (state.browserAlerts.some((alert) => alert.key === key)) return;
  state.browserAlerts.push({ key, title, body, url, createdAt: now() });
  state.browserAlerts = state.browserAlerts.slice(-50);
}
function eventMessage(event) {
  const labels = { confirmed: '✅ 已确认重置', compensation: '⚪ 额度补偿', cap_increase: '🔵 额度上限提升', forecast: '🟡 重置预告' };
  const timestamp = dateValue(event.updatedAt);
  const when = timestamp == null ? event.updatedAt : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
  return [labels[event.status] || 'WHENRESET 更新', `时间（北京时间）：${when}`, event.timeWindow ? `原文时间窗：${event.timeWindow}` : '', event.latestText ? `原文：${event.latestText}` : '', event.lastPostUrl || ''].filter(Boolean).join('\n');
}
async function sendFeishu(config, message) {
  if (!config?.feishu_webhook) return false;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = { msg_type: 'text', content: { text: message } };
  if (config.feishu_secret) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${timestamp}\n${config.feishu_secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new Uint8Array());
    payload.timestamp = timestamp;
    payload.sign = btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
  const response = await fetch(config.feishu_webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  return response.ok && Number(result.code || 0) === 0;
}
async function getFeishuConfig(env) {
  return await env.DB.prepare('SELECT feishu_webhook, feishu_secret FROM notification_config WHERE id = 1').first();
}
async function runMonitor(env) {
  const snapshot = await getSnapshot(env);
  const state = snapshot.state || {};
  state.lastAttemptAt = now();
  let posts;
  try {
    const response = await fetch(PROFILE_URL, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9', 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error(`X 返回 HTTP ${response.status}。`);
    const html = await response.text();
    if (html.length < 10_000 || !html.includes('VHdlZXQ6')) throw new Error('X 页面没有包含预期的公开 SSR 数据。');
    posts = extractPosts(html);
  } catch (error) {
    state.consecutiveFailures = Number(state.consecutiveFailures || 0) + 1;
    state.lastError = String(error.message || error).slice(0, 300);
    state.monitorState = 'error';
    if (state.consecutiveFailures >= 2 && !state.failureAlertSent) {
      const message = `❗️ WHENRESET 抓取暂时受阻\n连续失败：${state.consecutiveFailures} 次\n原因：${state.lastError}`;
      const config = await getFeishuConfig(env);
      if (config) await sendFeishu(config, message).catch(() => false);
      state.failureAlertSent = true;
      state.failureAlertAt = now();
      queueBrowserAlert(state, `fetch-error:${state.failureAlertAt}`, 'WHENRESET 抓取暂时受阻', message);
    }
    snapshot.state = state;
    await saveSnapshot(env, snapshot);
    return { ok: false, error: state.lastError, consecutiveFailures: state.consecutiveFailures };
  }

  const previousFailures = Number(state.consecutiveFailures || 0);
  const seen = new Set(state.seenIds || []);
  const newPosts = [...posts].reverse().filter((post) => !seen.has(post.id));
  const alertEvents = new Map();
  for (const post of newPosts) {
    const applied = applyPost(snapshot.events || [], post);
    snapshot.events = applied.events;
    post.classification = applied.result?.event.category || null;
    post.eventStatus = applied.result?.event.status || null;
    if (applied.result?.shouldAlert) alertEvents.set(applied.result.event.id, applied.result.event);
  }
  if (newPosts.length) {
    const byId = new Map((snapshot.posts || []).filter((post) => post.id).map((post) => [post.id, post]));
    for (const post of posts) byId.set(post.id, post);
    snapshot.posts = [...byId.values()].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, MAX_POSTS);
  }
  const notifications = [];
  for (const event of alertEvents.values()) {
    const config = await getFeishuConfig(env);
    const feishu = config ? await sendFeishu(config, eventMessage(event)).catch(() => false) : null;
    event.lastAlertedStatus = event.status;
    queueBrowserAlert(state, `${event.id}:${event.status}:${event.updatedAt}`, event.titleZh || 'WHENRESET 更新', eventMessage(event), event.lastPostUrl);
    notifications.push({ eventId: event.id, status: event.status, feishu });
  }
  state.lastNewPostAt = newPosts.map((post) => post.createdAt).sort().at(-1) || state.lastNewPostAt;
  state.lastNewPostIds = newPosts.map((post) => post.id);
  state.lastNotifications = notifications;
  state.seenIds = [...new Set([...(state.seenIds || []), ...newPosts.map((post) => post.id)])].slice(-MAX_SEEN);
  state.initialized = true;
  state.lastSuccessAt = now();
  state.consecutiveFailures = 0;
  state.lastError = null;
  state.monitorState = 'ok';
  state.postsFetched = posts.length;
  if (previousFailures >= 2 && state.failureAlertAt) {
    const message = `✅ WHENRESET 抓取已恢复\n恢复时间（UTC）：${state.lastSuccessAt}`;
    const config = await getFeishuConfig(env);
    if (config) await sendFeishu(config, message).catch(() => false);
    state.recoveryNoticeAt = now();
    queueBrowserAlert(state, `fetch-recovered:${state.recoveryNoticeAt}`, 'WHENRESET 监控已恢复', message);
  }
  state.failureAlertSent = false;
  snapshot.state = state;
  snapshot.events = [...(snapshot.events || [])].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, MAX_EVENTS);
  await saveSnapshot(env, snapshot);
  return { ok: true, postsFetched: posts.length, newPosts: state.lastNewPostIds, events: snapshot.events.length };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.method === 'GET' && url.pathname === '/api/data') {
      try {
        const snapshot = await getSnapshot(env);
        const wishes = await env.DB.prepare('SELECT count FROM wishes WHERE id = 1').first();
        const subscribers = await env.DB.prepare('SELECT COUNT(*) AS count FROM email_subscribers').first();
        const config = await getFeishuConfig(env);
        return json(buildSummary(snapshot, Number(wishes?.count || snapshot.state?.wishCount || 0), Number(subscribers?.count || 0), Boolean(config?.feishu_webhook)));
      } catch (error) { return json({ error: `数据暂时不可用：${error.message || error}` }, 503); }
    }
    if (request.method !== 'POST') return json({ ok: false, error: 'Not found' }, 404);
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return json({ ok: false, error: '跨站请求已拒绝。' }, 403);
    let payload;
    try { payload = await readBody(request); }
    catch (error) { return json({ ok: false, error: error.message }, 400); }
    if (url.pathname === '/api/wish') {
      await env.DB.prepare('UPDATE wishes SET count = count + 1 WHERE id = 1').run();
      const result = await env.DB.prepare('SELECT count FROM wishes WHERE id = 1').first();
      return json({ ok: true, count: Number(result?.count || 0) });
    }
    if (url.pathname === '/api/subscribe/email') {
      const email = String(payload.email || '').trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return json({ ok: false, error: '请输入有效邮箱地址。' }, 400);
      await env.DB.prepare('INSERT OR IGNORE INTO email_subscribers (email, created_at) VALUES (?, ?)').bind(email, now()).run();
      return json({ ok: true, smtpConfigured: false });
    }
    if (url.pathname === '/api/config/feishu') {
      if (!env.ADMIN_KEY) return json({ ok: false, error: '站点管理员尚未启用群通知配置。' }, 503);
      const adminKey = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';
      if (!safeEqual(adminKey, env.ADMIN_KEY)) return json({ ok: false, error: '管理员口令不正确。' }, 403);
      const webhook = String(payload.webhook || '').trim();
      const secret = String(payload.secret || '').trim();
      let parsed;
      try { parsed = new URL(webhook); } catch { return json({ ok: false, error: '请输入有效的飞书/Lark Webhook。' }, 400); }
      if (parsed.protocol !== 'https:' || !['open.feishu.cn', 'open.larksuite.com'].includes(parsed.hostname) || !parsed.pathname.includes('/open-apis/bot/v2/hook/')) {
        return json({ ok: false, error: '请输入飞书/Lark 群机器人的 HTTPS Webhook。' }, 400);
      }
      const config = { feishu_webhook: webhook, feishu_secret: secret };
      const sent = await sendFeishu(config, 'WHENRESET 测试通知：线上提醒通道已连接。').catch(() => false);
      if (!sent) return json({ ok: false, error: '测试消息发送失败，配置没有保存。' }, 502);
      await env.DB.prepare('INSERT INTO notification_config (id, feishu_webhook, feishu_secret) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET feishu_webhook = excluded.feishu_webhook, feishu_secret = excluded.feishu_secret')
        .bind(webhook, secret).run();
      return json({ ok: true, configured: true });
    }
    return json({ ok: false, error: 'Unknown endpoint' }, 404);
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(runMonitor(env));
  },
};
