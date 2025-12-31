
import { CalendarEvent, ThemeColor, CalendarData } from "./types";

/**
 * Converts a Unix timestamp (seconds) to a formatted date string
 */
export const formatDate = (timestamp: number): string => {
  // Convert seconds to milliseconds
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatShortDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'numeric',
  }).format(date);
};

/**
 * Loại bỏ thẻ HTML hoặc xử lý chuỗi văn bản có chứa HTML từ LMS
 */
export const cleanHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
};

/**
 * Check if an event is a Video Conference
 */
export const isVideoConference = (event: CalendarEvent): boolean => {
  const name = event.name?.toLowerCase() || '';
  const activity = event.activityname?.toLowerCase() || '';
  const type = event.eventtype?.toLowerCase() || '';
  
  return type === 'videoconference' || 
         name.includes('video conference') || 
         activity.includes('video conference') || 
         name.includes('google meet') || 
         name.includes('zoom');
};

/**
 * Check if event should be hidden
 * Đã bỏ lọc "Gia hạn" để hiển thị hết các bài cũ
 */
export const shouldHideEvent = (event: CalendarEvent): boolean => {
  // Logic cũ: Ẩn bài kiểm tra (quiz) có chữ "gia hạn"
  // if (event.modulename === 'quiz' && event.activityname.toLowerCase().includes('gia hạn')) {
  //   return true;
  // }
  return false;
};

/**
 * Returns detailed style object based on event type
 */
export const getEventStyle = (event: CalendarEvent) => {
  if (event.isPersonal) {
    return {
      bg: 'bg-fuchsia-50',
      border: 'border-fuchsia-200',
      text: 'text-fuchsia-900',
      subText: 'text-fuchsia-600',
      iconBg: 'bg-fuchsia-100',
      iconText: 'text-fuchsia-600',
      badge: 'bg-fuchsia-100 text-fuchsia-700',
      dot: 'bg-fuchsia-400'
    };
  }

  if (isVideoConference(event)) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      subText: 'text-amber-700',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-800',
      dot: 'bg-amber-500'
    };
  }

  switch (event.modulename) {
    case 'quiz':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-900',
        subText: 'text-rose-700',
        iconBg: 'bg-rose-100',
        iconText: 'text-rose-600',
        badge: 'bg-rose-100 text-rose-700',
        dot: 'bg-rose-500'
      };
    case 'assign':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        subText: 'text-blue-700',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-500'
      };
    case 'forum':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
        subText: 'text-emerald-700',
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700',
        dot: 'bg-emerald-500'
      };
    default:
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-900',
        subText: 'text-slate-600',
        iconBg: 'bg-slate-100',
        iconText: 'text-slate-500',
        badge: 'bg-slate-100 text-slate-600',
        dot: 'bg-slate-400'
      };
  }
};

/**
 * Returns color classes based on the activity module name and importance (Legacy support)
 */
export const getEventColor = (event: CalendarEvent): string => {
  const style = getEventStyle(event);
  return `${style.bg} ${style.text} ${style.border}`;
};

export const getEventIconColor = (modulename: string): string => {
  switch (modulename) {
    case 'quiz': return 'text-red-500';
    case 'assign': return 'text-blue-500';
    case 'forum': return 'text-green-500';
    case 'personal': return 'text-purple-500';
    default: return 'text-gray-500';
  }
};

/**
 * Filter events by course ID
 */
export const filterEventsByCourse = (events: CalendarEvent[], courseId: string): CalendarEvent[] => {
  if (courseId === 'all') return events;
  if (courseId === 'personal') {
      return events.filter(e => e.isPersonal);
  }
  return events.filter(event => event.course.id.toString() === courseId);
};

/**
 * Helper to get theme colors with full Tailwind classes
 */
export const getThemeColors = (theme: ThemeColor) => {
  switch (theme) {
    case 'luxury':
      return {
        bg: 'bg-slate-900',
        bgHover: 'hover:bg-black',
        bgLight: 'bg-slate-50',
        bgMedium: 'bg-slate-100',
        text: 'text-slate-800',
        textDark: 'text-slate-900',
        textLight: 'text-slate-500',
        border: 'border-slate-200',
        borderHover: 'hover:border-slate-400',
        ring: 'ring-slate-800',
        shadow: 'shadow-slate-300',
        activeItem: 'bg-slate-900 text-amber-100' // Dark luxury with Gold text
      };
    case 'rose':
      return {
        bg: 'bg-rose-500',
        bgHover: 'hover:bg-rose-600',
        bgLight: 'bg-rose-50',
        bgMedium: 'bg-rose-100',
        text: 'text-rose-500',
        textDark: 'text-rose-700',
        textLight: 'text-rose-400',
        border: 'border-rose-200',
        borderHover: 'hover:border-rose-300',
        ring: 'ring-rose-500',
        shadow: 'shadow-rose-200',
        activeItem: 'bg-rose-100 text-rose-800'
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-600',
        bgHover: 'hover:bg-emerald-700',
        bgLight: 'bg-emerald-50',
        bgMedium: 'bg-emerald-100',
        text: 'text-emerald-600',
        textDark: 'text-emerald-700',
        textLight: 'text-emerald-500',
        border: 'border-emerald-200',
        borderHover: 'hover:border-emerald-300',
        ring: 'ring-emerald-500',
        shadow: 'shadow-emerald-200',
        activeItem: 'bg-emerald-100 text-emerald-800'
      };
    case 'violet':
      return {
        bg: 'bg-violet-600',
        bgHover: 'hover:bg-violet-700',
        bgLight: 'bg-violet-50',
        bgMedium: 'bg-violet-100',
        text: 'text-violet-600',
        textDark: 'text-violet-700',
        textLight: 'text-violet-500',
        border: 'border-violet-200',
        borderHover: 'hover:border-violet-300',
        ring: 'ring-violet-500',
        shadow: 'shadow-violet-200',
        activeItem: 'bg-violet-100 text-violet-800'
      };
    case 'blue':
    default:
      return {
        bg: 'bg-blue-600',
        bgHover: 'hover:bg-blue-700',
        bgLight: 'bg-blue-50',
        bgMedium: 'bg-blue-100',
        text: 'text-blue-600',
        textDark: 'text-blue-700',
        textLight: 'text-blue-500',
        border: 'border-blue-200',
        borderHover: 'hover:border-blue-300',
        ring: 'ring-blue-500',
        shadow: 'shadow-blue-200',
        activeItem: 'bg-blue-100 text-blue-800'
      };
  }
};

/**
 * Notification Helpers
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    alert("Trình duyệt này không hỗ trợ thông báo hệ thống.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = async (title: string, body: string, icon?: string) => {
  if (Notification.permission === "granted") {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body,
          icon: icon || '/vite.svg',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          tag: 'lms-alert'
        } as any);
        return;
      } catch (e) {
        console.error("SW notification failed, falling back", e);
      }
    }

    new Notification(title, {
      body,
      icon: icon || '/vite.svg',
      requireInteraction: true
    });
  }
};

/**
 * Cloudflare Worker Web Push Helpers
 * - Đăng ký subscription Web Push với VAPID public key
 * - Gửi subscription lên endpoint /api/push/test trên Worker để test ngay
 * - Lưu subscription vào localStorage để dùng lại
 */
const WORKER_VAPID_PUBLIC_KEY =
  'BG_EgHJTWkd_VYz9Smnaxxk0RdEnOx36kvRPZ7x9jVM6XKxMkWVgYIcbU4j0HiO-X6xPbvlWXqxk8pU7MkHeyA4';

const STORAGE_KEY_WEB_PUSH_SUBSCRIPTION = 'web_push_subscription';

/**
 * Lưu Web Push subscription vào localStorage
 */
export const saveWebPushSubscription = (subscription: PushSubscription) => {
  try {
    const subJson = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
      },
    };
    localStorage.setItem(STORAGE_KEY_WEB_PUSH_SUBSCRIPTION, JSON.stringify(subJson));
    console.log('[WebPush] Subscription đã lưu vào localStorage');
  } catch (e) {
    console.error('[WebPush] Lỗi lưu subscription:', e);
  }
};

/**
 * Lấy Web Push subscription từ localStorage
 */
export const getWebPushSubscription = (): any | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_WEB_PUSH_SUBSCRIPTION);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[WebPush] Lỗi đọc subscription:', e);
  }
  return null;
};

/**
 * Đảm bảo đã đăng ký Web Push subscription (nếu chưa có thì đăng ký)
 */
export const ensureWebPushSubscription = async (): Promise<PushSubscription | null> => {
  if (typeof window === 'undefined') return null;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[WebPush] Trình duyệt không hỗ trợ Web Push');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[WebPush] Chưa có quyền Notification');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  // Kiểm tra xem đã có subscription chưa
  let subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
    // Nếu chưa có, thử load từ localStorage
    const stored = getWebPushSubscription();
    if (stored) {
      try {
        // Thử subscribe lại với subscription cũ
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(WORKER_VAPID_PUBLIC_KEY),
        });
      } catch (e) {
        console.warn('[WebPush] Không thể restore subscription cũ, tạo mới:', e);
      }
    }

    // Nếu vẫn chưa có, tạo mới
    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(WORKER_VAPID_PUBLIC_KEY),
        });
        console.log('[WebPush] Đã tạo subscription mới');
      } catch (e) {
        console.error('[WebPush] Lỗi tạo subscription:', e);
        return null;
      }
    }

    // Lưu subscription mới vào localStorage
    saveWebPushSubscription(subscription);
  } else {
    console.log('[WebPush] Đã có subscription sẵn');
  }

  return subscription;
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeWebPushWithWorker = async () => {
  if (typeof window === 'undefined') return;

  console.log('[WebPush] Bắt đầu đăng ký Web Push...');

  const subscription = await ensureWebPushSubscription();
  if (!subscription) {
    alert('❌ Không thể đăng ký Web Push. Kiểm tra Console để xem chi tiết.');
    return;
  }

  // Dùng absolute URL để đảm bảo gọi đúng domain Worker
  const apiUrl = `${window.location.origin}/api/push/test`;
  console.log('[WebPush] Gửi subscription lên:', apiUrl);

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        },
        title: 'Hiền Ham Học (Worker)',
        body: 'Thông báo test từ Cloudflare Worker',
      }),
    });

    console.log('[WebPush] Response status:', res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[WebPush] Response error:', errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const result = await res.json();
    console.log('[WebPush] Response OK:', result);
    alert('✅ Đã đăng ký Web Push với Cloudflare Worker.\nĐang gửi thông báo test...\n\nKiểm tra notification trong vài giây!');
  } catch (e) {
    console.error('[WebPush] Lỗi khi gửi request:', e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    alert('❌ Gửi thông báo test qua Cloudflare Worker thất bại.\n\nLỗi: ' + errorMsg + '\n\nKiểm tra Console để xem chi tiết.');
  }
};

/**
 * Đồng bộ alarms data lên Worker để Worker có thể gửi push notification khi đến giờ
 */
export const syncAlarmsToWorker = async (events: any[], alarms: Record<number, number>) => {
  const subscription = await ensureWebPushSubscription();
  if (!subscription) {
    console.warn('[WebPush] Không có subscription, bỏ qua sync alarms');
    return;
  }

  const apiUrl = `${window.location.origin}/api/push/sync-alarms`;
  console.log('[WebPush] Đồng bộ alarms lên Worker...');

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        },
        events: events.map(e => ({
          id: e.id,
          activityname: e.activityname,
          timestart: e.timestart,
          icon: e.icon?.iconurl || '/icon-192.png',
        })),
        alarms,
      }),
    });

    if (!res.ok) {
      console.error('[WebPush] Sync alarms failed:', res.status);
      return;
    }

    console.log('[WebPush] Đã đồng bộ alarms lên Worker');
  } catch (e) {
    console.error('[WebPush] Lỗi sync alarms:', e);
  }
};

/**
 * Cập nhật istoday cho calendar data dựa trên ngày hiện tại
 */
export const updateTodayFlag = (calendarData: CalendarData): CalendarData => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayTimestamp = Math.floor(todayStart.getTime() / 1000);
  
  const updatedWeeks = calendarData.weeks.map(week => ({
    ...week,
    days: week.days.map(day => {
      // So sánh timestamp để xác định ngày hôm nay
      // Làm tròn timestamp về đầu ngày (00:00:00) để so sánh chính xác
      const dayStart = new Date(day.timestamp * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayStartTimestamp = Math.floor(dayStart.getTime() / 1000);
      
      return {
        ...day,
        istoday: dayStartTimestamp === todayTimestamp
      };
    })
  }));
  
  return {
    ...calendarData,
    weeks: updatedWeeks
  };
};

/**
 * Lunar Calendar (Lịch Âm) Helpers
 */
export interface LunarDayInfo {
  lunarDate: string; // Ngày âm lịch, ví dụ: "10-11-2025"
  isGoodDay: boolean | null; // true = tốt, false = xấu, null = không xác định
}

// Cache để tránh request nhiều lần
const lunarCache = new Map<string, LunarDayInfo>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 giờ

/**
 * Lấy thông tin lịch âm cho một ngày cụ thể
 * Sử dụng CORS proxy hoặc direct fetch nếu có thể
 */
export const getLunarDayInfo = async (timestamp: number): Promise<LunarDayInfo | null> => {
  const date = new Date(timestamp * 1000);
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  
  // Kiểm tra cache
  const cached = lunarCache.get(dateKey);
  if (cached) {
    return cached;
  }

  try {
    // Format ngày để query xemlicham.com
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // URL format: https://www.xemlicham.com/am-lich/nam/{year}/thang/{month}/ngay/{day}
    // Sử dụng CORS proxy nếu cần (có thể thay bằng API của bạn)
    const url = `https://www.xemlicham.com/am-lich/nam/${year}/thang/${month}/ngay/${day}`;
    
    // Thử fetch trực tiếp (có thể bị CORS block)
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/html',
        }
      });
    } catch (corsError) {
      // Nếu bị CORS, thử dùng proxy hoặc fallback
      console.warn('[Lunar] CORS error, sử dụng fallback pattern');
      return getLunarDayInfoFallback(timestamp);
    }

    if (!response.ok) {
      console.warn(`[Lunar] Không thể lấy dữ liệu cho ${dateKey}, dùng fallback`);
      return getLunarDayInfoFallback(timestamp);
    }

    const html = await response.text();
    
    // Parse HTML để lấy thông tin
    // Tìm ngày âm lịch - thường có format như "10-11-2025" hoặc "10/11/2025"
    const lunarDateMatch = html.match(/Âm Lịch[^<]*(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/i) ||
                              html.match(/ngày[^<]*(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/i);
    
    let lunarDate = '';
    if (lunarDateMatch) {
      lunarDate = `${lunarDateMatch[1]}-${lunarDateMatch[2]}-${lunarDateMatch[3]}`;
    }

    // Tìm ngày tốt/xấu - cải thiện logic parse
    let isGoodDay: boolean | null = null;
    
    // Kiểm tra text "MÀU ĐỎ: NGÀY TỐT" hoặc "MÀU TÍM: NGÀY XẤU" - tìm chính xác hơn
    const goodDayPattern = /MÀU\s*ĐỎ[:\s]*NGÀY\s*TỐT|ngày\s*tốt/i;
    const badDayPattern = /MÀU\s*TÍM[:\s]*NGÀY\s*XẤU|ngày\s*xấu/i;
    
    if (goodDayPattern.test(html)) {
      isGoodDay = true;
    } else if (badDayPattern.test(html)) {
      isGoodDay = false;
    }

    // Kiểm tra trong bảng lịch - tìm link hoặc cell chứa ngày hiện tại
    if (isGoodDay === null) {
      // Tìm trong bảng lịch tháng - tìm link có chứa ngày
      const dayLinkPattern = new RegExp(`<a[^>]*href[^>]*ngay[/-]${day}[^>]*>`, 'i');
      const dayLinkMatch = html.match(dayLinkPattern);
      
      if (dayLinkMatch) {
        // Tìm màu của link hoặc cell chứa link này
        const linkIndex = html.indexOf(dayLinkMatch[0]);
        const beforeLink = html.substring(Math.max(0, linkIndex - 500), linkIndex);
        const afterLink = html.substring(linkIndex, Math.min(html.length, linkIndex + 500));
        const context = beforeLink + afterLink;
        
        // Tìm màu trong context
        const colorMatch = context.match(/color[^:]*:\s*#([0-9a-fA-F]{6})|color[^:]*:\s*(red|green|purple|violet)/i);
        if (colorMatch) {
          const color = colorMatch[1]?.toLowerCase() || colorMatch[2]?.toLowerCase();
          if (color === 'red' || color === 'green' || (color && color.startsWith('ff'))) {
            isGoodDay = true;
          } else if (color === 'purple' || color === 'violet' || (color && (color.startsWith('8') || color.startsWith('9')))) {
            isGoodDay = false;
          }
        }
      }
      
      // Nếu vẫn chưa tìm thấy, thử tìm trong bảng lịch với pattern khác
      if (isGoodDay === null) {
        // Tìm cell có chứa ngày và có style màu
        const cellPattern = new RegExp(`<td[^>]*>\\s*(<[^>]*>)*\\s*${day}\\s*(<[^>]*>)*[^<]*style[^>]*color[^:]*:([^;>]+)`, 'i');
        const cellMatch = html.match(cellPattern);
        if (cellMatch && cellMatch[3]) {
          const colorValue = cellMatch[3].trim().toLowerCase();
          if (colorValue.includes('red') || colorValue.includes('#ff') || colorValue.includes('green')) {
            isGoodDay = true;
          } else if (colorValue.includes('purple') || colorValue.includes('violet') || colorValue.includes('#8') || colorValue.includes('#9')) {
            isGoodDay = false;
          }
        }
      }
    }

    const result: LunarDayInfo = {
      lunarDate: lunarDate || dateKey,
      isGoodDay
    };

    // Lưu vào cache
    lunarCache.set(dateKey, result);
    
    // Xóa cache sau 24 giờ
    setTimeout(() => {
      lunarCache.delete(dateKey);
    }, CACHE_DURATION);

    return result;
  } catch (error) {
    console.error('[Lunar] Lỗi khi lấy thông tin lịch âm:', error);
    // Fallback nếu có lỗi
    return getLunarDayInfoFallback(timestamp);
  }
};

/**
 * Fallback: Tính toán đơn giản dựa trên pattern (không chính xác 100%)
 * Chỉ dùng khi không fetch được từ web
 */
const getLunarDayInfoFallback = (timestamp: number): LunarDayInfo | null => {
  const date = new Date(timestamp * 1000);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  
  // Pattern đơn giản: ngày chẵn thường tốt hơn, ngày lẻ có thể xấu
  // Đây chỉ là fallback, không chính xác
  const isGoodDay = day % 2 === 0;
  
  // Ước tính ngày âm (không chính xác, chỉ để hiển thị)
  const estimatedLunarDay = Math.max(1, Math.min(30, day - 2));
  const estimatedLunarMonth = month;
  
  return {
    lunarDate: `${estimatedLunarDay}-${estimatedLunarMonth}-${date.getFullYear()}`,
    isGoodDay
  };
};

/**
 * Lấy thông tin lịch âm cho nhiều ngày (batch)
 */
export const getLunarDayInfoBatch = async (timestamps: number[]): Promise<Map<number, LunarDayInfo>> => {
  const results = new Map<number, LunarDayInfo>();
  
  // Lấy thông tin cho từng ngày (có thể tối ưu sau)
  const promises = timestamps.map(async (ts) => {
    const info = await getLunarDayInfo(ts);
    if (info) {
      results.set(ts, info);
    }
  });

  await Promise.all(promises);
  return results;
};