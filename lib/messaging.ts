import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from './firebase';

/**
 * Khởi tạo Firebase Cloud Messaging cho Web
 * - Xin quyền Notification
 * - Lấy FCM token (dùng để gửi push từ Firebase Console / Server)
 * - Gắn với service worker hiện tại của app
 */
export const initFCMMessaging = async (): Promise<string | null> => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Trình duyệt không hỗ trợ Firebase Messaging');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[FCM] Trình duyệt không hỗ trợ Service Worker');
      return null;
    }

    // Xin quyền thông báo trước
    if (!('Notification' in window)) {
      console.warn('[FCM] Trình duyệt không hỗ trợ Notification API');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Người dùng chưa cho phép thông báo, bỏ qua FCM');
      return null;
    }

    const messaging = getMessaging(app);

    // Đợi service worker của app sẵn sàng để dùng chung
    const registration = await navigator.serviceWorker.ready;

    const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] Thiếu VITE_FCM_VAPID_KEY trong .env, không thể lấy token');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[FCM] Web push token:', token);
      return token;
    }

    console.warn('[FCM] Không lấy được token');
    return null;
  } catch (err) {
    console.error('[FCM] Lỗi khởi tạo messaging', err);
    return null;
  }
};


