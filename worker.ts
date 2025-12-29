import webpush from 'web-push';

export interface Env {
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ASSETS: Fetcher;
  ALARMS_KV?: KVNamespace;
}

/**
 * Helper function để check alarms và gửi push notification
 */
async function checkAndSendAlarms(
  env: Env,
  alarmsData: {
    subscription: any;
    events: Array<{ id: number; activityname: string; timestart: number; icon?: string }>;
    alarms: Record<number, number>;
  }
) {
  const now = Math.floor(Date.now() / 1000);
  const notifiedEvents = new Set<number>();

  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );

  for (const event of alarmsData.events) {
    const alarmMins = alarmsData.alarms[event.id];
    if (alarmMins === undefined || alarmMins === null) continue;

    const triggerTime = event.timestart - (alarmMins * 60);
    
    // Check nếu đã đến giờ (trong vòng 5 phút sau trigger time để tránh miss)
    if (now >= triggerTime && now <= event.timestart + 300) {
      // Kiểm tra xem đã gửi notification chưa (dựa vào KV)
      const notificationKey = `notified_${event.id}_${Math.floor(triggerTime / 60)}`;
      
      if (env.ALARMS_KV) {
        const alreadyNotified = await env.ALARMS_KV.get(notificationKey);
        if (alreadyNotified) {
          continue; // Đã gửi rồi, bỏ qua
        }
      }

      const title = 'Hiền Ham Học - Nhắc nhở';
      const bodyText = alarmMins === 0
        ? `Sự kiện "${event.activityname}" đang bắt đầu!`
        : `Sắp diễn ra: "${event.activityname}" trong ${alarmMins} phút nữa.`;

      try {
        await webpush.sendNotification(
          alarmsData.subscription,
          JSON.stringify({
            title,
            body: bodyText,
            icon: event.icon || '/icon-192.png',
            tag: `alarm-${event.id}`,
            data: { eventId: event.id },
            requireInteraction: true,
          })
        );

        console.log('[Worker] ✅ Đã gửi push notification cho event:', event.id, event.activityname);

        // Đánh dấu đã gửi để tránh gửi lại
        if (env.ALARMS_KV) {
          await env.ALARMS_KV.put(notificationKey, '1', { expirationTtl: 3600 }); // Expire sau 1 giờ
        }

        notifiedEvents.add(event.id);
      } catch (err) {
        console.error('[Worker] ❌ Lỗi gửi push notification cho event', event.id, ':', err);
      }
    }
  }

  return notifiedEvents.size;
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

        // Lưu alarms data vào KV store để scheduled job có thể check
        const alarmsData = {
          subscription: body.subscription,
          events: body.events,
          alarms: body.alarms,
          lastUpdated: Date.now(),
        };

        if (env.ALARMS_KV) {
          await env.ALARMS_KV.put('alarms_data', JSON.stringify(alarmsData));
          console.log('[Worker] Đã lưu alarms data vào KV');
        } else {
          console.warn('[Worker] KV namespace chưa được cấu hình, alarms sẽ không được lưu');
        }

        // Check và gửi push ngay nếu có alarm sắp đến giờ
        await checkAndSendAlarms(env, alarmsData);

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

  /**
   * Scheduled handler: chạy mỗi phút để check alarms và gửi push notification
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[Worker] ⏰ Scheduled job chạy lúc:', new Date().toISOString());

    if (!env.ALARMS_KV) {
      console.warn('[Worker] KV namespace chưa được cấu hình, bỏ qua scheduled check');
      return;
    }

    try {
      // Đọc alarms data từ KV
      const alarmsDataStr = await env.ALARMS_KV.get('alarms_data');
      if (!alarmsDataStr) {
        console.log('[Worker] Không có alarms data trong KV');
        return;
      }

      const alarmsData = JSON.parse(alarmsDataStr) as {
        subscription: any;
        events: Array<{ id: number; activityname: string; timestart: number; icon?: string }>;
        alarms: Record<number, number>;
        lastUpdated: number;
      };

      // Kiểm tra xem data có cũ quá không (quá 7 ngày thì xóa)
      const daysSinceUpdate = (Date.now() - alarmsData.lastUpdated) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 7) {
        console.log('[Worker] Alarms data quá cũ, xóa khỏi KV');
        await env.ALARMS_KV.delete('alarms_data');
        return;
      }

      // Check và gửi push notification
      const sentCount = await checkAndSendAlarms(env, alarmsData);
      
      if (sentCount > 0) {
        console.log(`[Worker] ✅ Đã gửi ${sentCount} push notification(s)`);
      } else {
        console.log('[Worker] Không có alarm nào cần gửi');
      }
    } catch (err) {
      console.error('[Worker] ❌ Lỗi trong scheduled job:', err);
    }
  },
};


