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

    // Endpoint: đồng bộ alarms data từ client lên Worker
    // Worker sẽ lưu vào KV hoặc memory để check và gửi push khi đến giờ
    if (request.method === 'POST' && url.pathname === '/api/push/sync-alarms') {
      try {
        const body = (await request.json()) as {
          subscription: any;
          events: Array<{ id: number; activityname: string; timestart: number; icon?: string }>;
          alarms: Record<number, number>;
        };

        if (!body.subscription || !body.events || !body.alarms) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // TODO: Lưu vào KV store hoặc D1 database để check scheduled alarms
        // Hiện tại chỉ log để debug
        console.log('[Worker] Received alarms sync:', {
          eventsCount: body.events.length,
          alarmsCount: Object.keys(body.alarms).length,
        });

        // Check và gửi push ngay nếu có alarm sắp đến giờ
        const now = Math.floor(Date.now() / 1000);
        for (const event of body.events) {
          const alarmMins = body.alarms[event.id];
          if (alarmMins === undefined || alarmMins === null) continue;

          const triggerTime = event.timestart - (alarmMins * 60);
          // Nếu đã đến giờ hoặc sắp đến (trong vòng 1 phút)
          if (now >= triggerTime - 60 && now <= event.timestart + 300) {
            const title = 'Hiền Ham Học - Nhắc nhở';
            const bodyText = alarmMins === 0
              ? `Sự kiện "${event.activityname}" đang bắt đầu!`
              : `Sắp diễn ra: "${event.activityname}" trong ${alarmMins} phút nữa.`;

            webpush.setVapidDetails(
              env.VAPID_SUBJECT,
              env.VAPID_PUBLIC_KEY,
              env.VAPID_PRIVATE_KEY
            );

            await webpush.sendNotification(
              body.subscription,
              JSON.stringify({
                title,
                body: bodyText,
                icon: event.icon || '/icon-192.png',
                tag: `alarm-${event.id}`,
                data: { eventId: event.id },
              })
            );

            console.log('[Worker] Sent push notification for event:', event.id);
          }
        }

        return new Response(JSON.stringify({ ok: true, synced: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error('Sync alarms error', err);
        return new Response(JSON.stringify({ error: 'Sync failed' }), {
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


