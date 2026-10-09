const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SIGNUPS_PER_HOUR = 5;
const MAIL_BATCH_SIZE = 20;
const MAX_DELIVERY_ATTEMPTS = 5;
const MAIL_LEASE_MS = 20 * 60 * 1000;

export function isEligibleResetEvent(event) {
  if (!event || !['usage_reset', 'banked_reset'].includes(event.category)) return false;
  return event.status === 'confirmed' || (event.status === 'forecast' && Boolean(event.timeWindow));
}

export function formatEventEmail(event, unsubscribeUrl) {
  const forecast = event.status === 'forecast';
  const label = forecast ? '重置预告' : '已确认重置';
  const accent = forecast ? '#d99b36' : '#1b9b7b';
  const timeWindow = event.timeWindow || '原帖未给出时间窗';
  const safeSubjectWindow = String(timeWindow).replace(/[\r\n]+/g, ' ').slice(0, 60);
  const time = formatBeijingTime(event.updatedAt);
  const original = String(event.latestText || '');
  const postUrl = String(event.lastPostUrl || 'https://x.com/thsottiaux');
  const safeOriginal = escapeHtml(original);
  const safePostUrl = escapeHtml(postUrl);
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
  const subject = forecast
    ? `【重置预告】Codex 额度可能将在 ${safeSubjectWindow} 内重置`
    : '【已确认重置】Codex 使用额度重置已到账';
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#f2f5f4;color:#18312d;font-family:Arial,'Microsoft YaHei',sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:30px 12px;background:#f2f5f4"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e1e9e6;border-radius:16px;overflow:hidden"><tr><td style="padding:25px 30px;background:#102923;color:#eafff5"><div style="font-size:12px;letter-spacing:2px;color:#8ed7bc">WHENRESET · CODEX USAGE WATCH</div><h1 style="margin:14px 0 0;font-size:23px;line-height:1.35">${label}</h1></td></tr><tr><td style="padding:28px 30px"><div style="border-left:4px solid ${accent};padding:2px 0 2px 14px;color:#334d46;font-size:15px;line-height:1.75"><strong>${forecast ? '尚未确认到账' : '原帖已确认重置执行'}</strong><br>发布时间（北京时间）：${escapeHtml(time)}<br>原文时间窗：${escapeHtml(timeWindow)}</div><h2 style="margin:25px 0 9px;font-size:13px;color:#72827d">TIBO 的英文原文</h2><blockquote style="margin:0;padding:15px 17px;border-radius:10px;background:#f5f8f6;color:#304640;font-size:15px;line-height:1.7;white-space:pre-wrap">${safeOriginal}</blockquote><p style="margin:22px 0 0"><a href="${safePostUrl}" style="display:inline-block;padding:12px 18px;border-radius:9px;background:#18775e;color:#fff;text-decoration:none;font-weight:700">查看 X 原帖</a></p><p style="margin:26px 0 0;color:#8a9994;font-size:12px;line-height:1.7">邮件根据 Tibo 的公开 Posts 自动整理。预告表示尚未确认到账；后续确认消息可能作为同一事件更新再次通知。</p></td></tr><tr><td style="padding:17px 30px;border-top:1px solid #edf1ef;color:#8a9994;font-size:12px">WHENRESET · <a href="${safeUnsubscribeUrl}" style="color:#55786d">取消邮件订阅</a></td></tr></table></td></tr></table></body></html>`;
  const text = [
    label,
    forecast ? '状态：尚未确认到账' : '状态：原帖已确认重置执行',
    `发布时间（北京时间）：${time}`,
    `原文时间窗：${timeWindow}`,
    '',
    'Tibo 的英文原文：',
    original,
    '',
    `原帖：${postUrl}`,
    `取消订阅：${unsubscribeUrl}`,
  ].join('\n');
  return { subject, html, text };
}

function formatBeijingTime(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return String(value || '时间未知');
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function responseJson(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

function responseHtml(content, status = 200) {
  return new Response(content, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = origin && origin === new URL(env.SITE_URL).origin;
  return allowed ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  } : {};
}

function isReady(env) {
  return Boolean(env.DB && env.MONITOR_PUSH_TOKEN && env.UNSUBSCRIBE_SECRET && env.RATE_LIMIT_SECRET);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function queueMail(env, dedupeKey, recipient, message) {
  const now = new Date().toISOString();
  return env.DB.prepare(`INSERT OR IGNORE INTO mail_jobs(id, dedupe_key, recipient, message_json, status, created_at, updated_at)
    VALUES(?, ?, ?, ?, 'queued', ?, ?)`)
    .bind(crypto.randomUUID(), dedupeKey, recipient, JSON.stringify(message), now, now).run();
}

async function queueVerification(env, email, token, id, workerUrl) {
  const url = new URL('/api/verify', workerUrl);
  url.searchParams.set('token', token);
  const confirmUrl = url.toString();
  const safeUrl = escapeHtml(confirmUrl);
  await queueMail(env, `verify_${id}_${await sha256(token)}`, email, {
    subject: '请确认 WHENRESET 邮件订阅',
    text: `请打开以下链接确认订阅，链接 24 小时内有效：\n${confirmUrl}\n\n如果不是你本人操作，请忽略此邮件。`,
    html: `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><body style="margin:0;background:#f2f5f4;color:#18312d;font-family:Arial,'Microsoft YaHei',sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #e1e9e6;border-radius:14px;padding:30px"><tr><td><div style="color:#218368;font-size:12px;letter-spacing:2px">WHENRESET · CODEX USAGE WATCH</div><h1 style="font-size:23px;margin:14px 0">确认邮件订阅</h1><p style="line-height:1.7;color:#52645e">确认后，当 Tibo 的公开帖子明确预告或确认 Codex 使用额度重置时，我们会发送邮件提醒。可随时取消订阅。</p><p style="margin:25px 0"><a href="${safeUrl}" style="display:inline-block;background:#18775e;color:#fff;text-decoration:none;padding:13px 20px;border-radius:9px;font-weight:700">确认订阅</a></p><p style="font-size:12px;color:#87958f">此链接 24 小时内有效。如果不是你本人操作，请忽略此邮件。</p></td></tr></table></td></tr></table></body></html>`,
  });
}

async function readJson(request) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 16_384) throw new Error('Request body is too large.');
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 16_384) throw new Error('Request body is too large.');
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object.');
  return value;
}

function emailIsValid(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleSubscribe(request, env) {
  if (!isReady(env)) return responseJson({ ok: false, error: 'Email subscriptions are not available yet.' }, 503);
  let body;
  try { body = await readJson(request); } catch { return responseJson({ ok: false, error: 'Invalid request.' }, 400); }
  if (String(body.website || '').trim()) return responseJson({ ok: true });
  const email = String(body.email || '').trim();
  const normalized = email.toLowerCase();
  if (!emailIsValid(email) || body.consent !== true) return responseJson({ ok: false, error: 'Enter a valid email and confirm consent.' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hmac(env.RATE_LIMIT_SECRET, ip);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const attempts = await env.DB.prepare('SELECT COUNT(*) AS count FROM signup_attempts WHERE ip_hash = ? AND created_at >= ?').bind(ipHash, since).first();
  if (Number(attempts?.count || 0) >= MAX_SIGNUPS_PER_HOUR) return responseJson({ ok: false, error: 'Too many signup attempts. Try again later.' }, 429);
  await env.DB.prepare('DELETE FROM signup_attempts WHERE created_at < ?').bind(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).run();
  await env.DB.prepare('INSERT INTO signup_attempts(ip_hash, created_at) VALUES(?, ?)').bind(ipHash, new Date().toISOString()).run();

  const existing = await env.DB.prepare('SELECT id, status FROM email_subscribers WHERE email_normalized = ?').bind(normalized).first();
  if (existing?.status === 'active') return responseJson({ ok: true, message: 'If the address can be subscribed, a confirmation email has been sent.' });

  const id = existing?.id || crypto.randomUUID();
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = new Date();
  const expires = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();
  if (existing) {
    await env.DB.prepare(`UPDATE email_subscribers SET email = ?, status = 'pending', verify_token_hash = ?, verify_expires_at = ?, verification_sent_at = ?, consented_at = ?, unsubscribed_at = NULL WHERE id = ?`)
      .bind(email, tokenHash, expires, now.toISOString(), now.toISOString(), id).run();
  } else {
    await env.DB.prepare(`INSERT INTO email_subscribers(id, email, email_normalized, status, verify_token_hash, verify_expires_at, verification_sent_at, created_at, consented_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, email, normalized, 'pending', tokenHash, expires, now.toISOString(), now.toISOString(), now.toISOString()).run();
  }

  try {
    await env.DB.prepare(`DELETE FROM mail_jobs WHERE recipient = ? AND dedupe_key LIKE ? AND status IN ('queued', 'failed')`)
      .bind(email, `verify_${id}_%`).run();
    await queueVerification(env, email, token, id, request.url);
  } catch (error) {
    await env.DB.prepare(`UPDATE email_subscribers SET verify_token_hash = NULL, verify_expires_at = NULL WHERE id = ? AND status = 'pending'`).bind(id).run();
    console.error('Subscription confirmation could not be queued:', String(error));
    return responseJson({ ok: false, error: 'Confirmation email could not be queued. Please try again later.' }, 502);
  }
  return responseJson({ ok: true, message: 'If the address can be subscribed, a confirmation email has been sent.' });
}

function statusPage(title, message, siteUrl, isError = false) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const color = isError ? '#bd7254' : '#18866a';
  const target = escapeHtml(siteUrl);
  return responseHtml(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${safeTitle}</title><body style="margin:0;background:#f2f5f4;color:#18312d;font-family:Arial,'Microsoft YaHei',sans-serif"><main style="max-width:520px;margin:12vh auto;padding:32px;background:white;border:1px solid #e1e9e6;border-radius:16px"><div style="color:${color};font-size:12px;letter-spacing:2px">WHENRESET</div><h1 style="font-size:24px">${safeTitle}</h1><p style="line-height:1.7;color:#60716b">${safeMessage}</p><a href="${target}" style="display:inline-block;margin-top:12px;color:${color}">返回 WHENRESET</a></main></body></html>`);
}

async function handleVerify(request, env) {
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!token || token.length > 200) return statusPage('链接无效', '请重新提交订阅申请。', env.SITE_URL, true);
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`UPDATE email_subscribers SET status = 'active', confirmed_at = ?, verify_token_hash = NULL, verify_expires_at = NULL WHERE verify_token_hash = ? AND status = 'pending' AND verify_expires_at > ?`)
    .bind(now, tokenHash, now).run();
  if (Number(result.meta?.changes || 0) === 1) return statusPage('订阅已确认', '当出现明确的 Codex 重置预告或到账确认时，我们会发邮件提醒你。', env.SITE_URL);
  return statusPage('链接已失效', '确认链接可能已使用或超过 24 小时，请回到网站重新提交邮箱。', env.SITE_URL, true);
}

async function unsubscribeSignature(id, env) {
  return hmac(env.UNSUBSCRIBE_SECRET, id);
}

function sameSecret(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

async function handleUnsubscribe(request, env) {
  const url = new URL(request.url);
  let id = url.searchParams.get('id') || '';
  let token = url.searchParams.get('token') || '';
  if (request.method === 'POST') {
    const type = request.headers.get('Content-Type') || '';
    if (type.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      id = String(body.id || id);
      token = String(body.token || token);
    } else {
      const body = new URLSearchParams(await request.text());
      id = body.get('id') || id;
      token = body.get('token') || token;
    }
  }
  const expectedToken = id ? await unsubscribeSignature(id, env) : '';
  if (!id || id.length > 128 || !token || token.length > 128 || !sameSecret(expectedToken, token)) {
    return statusPage('链接无效', '无法验证退订链接。', env.SITE_URL, true);
  }
  if (request.method === 'GET') {
    const safeId = escapeHtml(id);
    const safeToken = escapeHtml(token);
    return responseHtml(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="margin:0;background:#f2f5f4;font-family:Arial,'Microsoft YaHei',sans-serif;color:#18312d"><main style="max-width:520px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #e1e9e6;border-radius:16px"><h1>取消邮件订阅</h1><p style="color:#60716b">确认后将不再收到 WHENRESET 邮件。</p><form method="post" action="/api/unsubscribe"><input type="hidden" name="id" value="${safeId}"><input type="hidden" name="token" value="${safeToken}"><button style="padding:12px 18px;border:0;border-radius:8px;background:#18775e;color:#fff;font-weight:700">确认取消订阅</button></form></main></body></html>`);
  }
  await env.DB.prepare(`UPDATE email_subscribers SET status = 'unsubscribed', unsubscribed_at = ?, verify_token_hash = NULL, verify_expires_at = NULL WHERE id = ?`)
    .bind(new Date().toISOString(), id).run();
  await env.DB.prepare(`DELETE FROM mail_jobs WHERE recipient = (SELECT email FROM email_subscribers WHERE id = ?) AND status IN ('queued', 'failed')`).bind(id).run();
  return statusPage('已取消订阅', '此邮箱将不再收到 WHENRESET 提醒。', env.SITE_URL);
}

async function handleMonitorEvent(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const suppliedToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!env.MONITOR_PUSH_TOKEN || !sameSecret(env.MONITOR_PUSH_TOKEN, suppliedToken)) {
    return responseJson({ ok: false, error: 'Unauthorized.' }, 401);
  }
  let event;
  try { event = await readJson(request); } catch { return responseJson({ ok: false, error: 'Invalid event.' }, 400); }
  if (!isEligibleResetEvent(event)) return responseJson({ ok: true, queued: false, reason: 'not_actionable' });
  const eventId = String(event.id || event.lastPostId || '');
  if (!eventId) return responseJson({ ok: false, error: 'Event id is required.' }, 400);
  const eventKey = `${eventId}:${event.status}`;
  const now = new Date().toISOString();
  const origin = new URL(request.url).origin;
  const active = await env.DB.prepare(`SELECT id, email FROM email_subscribers WHERE status = 'active'`).all();
  const statements = [];
  for (const subscriber of active.results) {
    const unsubscribeUrl = await makeUnsubscribeUrl(origin, subscriber.id, env);
    const message = formatEventEmail(event, unsubscribeUrl);
    statements.push(env.DB.prepare(`INSERT OR IGNORE INTO mail_jobs(id, dedupe_key, recipient, message_json, status, created_at, updated_at)
      VALUES(?, ?, ?, ?, 'queued', ?, ?)`)
      .bind(crypto.randomUUID(), `${eventKey}:${subscriber.id}`, subscriber.email, JSON.stringify(message), now, now));
  }
  for (let index = 0; index < statements.length; index += 50) {
    await env.DB.batch(statements.slice(index, index + 50));
  }
  return responseJson({ ok: true, queued: true, eventKey, jobCount: statements.length });
}

function makeUnsubscribeUrl(origin, id, env) {
  const url = new URL('/api/unsubscribe', origin);
  url.searchParams.set('id', id);
  return unsubscribeSignature(id, env).then((token) => {
    url.searchParams.set('token', token);
    return url.toString();
  });
}

async function handleMailClaim(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const suppliedToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!env.MONITOR_PUSH_TOKEN || !sameSecret(env.MONITOR_PUSH_TOKEN, suppliedToken)) {
    return responseJson({ ok: false, error: 'Unauthorized.' }, 401);
  }
  const now = new Date();
  await env.DB.prepare(`UPDATE mail_jobs SET status = 'queued', lease_until = NULL, updated_at = ? WHERE status = 'sending' AND lease_until <= ?`)
    .bind(now.toISOString(), now.toISOString()).run();
  const rows = await env.DB.prepare(`SELECT id, recipient, message_json, attempts FROM mail_jobs
    WHERE status IN ('queued', 'failed') AND attempts < ? ORDER BY created_at LIMIT ?`)
    .bind(MAX_DELIVERY_ATTEMPTS, MAIL_BATCH_SIZE).all();
  const jobs = [];
  const leaseUntil = new Date(now.getTime() + MAIL_LEASE_MS).toISOString();
  for (const row of rows.results) {
    const result = await env.DB.prepare(`UPDATE mail_jobs SET status = 'sending', attempts = attempts + 1, lease_until = ?, updated_at = ?
      WHERE id = ? AND status IN ('queued', 'failed') AND attempts < ?`)
      .bind(leaseUntil, now.toISOString(), row.id, MAX_DELIVERY_ATTEMPTS).run();
    if (Number(result.meta?.changes || 0) !== 1) continue;
    jobs.push({ id: row.id, recipient: row.recipient, ...JSON.parse(row.message_json) });
  }
  return responseJson({ ok: true, jobs });
}

async function handleMailAck(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const suppliedToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!env.MONITOR_PUSH_TOKEN || !sameSecret(env.MONITOR_PUSH_TOKEN, suppliedToken)) {
    return responseJson({ ok: false, error: 'Unauthorized.' }, 401);
  }
  let body;
  try { body = await readJson(request); } catch { return responseJson({ ok: false, error: 'Invalid acknowledgement.' }, 400); }
  const id = String(body.id || '');
  if (!id || id.length > 128 || typeof body.sent !== 'boolean') return responseJson({ ok: false, error: 'Invalid acknowledgement.' }, 400);
  const now = new Date().toISOString();
  const result = body.sent
    ? await env.DB.prepare(`UPDATE mail_jobs SET status = 'sent', lease_until = NULL, updated_at = ?, last_error = NULL WHERE id = ? AND status = 'sending'`).bind(now, id).run()
    : await env.DB.prepare(`UPDATE mail_jobs SET status = 'failed', lease_until = NULL, updated_at = ?, last_error = ? WHERE id = ? AND status = 'sending'`)
      .bind(now, String(body.error || 'SMTP send failed').slice(0, 300), id).run();
  return responseJson({ ok: true, updated: Number(result.meta?.changes || 0) === 1 });
}

const worker = {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return responseJson({ ready: isReady(env) }, 200, cors);
      }
      if (url.pathname === '/api/subscribe' && request.method === 'POST') {
        return await handleSubscribe(request, env).then((response) => withHeaders(response, cors));
      }
      if (url.pathname === '/api/verify' && request.method === 'GET') return await handleVerify(request, env);
      if (url.pathname === '/api/unsubscribe' && ['GET', 'POST'].includes(request.method)) return await handleUnsubscribe(request, env);
      if (url.pathname === '/api/monitor/event' && request.method === 'POST') return await handleMonitorEvent(request, env).then((response) => withHeaders(response, cors));
      if (url.pathname === '/api/monitor/mail/claim' && request.method === 'POST') return await handleMailClaim(request, env).then((response) => withHeaders(response, cors));
      if (url.pathname === '/api/monitor/mail/ack' && request.method === 'POST') return await handleMailAck(request, env).then((response) => withHeaders(response, cors));
      return responseJson({ ok: false, error: 'Not found.' }, 404, cors);
    } catch (error) {
      console.error('Email API request failed:', error instanceof Error ? error.stack : String(error));
      return responseJson({ ok: false, error: 'The request could not be completed.' }, 500, cors);
    }
  },
};

function withHeaders(response, headers) {
  const merged = new Headers(response.headers);
  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: merged });
}

export default worker;
