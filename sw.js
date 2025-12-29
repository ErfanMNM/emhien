
const CACHE_NAME = 'lms-scheduler-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm'
];

// Cài đặt: Lưu trữ các tài nguyên quan trọng vào cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache từng file riêng lẻ để không fail khi một số file không tồn tại
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => {
            console.warn('[SW] Failed to cache:', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Kích hoạt: Xóa các cache cũ nếu có
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Request alarms data from clients when activating
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'REQUEST_ALARMS_DATA' });
        });
      })
    ])
  );
  self.clients.claim();
});

// Xử lý yêu cầu mạng: Ưu tiên Cache -> Mạng
self.addEventListener('fetch', (event) => {
  // Không cache các yêu cầu không phải GET hoặc chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Trả về từ cache, đồng thời cập nhật cache ngầm (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {}); // Bỏ qua lỗi mạng khi đang offline
        
        return cachedResponse;
      }

      // Nếu không có trong cache, tải từ mạng
      return fetch(event.request).then((response) => {
        // Lưu vào cache để dùng lần sau
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    }).catch(() => {
      // Nếu cả mạng và cache đều hỏng (hiếm gặp), có thể trả về trang offline mặc định
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});

// Click vào thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (action === 'dismiss') {
        return;
      }
      
      // Focus existing window or open new one
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus().then(() => {
            // Notify client about the notification click
            if (notificationData && notificationData.eventId) {
              client.postMessage({
                type: 'NOTIFICATION_CLICKED',
                eventId: notificationData.eventId
              });
            }
          });
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow('/').then((client) => {
          if (client && notificationData && notificationData.eventId) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              eventId: notificationData.eventId
            });
          }
        });
      }
    })
  );
});

// Background Alarm Checking - Chạy ngầm để kiểm tra alarms
let alarmsData = null;
let alarmCheckInterval = null;

// Nhận dữ liệu alarms từ main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_ALARMS') {
    alarmsData = event.data.payload;
    console.log('[SW] Alarms data updated', alarmsData);
  }
  
  if (event.data && event.data.type === 'START_BACKGROUND_ALARMS') {
    startBackgroundAlarmCheck();
  }
  
  if (event.data && event.data.type === 'STOP_BACKGROUND_ALARMS') {
    stopBackgroundAlarmCheck();
  }
});

function startBackgroundAlarmCheck() {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
  }
  
  // Check alarms every 30 seconds in background
  alarmCheckInterval = setInterval(() => {
    checkAlarms();
  }, 30000);
  
  // Also check immediately
  checkAlarms();
  console.log('[SW] Background alarm checking started');
}

function stopBackgroundAlarmCheck() {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
    console.log('[SW] Background alarm checking stopped');
  }
}

async function checkAlarms() {
  if (!alarmsData || !alarmsData.events || alarmsData.events.length === 0) {
    return;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const { events, alarms, notifiedEvents } = alarmsData;
  
  events.forEach(event => {
    const alarmMins = alarms[event.id];
    if (alarmMins === undefined || alarmMins === null) return;
    
    // Skip if already notified
    if (notifiedEvents && notifiedEvents.includes(event.id)) return;
    
    const triggerTime = event.timestart - (alarmMins * 60);
    
    // Check if should trigger
    if (now >= triggerTime && now <= event.timestart + 300) {
      triggerBackgroundNotification(event, alarmMins);
      
      // Notify main app that event was notified
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'ALARM_TRIGGERED',
            eventId: event.id
          });
        });
      });
    }
  });
}

function triggerBackgroundNotification(event, alarmMins) {
  const title = 'Hiền Ham Học - Nhắc nhở';
  const body = alarmMins === 0
    ? `Sự kiện "${event.activityname}" đang bắt đầu!`
    : `Sắp diễn ra: "${event.activityname}" trong ${alarmMins} phút nữa.`;
  
  const icon = event.icon?.iconurl || '/icon-192.png';
  
  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    tag: `alarm-${event.id}`,
    data: {
      eventId: event.id,
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'Xem chi tiết'
      },
      {
        action: 'dismiss',
        title: 'Đóng'
      }
    ]
  });
  
  console.log('[SW] Background notification triggered:', title, body);
}

// Periodic Background Sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-alarms') {
      event.waitUntil(checkAlarms());
    }
  });
}

// Generic Push Notification handler (Firebase Cloud Messaging / Web Push)
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { body: event.data.text() };
  }

  const anyData = /** @type {any} */ (data);

  const title =
    (anyData.notification && anyData.notification.title) ||
    anyData.title ||
    'Hiền Ham Học';

  const body =
    (anyData.notification && anyData.notification.body) ||
    anyData.body ||
    'Bạn có thông báo mới';

  const icon =
    (anyData.notification && anyData.notification.icon) ||
    anyData.icon ||
    '/icon-192.png';

  const notificationData = anyData.data || {};

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icon-192.png',
      data: notificationData,
      tag: anyData.tag || 'hien-ham-hoc',
      requireInteraction: true,
    })
  );
});
