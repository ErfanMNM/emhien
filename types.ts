
export interface Course {
  id: number;
  fullname: string;
  shortname: string;
  viewurl: string;
  coursecategory: string;
}

export interface EventIcon {
  component: string;
  alttext: string;
  iconurl: string;
}

export interface Action {
  name: string;
  url: string;
  actionable: boolean;
}

export interface CalendarEvent {
  id: number;
  name: string;
  description: string;
  location: string;
  component: string;
  modulename: string;
  activityname: string;
  timestart: number;
  timesort: number;
  visible: number;
  icon: EventIcon;
  course: Course;
  url: string;
  action?: Action;
  formattedtime: string;
  isactionevent: boolean;
  eventtype?: string;
  isPersonal?: boolean;
}

export interface CalendarDay {
  seconds: number;
  minutes: number;
  hours: number;
  mday: number;
  wday: number;
  year: number;
  yday: number;
  istoday: boolean;
  isweekend: boolean;
  timestamp: number;
  events: CalendarEvent[];
  hasevents: boolean;
  viewdaylinktitle?: string;
}

export interface CalendarWeek {
  days: CalendarDay[];
  prepadding: number[];
  postpadding: number[];
}

export interface CalendarData {
  url: string;
  courseid: number;
  categoryid?: number;
  filter_selector?: string;
  weeks: CalendarWeek[];
  daynames: { dayno: number; shortname: string; fullname: string }[];
  view?: string;
  date?: any;
  periodname: string;
}

// Cấu trúc mới: Một Schedule chứa nhiều tháng (periods)
export interface MultiMonthData {
  periods: Record<string, CalendarData>; // key là periodname (e.g. "tháng 12 2025")
  lastUpdatedPeriod: string;
}

export interface RootObject {
  error: boolean;
  data: CalendarData;
}

export interface ScheduleMetadata {
  id: string;
  name: string;
  updatedAt: string;
  months?: string[]; // Danh sách các tháng đã nạp
}

export type ThemeColor = 'blue' | 'rose' | 'emerald' | 'violet' | 'luxury';
export type AppView = 'weekly' | 'calendar' | 'list' | 'uikit';

// PWA Install Prompt Type
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}