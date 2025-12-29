import webpush from 'web-push';

export interface Env {
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Simple health check
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Endpoint: gửi thử một push notification ngay lập tức
    if (request.method === 'POST' && url.pathname === '/api/push/test') {
      try {
        const body = (await request.json()) as {
          subscription: any;
          title?: string;
          body?: string;
        };

        if (!body.subscription) {
          return new Response(JSON.stringify({ error: 'Missing subscription' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        webpush.setVapidDetails(
          env.VAPID_SUBJECT,
          env.VAPID_PUBLIC_KEY,
          env.VAPID_PRIVATE_KEY
        );

        await webpush.sendNotification(
          body.subscription,
          JSON.stringify({
            title: body.title || 'Hiền Ham Học',
            body: body.body || 'Thông báo test từ Cloudflare Worker',
          })
        );

        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error('Push error', err);
        return new Response(JSON.stringify({ error: 'Push failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Mặc định: serve static assets từ dist (SPA)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};


