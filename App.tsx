
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, List as ListIcon, GraduationCap, Filter, Loader2, Settings, UploadCloud, Menu, Clock, Bell, Plus, Info, Eye, EyeOff, WifiOff, Wifi } from 'lucide-react';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import WeeklySchedule from './components/WeeklySchedule';
import EventModal from './components/EventModal';
import DataSettingsModal from './components/DataSettingsModal';
import Sidebar from './components/Sidebar';
import AlarmRingingModal from './components/AlarmRingingModal';
import AddPersonalEventModal from './components/AddPersonalEventModal';
import HeartsBackground from './components/HeartsBackground';
import UIKit from './components/UIKit';
import { CalendarEvent, Course, CalendarData, ScheduleMetadata, ThemeColor, AppView, MultiMonthData } from './types';
import { filterEventsByCourse, shouldHideEvent, requestNotificationPermission, getThemeColors } from './utils';
import { initDB, getSchedulesFromDB, getFullScheduleData, saveScheduleToDB, updateEventMetaInDB, deletePersonalEventFromDB } from './lib/db';

const LS_KEY_THEME = 'lms_theme_color';

const App: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleMetadata[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  const [currentScheduleName, setCurrentScheduleName] = useState<string>("Lịch học");
  
  const [multiMonthData, setMultiMonthData] = useState<MultiMonthData | null>(null);
  const [completedEvents, setCompletedEvents] = useState<Set<number>>(new Set());
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  const [alarms, setAlarms] = useState<Record<number, number>>({});
  
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  const theme = getThemeColors(themeColor);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [view, setView] = useState<AppView>('weekly');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // 1. Initialize DB and Network status
  useEffect(() => {
    init();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
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
    } else {
        setMultiMonthData(null);
        setCurrentScheduleId(null);
    }
    setSelectedCourse('all');
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
          return next;
      });
  };

  const handleAddPersonalEvent = (d: any) => {
      const ts = Math.floor(new Date(`${d.date}T${d.time}`).getTime()/1000);
      const newEvent: CalendarEvent = { 
          id: Date.now(), 
          activityname: d.title, 
          description: d.description, 
          timestart: ts, 
          timesort: ts,
          formattedtime: d.time, 
          isPersonal: true, 
          icon: { iconurl: "", component: "", alttext: "" }, 
          course: { id: 0, fullname: "Cá nhân", shortname: "Cá nhân", viewurl: "", coursecategory: "" }, 
          modulename: "personal",
          name: d.title,
          location: "",
          component: "personal",
          visible: 1,
          url: "",
          isactionevent: true
      };

      const nextPersonal = [...personalEvents, newEvent];
      setPersonalEvents(nextPersonal);
      if (currentScheduleId) {
          saveScheduleToDB(currentScheduleId, currentScheduleName, multiMonthData, nextPersonal);
      }
  };

  const handleDeletePersonalEvent = (id: number) => {
      const nextPersonal = personalEvents.filter(e => e.id !== id);
      setPersonalEvents(nextPersonal);
      deletePersonalEventFromDB(id);
      if (currentScheduleId) {
          saveScheduleToDB(currentScheduleId, currentScheduleName, multiMonthData, nextPersonal);
      }
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

  const filteredEvents = useMemo(() => filterEventsByCourse(allEvents, selectedCourse), [allEvents, selectedCourse]);

  const courses = useMemo(() => {
    const uniqueCourses = new Map<number, Course>();
    allEvents.forEach(event => { if (!uniqueCourses.has(event.course.id)) uniqueCourses.set(event.course.id, event.course); });
    return Array.from(uniqueCourses.values());
  }, [allEvents]);

  if (isLoadingDB) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" /><p className="font-bold text-gray-600">Nạp Database SQLite...</p></div></div>;
  if (view === 'uikit') return <UIKit onBack={() => setView('weekly')} currentTheme={themeColor} />;

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
          themeColor={themeColor}
      />

      {themeColor === 'rose' && <HeartsBackground />}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shrink-0 z-30 px-4 sm:px-6 py-3 border-b border-gray-100/50">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full lg:hidden transition-colors"><Menu size={24} /></button>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-white hidden sm:block shadow-sm ${theme.bg}`}><GraduationCap size={24} /></div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2"><span>LMS Scheduler</span> <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded uppercase">SQLite</span></h1>
                            <div className="flex items-center gap-2">
                                {currentScheduleName && <p className="text-xs text-gray-500 font-medium">{currentScheduleName}</p>}
                                {!isOnline && (
                                    <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-md text-gray-500">
                                        <WifiOff size={10} />
                                        <span className="text-[8px] font-bold uppercase">Offline</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => setIsAddEventOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-full transition-all shadow-sm" disabled={!multiMonthData}><Plus size={18} /><span>Thêm kế hoạch</span></button>
                    <div className="hidden sm:flex bg-gray-100/50 p-1 rounded-full border border-gray-200">
                        <button onClick={() => setView('weekly')} disabled={!multiMonthData} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${view === 'weekly' ? `bg-white ${theme.textDark} shadow-sm` : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><Clock size={16} /> Tuần</button>
                        <button onClick={() => setView('calendar')} disabled={!multiMonthData} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${view === 'calendar' ? `bg-white ${theme.textDark} shadow-sm` : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><CalendarIcon size={16} /> Lịch</button>
                        <button onClick={() => setView('list')} disabled={!multiMonthData} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${view === 'list' ? `bg-white ${theme.textDark} shadow-sm` : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><ListIcon size={16} /> DS</button>
                    </div>
                    <button onClick={() => setIsSettingsOpen(true)} className={`p-2.5 text-gray-500 ${theme.text} ${theme.bgLight} rounded-full transition-colors hidden sm:block`}><Settings size={20} /></button>
                </div>
            </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto pb-24 sm:pb-8">
            {isSaving && <div className="fixed top-20 right-8 bg-white p-3 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-gray-100 animate-bounce"><Loader2 className="animate-spin text-blue-600" size={18} /><span className="text-xs font-bold">Ghi vào DB...</span></div>}
            
            {!multiMonthData ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-sm mb-6 border border-gray-100"><UploadCloud size={64} className={`${theme.textLight} mx-auto mb-4`} /><h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có lịch được nạp</h2><p className="text-gray-500 max-w-xs mx-auto mb-6">Mọi thay đổi của bạn sẽ được lưu trực tiếp vào cơ sở dữ liệu SQLite cục bộ và hoạt động tốt ngay cả khi không có mạng.</p><button onClick={() => setIsSettingsOpen(true)} className={`px-8 py-3 ${theme.bg} text-white rounded-full font-semibold shadow-lg ${theme.shadow}`}>Bắt đầu ngay</button></div>
                </div>
            ) : (
                <>
                    {(view === 'calendar' || view === 'list') && (
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <div className="relative w-full sm:w-[300px] group"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"><Filter size={18} /></div><select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="block w-full pl-11 pr-10 py-3 text-sm border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 rounded-2xl shadow-sm bg-white appearance-none"><option value="all">Tất cả các khóa học</option><option value="personal">✦ Kế hoạch cá nhân</option>{courses.filter(c => c.id !== 0).map(course => (<option key={course.id} value={course.id}>{course.shortname} - {course.fullname}</option>))}</select></div>
                                <button onClick={() => setShowCompleted(!showCompleted)} className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium border border-gray-200 transition-all shadow-sm w-full sm:w-auto justify-center ${showCompleted ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{showCompleted ? <Eye size={18} /> : <EyeOff size={18} />}<span>{showCompleted ? "Hiện việc đã xong" : "Đang ẩn việc đã xong"}</span></button>
                            </div>
                        </div>
                    )}

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        />
      </div>
    </div>
  );
};

export default App;
