export default {
  async fetch(request, env, ctx) {
    const ua = request.headers.get("user-agent") || "";
    const url = new URL(request.url);
    const isAsset = /\.(png|jpe?g|gif|webp|svg|ico|css|js|map|txt|xml)$/i.test(url.pathname);
    const isHTMLAccept = (request.headers.get("accept") || "").includes("text/html");
    const isBot = /Googlebot|Bingbot|LinkedInBot|Twitterbot|facebookexternalhit|Slackbot|WhatsApp|DuckDuckBot|YandexBot/i.test(ua);

    // Users: serve static + SPA fallback
    if (!isBot || isAsset) {
      const res = await env.ASSETS.fetch(request);
      if (res.status === 404 && request.method === "GET" && isHTMLAccept) {
        return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
      }
      return res;
    }

    // Bots: forward to Prerender
    const target = `${url.origin}${url.pathname}${url.search}`; // fragments aren't sent to servers
    let base = (env.PRERENDER_BASE || "https://service.prerender.io").replace(/\/+$/,"");
    if (!/^https?:\/\//i.test(base)) base = `https://${base}`;

    const hdrs = new Headers();
    if (env.PRERENDER_TOKEN) hdrs.set("X-Prerender-Token", env.PRERENDER_TOKEN);

    let upstream = await fetch(`${base}/${target}`, { headers: hdrs });
    if (upstream.status === 404 || upstream.status === 400) {
      upstream = await fetch(`${base}/render?url=${encodeURIComponent(target)}`, { headers: hdrs });
    }
    if (upstream.status === 404 || upstream.status === 400) {
      upstream = await fetch(`${base}/render?uri=${encodeURIComponent(target)}`, { headers: hdrs });
    }

    if (env.PRERENDER_DEBUG === "1") {
      const h = new Headers(upstream.headers);
      h.set("x-debug-prerender-base", base);
      h.set("x-debug-upstream-status", String(upstream.status));
      h.set("x-debug-token-present", env.PRERENDER_TOKEN ? "true" : "false");
      return new Response(upstream.body, { status: upstream.status, headers: h });
    }
    return upstream;
  }
};
