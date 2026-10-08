# Free Cloudflare deployment

This package serves the existing dashboard, checks Tibo's public X Posts every ten minutes, and stores the current posts/events in D1. It does not log in to X, use the X API, or call an AI model. The historical public archive is bundled as an initial snapshot; the monitor replaces the live state after its first successful scheduled run.

The Worker and D1 are designed for Cloudflare's Free plans. The current documented free limits include 100,000 Worker requests/day, 10 ms CPU per request and per Cron run, and D1 allowances of 5 million rows read/day, 100,000 rows written/day, and 5 GB storage. Stay on the Free plans and do not enable paid add-ons. If an account exceeds a Free limit, requests can be limited; this project does not automatically upgrade the account.

## First deployment

Run these commands in PowerShell from the project root. `wrangler login` opens Cloudflare's sign-in/authorization page; the rest of the deployment uses the signed-in account.

```powershell
npx wrangler login
npx wrangler d1 create whenreset-codex-monitor
```

Copy the returned database ID into `cloudflare/wrangler.toml`, replacing `REPLACE_AFTER_D1_CREATE`. Then initialize the database, build the public assets/history bundle, and deploy:

```powershell
npx wrangler d1 migrations apply whenreset-codex-monitor --remote --config cloudflare/wrangler.toml
node cloudflare/build.mjs
npx wrangler deploy --config cloudflare/wrangler.toml
```

The successful deployment prints the public `workers.dev` URL. The first scheduled check runs on Cloudflare's next ten-minute boundary. Open `/api/data` on that URL to see the live monitor state.

## Optional Feishu group alerts

The webpage protects its shared Feishu configuration with a server-side administrator key. Set one privately in Cloudflare before entering a webhook through the site:

```powershell
npx wrangler secret put ADMIN_KEY --config cloudflare/wrangler.toml
```

The prompt is hidden by Wrangler. Do not put the key in source files, screenshots, or chat. Once configured, the site asks for that key before sending a Feishu test message and saving the webhook/signing secret in D1. The local `data/notification-config.json` is never copied or uploaded.

Email addresses entered on the page are stored in D1, but no email sender is configured in this free deployment. The page labels this clearly; browser notifications work while the page remains open. Do not add real subscriber data until an email sender and privacy notice are in place.

## Updating

After changing the site's source or history data, run:

```powershell
node cloudflare/build.mjs
npx wrangler deploy --config cloudflare/wrangler.toml
```

The local Python preview and Windows monitor remain available independently.
