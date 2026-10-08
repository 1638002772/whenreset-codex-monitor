const PROFILE_URL = "https://x.com/thsottiaux";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (url.pathname !== "/profile") {
      return new Response("Not found", { status: 404 });
    }
    if (!env.PROFILE_PROXY_TOKEN || request.headers.get("Authorization") !== `Bearer ${env.PROFILE_PROXY_TOKEN}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const response = await fetch(PROFILE_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) {
        return new Response(`Upstream returned HTTP ${response.status}`, { status: 502 });
      }
      const html = await response.text();
      if (html.length < 10_000 || !html.includes("VHdlZXQ6")) {
        return new Response("X page did not contain public SSR post data", { status: 502 });
      }
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new Response("Could not fetch the public X profile", { status: 502 });
    }
  },
};
