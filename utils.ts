
import { CalendarEvent, ThemeColor } from "./types";

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
 * Check if event should be hidden (e.g., "Gia hạn" quizzes)
 */
export const shouldHideEvent = (event: CalendarEvent): boolean => {
  // Ẩn bài kiểm tra (quiz) có chữ "gia hạn" (case insensitive)
  if (event.modulename === 'quiz' && event.activityname.toLowerCase().includes('gia hạn')) {
    return true;
  }
  return false;
};

/**
 * Returns color classes based on the activity module name and importance
 */
export const getEventColor = (event: CalendarEvent): string => {
  if (event.isPersonal) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }

  // Special highlighting for Video Conferences
  if (isVideoConference(event)) {
    return 'bg-amber-100 text-amber-900 border-amber-400 ring-1 ring-amber-400 font-semibold shadow-sm';
  }

  switch (event.modulename) {
    case 'quiz':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'assign':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'forum':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'personal':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
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
