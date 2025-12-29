
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, List as ListIcon, GraduationCap, Filter, Loader2, Settings, UploadCloud, Menu, Clock, Bell, Plus, Info, Eye, EyeOff, WifiOff, LogOut, User, LayoutTemplate, Download } from 'lucide-react';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import WeeklySchedule from './components/WeeklySchedule';
import EventModal from './components/EventModal';
import DataSettingsModal from './components/DataSettingsModal';
import Sidebar from './components/Sidebar';
import AddPersonalEventModal from './components/AddPersonalEventModal';
import MobileBottomNav from './components/MobileBottomNav';
import AuthPage from './components/AuthPage';
import HeartsBackground from './components/HeartsBackground';
import UIKit from './components/UIKit';
import AlarmRingingModal from './components/AlarmRingingModal';
import AboutPage from './components/AboutPage';
import { CalendarEvent, Course, CalendarData, ScheduleMetadata, ThemeColor, AppView, MultiMonthData, BeforeInstallPromptEvent } from './types';
import { filterEventsByCourse, shouldHideEvent, requestNotificationPermission, getThemeColors, sendNotification } from './utils';
import { initDB, getSchedulesFromDB, getFullScheduleData, saveScheduleToDB, updateEventMetaInDB, deletePersonalEventFromDB, markEventAsNotified } from './lib/db';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const LS_KEY_THEME = 'lms_theme_color';

const App: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleMetadata[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  const [currentScheduleName, setCurrentScheduleName] = useState<string>("Lịch học");
  
  const [multiMonthData, setMultiMonthData] = useState<MultiMonthData | null>(null);
  const [completedEvents, setCompletedEvents] = useState<Set<number>>(new Set());
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  const [alarms, setAlarms] = useState<Record<number, number>>({});
  const [notifiedEvents, setNotifiedEvents] = useState<Set<number>>(new Set());
  
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  const theme = getThemeColors(themeColor);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [view, setView] = useState<AppView>('weekly');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [ringingEvent, setRingingEvent] = useState<CalendarEvent | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    console.log('[PWA] Is installed check:', isStandalone);
    if (isStandalone) {
      setIsInstalled(true);
    }
  }, []);

  useEffect(() => {
    init();
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
    });
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event captured');
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    console.log('[PWA] Install prompt listener registered');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const init = async () => {
    setIsLoadingDB(true);
    const success = await initDB();
    if (success) {
        refreshSchedules(true);
        const savedTheme = localStorage.getItem(LS_KEY_THEME) as ThemeColor;
        if (savedTheme) setThemeColor(savedTheme);
    }
    setIsLoadingDB(false);
  };

  const refreshSchedules = (isInitial: boolean = false) => {
    const dbSchedules = getSchedulesFromDB();
    setSchedules(dbSchedules);
    if (isInitial && dbSchedules.length > 0) {
        handleLoadSchedule(dbSchedules[0].id);
    } else if (currentScheduleId) {
        handleLoadSchedule(currentScheduleId);
    }
  };

  const handleLoadSchedule = (id: string) => {
    const fullData = getFullScheduleData(id);
    const scheduleMeta = getSchedulesFromDB().find(s => s.id === id);
    if (fullData && scheduleMeta) {
        setCurrentScheduleId(id);
        setCurrentScheduleName(scheduleMeta.name);
        setMultiMonthData(fullData.multiMonth);
        setPersonalEvents(fullData.personalEvents);
        setCompletedEvents(new Set(fullData.completed));
        setAlarms(fullData.alarms);
        setNotifiedEvents(new Set(fullData.notifiedEvents));
    } else {
        setMultiMonthData(null);
        setCurrentScheduleId(null);
    }
    setSelectedCourse('all');
  };

  const allEvents = useMemo(() => {
    if (!multiMonthData) return [];
    const events: CalendarEvent[] = [];
    (Object.values(multiMonthData.periods) as CalendarData[]).forEach((period: CalendarData) => {
        period.weeks.forEach(week => {
            week.days.forEach(day => {
                if (day.hasevents) {
                    const visibleEvents = day.events.filter(e => !shouldHideEvent(e));
                    events.push(...visibleEvents);
                }
            });
        });
    });
    events.push(...personalEvents);
    const uniqueEvents = new Map<number, CalendarEvent>();
    events.forEach(e => { if (!uniqueEvents.has(e.id)) uniqueEvents.set(e.id, e); });
    return Array.from(uniqueEvents.values()).sort((a, b) => a.timestart - b.timestart);
  }, [multiMonthData, personalEvents]);

  // --- ALARM CHECK LOGIC ---
  useEffect(() => {
    const checkAlarms = () => {
        if (allEvents.length === 0) return;
        
        const now = Math.floor(Date.now() / 1000);
        
        allEvents.forEach(event => {
            const alarmMins = alarms[event.id];
            if (alarmMins === undefined || alarmMins === null) return;
            
            // Nếu đã thông báo rồi thì bỏ qua
            if (notifiedEvents.has(event.id)) return;
            
            const triggerTime = event.timestart - (alarmMins * 60);
            
            // Logic kích hoạt: 
            // 1. Thời gian hiện tại >= Thời gian kích hoạt
            // 2. Thời gian hiện tại chưa vượt quá thời gian bắt đầu sự kiện (để tránh báo các sự kiện quá cũ khi mới mở app)
            // 3. Hoặc nếu "Đúng giờ" (alarmMins == 0) thì cho phép trễ 5 phút
            if (now >= triggerTime && now <= event.timestart + 300) {
                 triggerAlarm(event);
            }
        });
    };

    const interval = setInterval(checkAlarms, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [allEvents, alarms, notifiedEvents]);

  const triggerAlarm = (event: CalendarEvent) => {
      // 1. Show UI Modal
      setRingingEvent(event);
      
      // 2. Browser Notification
      const mins = alarms[event.id];
      const body = mins === 0 
          ? `Sự kiện "${event.activityname}" đang bắt đầu!` 
          : `Sắp diễn ra: "${event.activityname}" trong ${mins} phút nữa.`;
      sendNotification("Hiền Ham Học", body, event.icon.iconurl);

      // 3. Mark as notified in DB & State to prevent re-ring
      markEventAsNotified(event.id);
      setNotifiedEvents(prev => new Set(prev).add(event.id));
  };

  const handleSetTheme = (color: ThemeColor) => {
      setThemeColor(color);
      localStorage.setItem(LS_KEY_THEME, color);
  };

  const handleImportSchedule = async (newData: CalendarData, name: string, isNew: boolean) => {
      setIsSaving(true);
      const id = (isNew || !currentScheduleId) ? Date.now().toString() : currentScheduleId!;
      let updatedMultiMonth: MultiMonthData;
      if (isNew || !multiMonthData) {
          updatedMultiMonth = {
              periods: { [newData.periodname]: newData },
              lastUpdatedPeriod: newData.periodname
          };
      } else {
          updatedMultiMonth = {
              ...multiMonthData,
              periods: { ...multiMonthData.periods, [newData.periodname]: newData },
              lastUpdatedPeriod: newData.periodname
          };
      }
      const eventsToKeep = isNew ? [] : personalEvents;
      saveScheduleToDB(id, name, updatedMultiMonth, eventsToKeep);
      setMultiMonthData(updatedMultiMonth);
      setPersonalEvents(eventsToKeep);
      setCurrentScheduleId(id);
      setCurrentScheduleName(name);
      refreshSchedules();
      setIsSaving(false);
  };

  const toggleEventCompletion = (id: number) => {
    setCompletedEvents(prev => {
      const next = new Set<number>(prev);
      const isNowCompleted = !next.has(id);
      if (isNowCompleted) next.add(id); else next.delete(id);
      const currentAlarm = alarms[id] !== undefined ? alarms[id] : null;
      updateEventMetaInDB(id, isNowCompleted, currentAlarm);
      return next;
    });
  };

  const handleSetAlarm = (id: number, mins: number | null) => {
      setAlarms(prev => {
          const next = { ...prev };
          if (mins === null) delete next[id]; else next[id] = mins;
          const isComp = completedEvents.has(id);
          updateEventMetaInDB(id, isComp, mins);
          
          // Reset notified status if user changes alarm
          if (notifiedEvents.has(id)) {
              setNotifiedEvents(prev => {
                  const nextNotify = new Set(prev);
                  nextNotify.delete(id);
                  return nextNotify;
              });
              // Note: We don't clear last_notified_at in DB here to keep history, 
              // but purely for logic, re-setting alarm implies wanting to be notified again.
          }
          
          return next;
      });
  };

  const handleAddPersonalEvent = (d: any) => {
      const ts = Math.floor(new Date(`${d.date}T${d.time}`).getTime()/1000);
      const newEvent: CalendarEvent = { 
          id: Date.now(), activityname: d.title, description: d.description, 
          timestart: ts, timesort: ts, formattedtime: d.time, isPersonal: true, 
          icon: { iconurl: "", component: "", alttext: "" }, 
          course: { id: 0, fullname: "Cá nhân", shortname: "Cá nhân", viewurl: "", coursecategory: "" }, 
          modulename: "personal", name: d.title, location: "", component: "personal", visible: 1, url: "", isactionevent: true
      };
      const nextPersonal = [...personalEvents, newEvent];
      setPersonalEvents(nextPersonal);
      if (currentScheduleId) saveScheduleToDB(currentScheduleId, currentScheduleName, multiMonthData, nextPersonal);
  };

  const handleDeletePersonalEvent = (id: number) => {
      const nextPersonal = personalEvents.filter(e => e.id !== id);
      setPersonalEvents(nextPersonal);
      deletePersonalEventFromDB(id);
      if (currentScheduleId) saveScheduleToDB(currentScheduleId, currentScheduleName, multiMonthData, nextPersonal);
  };

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setInstallPrompt(null);
  };

  const filteredEvents = useMemo(() => filterEventsByCourse(allEvents, selectedCourse), [allEvents, selectedCourse]);

  const courses = useMemo(() => {
    const uniqueCourses = new Map<number, Course>();
    allEvents.forEach(event => { if (!uniqueCourses.has(event.course.id)) uniqueCourses.set(event.course.id, event.course); });
    return Array.from(uniqueCourses.values());
  }, [allEvents]);

  if (showAuth) return <AuthPage onLoginSuccess={() => setShowAuth(false)} onBack={() => setShowAuth(false)} />;
  if (isLoadingDB) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" /><p className="font-bold text-gray-600">Nạp Database SQLite...</p></div></div>;
  if (view === 'uikit') return <UIKit onBack={() => setView('weekly')} currentTheme={themeColor} />;
  if (view === 'about') return <AboutPage onBack={() => setView('weekly')} themeColor={themeColor} />;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans text-gray-900">
      <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          schedules={schedules}
          currentScheduleId={currentScheduleId}
          onSelectSchedule={handleLoadSchedule}
          onCreateNew={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRequestNotification={requestNotificationPermission}
          onOpenUIKit={() => { setView('uikit'); setIsSidebarOpen(false); }}
          onOpenAbout={() => { setView('about'); setIsSidebarOpen(false); }}
          themeColor={themeColor}
          installPrompt={installPrompt}
          isInstalled={isInstalled}
          onInstallPWA={handleInstallPWA}
      />

      {themeColor === 'rose' && <HeartsBackground />}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Header - Optimized for Mobile */}
        <header className="bg-white/90 backdrop-blur-md shrink-0 z-30 px-4 py-3 border-b border-gray-100 transition-all sticky top-0">
            <div className="flex justify-between items-center max-w-5xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-white shadow-sm ${theme.bg}`}><GraduationCap size={24} /></div>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-none sm:leading-normal">
                           <span>Hiền Ham Học</span>
                           <span className="text-[10px] bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white px-2 py-0.5 rounded-full uppercase font-black shadow-lg border border-amber-300 w-fit mt-1 sm:mt-0 animate-pulse" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Siêu Vip</span>
                           {!isOnline && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase w-fit mt-1 sm:mt-0"><WifiOff size={10} className="inline mr-1"/>Offline</span>}
                        </h1>
                        {currentScheduleName && <p className="text-xs text-gray-500 font-medium truncate max-w-[200px] sm:max-w-none">{currentScheduleName}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {user ? (
                        <div className="flex items-center gap-1 sm:gap-2 pl-1 pr-1 sm:px-3 py-1 bg-green-50 rounded-full border border-green-100 cursor-pointer" onClick={() => setShowAuth(true)}>
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                                <User size={14} />
                            </div>
                            <span className="text-xs font-bold text-green-700 max-w-[80px] truncate hidden sm:block">{user.displayName || 'User'}</span>
                        </div>
                    ) : (
                        <button onClick={() => setShowAuth(true)} className="p-2 sm:px-4 sm:py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
                            <span className="hidden sm:inline">Đăng nhập</span>
                            <span className="sm:hidden"><User size={20} /></span>
                        </button>
                    )}
                    
                    <div className="hidden lg:flex bg-gray-100/50 p-1 rounded-full border border-gray-200">
                        <button onClick={() => setView('weekly')} disabled={!multiMonthData} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${view === 'weekly' ? `bg-white ${theme.textDark} shadow-sm` : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><Clock size={16} /> Tuần</button>
                        <button onClick={() => setView('calendar')} disabled={!multiMonthData} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${view === 'calendar' ? `bg-white ${theme.textDark} shadow-sm` : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><CalendarIcon size={16} /> Lịch</button>
                        <button onClick={() => setView('list')} disabled={!multiMonthData} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${view === 'list' ? `bg-white ${theme.textDark} shadow-sm` : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><ListIcon size={16} /> DS</button>
                    </div>

                    {/* Install PWA Button in Header - Always visible if not installed */}
                    {!isInstalled && (
                      <button 
                        onClick={handleInstallPWA}
                        className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        title="Cài đặt App"
                      >
                        <Download size={16} />
                        <span>Cài App</span>
                      </button>
                    )}
                    <button onClick={() => setIsSettingsOpen(true)} className={`hidden lg:block p-2.5 text-gray-500 ${theme.text} ${theme.bgLight} rounded-full transition-colors`}><Settings size={20} /></button>
                </div>
            </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 overflow-y-auto pb-24 sm:pb-8 pt-2 sm:pt-6">
            {isSaving && <div className="fixed top-20 right-8 bg-white p-3 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-gray-100 animate-bounce"><Loader2 className="animate-spin text-blue-600" size={18} /><span className="text-xs font-bold">Ghi vào DB...</span></div>}
            
            {!multiMonthData ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-sm mb-6 border border-gray-100"><UploadCloud size={64} className={`${theme.textLight} mx-auto mb-4`} /><h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có lịch được nạp</h2><p className="text-gray-500 max-w-xs mx-auto mb-6">Mọi thay đổi của bạn sẽ được lưu trực tiếp vào cơ sở dữ liệu SQLite cục bộ và hỗ trợ đồng bộ Firebase Cloud.</p><button onClick={() => setIsSettingsOpen(true)} className={`px-8 py-3 ${theme.bg} text-white rounded-full font-semibold shadow-lg ${theme.shadow}`}>Bắt đầu ngay</button></div>
                </div>
            ) : (
                <>
                    {/* Filter Bar */}
                    <div className="px-4 sm:px-0 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="relative w-full sm:w-[280px] group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"><Filter size={18} /></div>
                                <select 
                                    value={selectedCourse} 
                                    onChange={(e) => setSelectedCourse(e.target.value)} 
                                    className="block w-full pl-11 pr-10 py-3 text-sm font-medium border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 rounded-2xl shadow-sm bg-white appearance-none truncate transition-shadow"
                                >
                                    <option value="all">Tất cả các khóa học</option>
                                    <option value="personal">✦ Kế hoạch cá nhân</option>
                                    {courses.filter(c => c.id !== 0).map(course => (<option key={course.id} value={course.id}>{course.shortname}</option>))}
                                </select>
                            </div>

                             <button 
                                onClick={() => setShowCompleted(!showCompleted)} 
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border transition-all shadow-sm w-full sm:w-auto
                                    ${showCompleted ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                                `}
                            >
                                {showCompleted ? <Eye size={18} /> : <EyeOff size={18} />}
                                <span>{showCompleted ? "Hiện việc đã xong" : "Ẩn việc đã xong"}</span>
                            </button>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-3 sm:px-0">
                        {view === 'calendar' ? (
                            <CalendarView periods={multiMonthData.periods} filteredCourseId={selectedCourse} onEventClick={setSelectedEvent} alarms={alarms} themeColor={themeColor} completedEvents={completedEvents} showCompleted={showCompleted} />
                        ) : view === 'list' ? (
                            <ListView events={filteredEvents} completedEvents={completedEvents} onEventClick={setSelectedEvent} onToggleComplete={toggleEventCompletion} alarms={alarms} themeColor={themeColor} showCompleted={showCompleted} />
                        ) : (
                            <WeeklySchedule events={allEvents} completedEvents={completedEvents} onToggleComplete={toggleEventCompletion} alarms={alarms} onEventClick={setSelectedEvent} themeColor={themeColor} showCompleted={showCompleted} setShowCompleted={setShowCompleted} />
                        )}
                    </div>
                </>
            )}
        </main>

        <button
            onClick={() => setIsAddEventOpen(true)}
            className={`fixed right-4 bottom-20 lg:bottom-8 lg:right-8 w-14 h-14 rounded-2xl ${theme.bg} text-white shadow-lg ${theme.shadow} flex items-center justify-center z-40 transition-transform active:scale-90 hover:scale-105`}
            aria-label="Thêm sự kiện"
        >
            <Plus size={32} />
        </button>

        <MobileBottomNav 
            currentView={view} 
            onChangeView={setView} 
            onOpenMenu={() => setIsSidebarOpen(true)}
            themeColor={themeColor}
        />

        {ringingEvent && (
            <AlarmRingingModal 
                event={ringingEvent} 
                onDismiss={() => setRingingEvent(null)}
                onSnooze={() => {
                    handleSetAlarm(ringingEvent.id, 5); // Snooze for 5 minutes
                    setRingingEvent(null);
                }}
            />
        )}

        <EventModal event={selectedEvent} isCompleted={selectedEvent ? completedEvents.has(selectedEvent.id) : false} alarmMinutes={selectedEvent ? (alarms[selectedEvent.id] !== undefined ? alarms[selectedEvent.id] : null) : null} onToggleComplete={toggleEventCompletion} onSetAlarm={handleSetAlarm} onDelete={handleDeletePersonalEvent} onClose={() => setSelectedEvent(null)} themeColor={themeColor} />
        <AddPersonalEventModal isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} onAdd={handleAddPersonalEvent} />
        <DataSettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            onImport={handleImportSchedule} 
            currentScheduleName={currentScheduleName} 
            themeColor={themeColor} 
            onSetTheme={handleSetTheme} 
            existingMonths={multiMonthData ? Object.keys(multiMonthData.periods) : []}
            onRefreshApp={() => refreshSchedules(true)}
            onOpenAuth={() => setShowAuth(true)}
        />
      </div>
    </div>
  );
};

export default App;
