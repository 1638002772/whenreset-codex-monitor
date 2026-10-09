import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { formatEventEmail, isEligibleResetEvent } from '../src/index.js';

test('only clear reset forecasts and confirmations are mailed', () => {
  assert.equal(isEligibleResetEvent({ category: 'usage_reset', status: 'forecast', timeWindow: 'within the hour' }), true);
  assert.equal(isEligibleResetEvent({ category: 'banked_reset', status: 'confirmed' }), true);
  assert.equal(isEligibleResetEvent({ category: 'usage_reset', status: 'forecast' }), false);
  assert.equal(isEligibleResetEvent({ category: 'compensation', status: 'confirmed' }), false);
  assert.equal(isEligibleResetEvent({ category: null, status: 'confirmed' }), false);
});

test('reset email includes source details and escapes post content in HTML', () => {
  const message = formatEventEmail({
    id: 'event-1',
    category: 'usage_reset',
    status: 'forecast',
    updatedAt: '2026-10-08T02:00:00Z',
    timeWindow: 'within the hour',
    latestText: '<script>reset soon</script>',
    lastPostUrl: 'https://x.com/thsottiaux/status/123',
  }, 'https://example.test/unsubscribe?id=abc&token=def');

  assert.match(message.subject, /重置预告/);
  assert.match(message.html, /within the hour/);
  assert.match(message.html, /&lt;script&gt;reset soon&lt;\/script&gt;/);
  assert.doesNotMatch(message.html, /<script>/);
  assert.match(message.html, /https:\/\/x\.com\/thsottiaux\/status\/123/);
  assert.match(message.html, /unsubscribe\?id=abc&amp;token=def/);
  assert.match(message.text, /尚未确认到账/);
});

test('monitor webhook rejects an invalid token', async () => {
  const response = await worker.fetch(new Request('https://worker.test/api/monitor/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'usage_reset', status: 'confirmed', id: '1' }),
  }), { MONITOR_PUSH_TOKEN: 'expected' });

  assert.equal(response.status, 401);
});

test('mail queue endpoints require the monitor token', async () => {
  for (const path of ['/api/monitor/mail/claim', '/api/monitor/mail/ack']) {
    const response = await worker.fetch(new Request(`https://worker.test${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'job-1', sent: true }),
    }), { MONITOR_PUSH_TOKEN: 'expected' });

    assert.equal(response.status, 401);
  }
});

test('email service health does not require a third-party mail API or custom sender domain', async () => {
  const response = await worker.fetch(new Request('https://worker.test/api/health'), {
    DB: {},
    MONITOR_PUSH_TOKEN: 'monitor-token',
    UNSUBSCRIBE_SECRET: 'unsubscribe-secret',
    RATE_LIMIT_SECRET: 'rate-limit-secret',
  });

  assert.deepEqual(await response.json(), { ready: true });
});

test('email confirmation succeeds once, then reports the link as used', async () => {
  let pending = true;
  const env = {
    SITE_URL: 'https://1638002772.github.io/whenreset-codex-monitor/',
    DB: {
      prepare() {
        return {
          bind() {
            return {
              async run() {
                if (!pending) return { meta: { changes: 0 } };
                pending = false;
                return { meta: { changes: 1 } };
              },
            };
          },
        };
      },
    },
  };
  const makeRequest = () => new Request('https://worker.test/api/verify', {
    method: 'POST',
    headers: {
      Origin: 'https://1638002772.github.io',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ token: 'single-use-token' }),
  });

  const first = await worker.fetch(makeRequest(), env);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { ok: true, message: 'Subscription confirmed.' });
  assert.equal(first.headers.get('Access-Control-Allow-Origin'), 'https://1638002772.github.io');

  const second = await worker.fetch(makeRequest(), env);
  assert.equal(second.status, 410);
  assert.deepEqual(await second.json(), { ok: false, error: 'Confirmation link is invalid or expired.' });
});

test('monitor webhook ignores non-reset events', async () => {
  const response = await worker.fetch(new Request('https://worker.test/api/monitor/event', {
    method: 'POST',
    headers: { Authorization: 'Bearer expected', 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'compensation', status: 'confirmed', id: '1' }),
  }), { MONITOR_PUSH_TOKEN: 'expected' });

  assert.deepEqual(await response.json(), { ok: true, queued: false, reason: 'not_actionable' });
});
