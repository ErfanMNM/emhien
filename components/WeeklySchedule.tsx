
import React, { useMemo } from 'react';
import { CalendarEvent, ThemeColor } from '../types';
import { formatDate, getThemeColors, cleanHtml, getEventStyle } from '../utils';
import { CheckCircle2, Circle, AlertTriangle, BookOpen, BellRing, Calendar, Eye, EyeOff, MapPin, AlignLeft } from 'lucide-react';

interface WeeklyScheduleProps {
  events: CalendarEvent[];
  completedEvents: Set<number>;
  alarms?: Record<number, number>;
  onToggleComplete: (id: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
  themeColor: ThemeColor;
  showCompleted: boolean;
  setShowCompleted: (val: boolean) => void;
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ 
  events, 
  completedEvents, 
  alarms = {}, 
  onToggleComplete, 
  onEventClick, 
  themeColor,
  showCompleted,
  setShowCompleted
}) => {
  const theme = getThemeColors(themeColor);

  const { startTimestamp, endTimestamp, rangeLabel } = useMemo(() => {
      const now = new Date();
      const startOfWeek = new Date(now);
      const currentDay = startOfWeek.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      // Thứ 2 tuần hiện tại (00:00)
      startOfWeek.setDate(now.getDate() - distanceToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Thứ 2 tuần tiếp theo (00:00) - dùng cho hiển thị label
      const nextMonday = new Date(startOfWeek);
      nextMonday.setDate(startOfWeek.getDate() + 7);
      nextMonday.setHours(0, 0, 0, 0);

      // Biên phải để filter: 00:00 của thứ 3 tuần tiếp theo
      // => bao trùm toàn bộ thứ 2 tuần tiếp theo (đến 23:59:59)
      const endBoundary = new Date(nextMonday);
      endBoundary.setDate(nextMonday.getDate() + 1);
      endBoundary.setHours(0, 0, 0, 0);

      const fStart = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;
      const fEnd = `${nextMonday.getDate()}/${nextMonday.getMonth() + 1}`;

      return {
          startTimestamp: Math.floor(startOfWeek.getTime() / 1000),
          endTimestamp: Math.floor(endBoundary.getTime() / 1000),
          rangeLabel: `${fStart} - ${fEnd}`
      };
  }, []);

  const studyTasks = events
    .filter(e => {
        const isTypeValid = e.modulename === 'quiz' || e.modulename === 'assign' || e.isPersonal || e.modulename === 'forum';
        const isWithinWeek = e.timestart >= startTimestamp && e.timestart < endTimestamp;
        return isTypeValid && isWithinWeek;
    })
    .sort((a, b) => a.timestart - b.timestart);

  const totalTasks = studyTasks.length;
  const completedCount = studyTasks.filter(t => completedEvents.has(t.id)).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  const incompleteTasks = studyTasks.filter(t => !completedEvents.has(t.id));
  const completedTasksList = studyTasks.filter(t => completedEvents.has(t.id));
  
  const displayList = showCompleted 
    ? [...incompleteTasks, ...completedTasksList]
    : incompleteTasks;

  const groupedTasks: Record<string, CalendarEvent[]> = {};
  displayList.forEach(task => {
      const dateKey = formatDate(task.timestart);
      if (!groupedTasks[dateKey]) {
          groupedTasks[dateKey] = [];
      }
      groupedTasks[dateKey].push(task);
  });

  const sortedDateKeys = Object.keys(groupedTasks).sort((a, b) => {
      const timestampA = groupedTasks[a][0].timestart;
      const timestampB = groupedTasks[b][0].timestart;
      return timestampA - timestampB;
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className={theme.text} size={24} />
                <span>Tuần này</span>
            </h2>
            <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500 border border-gray-100">
                {rangeLabel}
            </span>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
            <span>Tiến độ</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
            <div 
              className={`${theme.bg} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-end">
             <span className="text-[10px] text-gray-400 font-medium">
                {completedCount} / {totalTasks} hoàn thành
             </span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {displayList.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 size={32} className="text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold mb-1">Thảnh thơi!</h3>
            <p className="text-gray-400 text-xs">Không có bài tập nào.</p>
          </div>
        ) : (
          sortedDateKeys.map(dateKey => {
            const tasks = groupedTasks[dateKey];
            const isToday = formatDate(Date.now() / 1000) === dateKey;

            return (
                <div key={dateKey} className="relative">
                    <div className={`sticky top-14 sm:top-0 z-10 flex items-center gap-3 mb-3 py-2 bg-white/95 backdrop-blur-sm
                        ${isToday ? theme.text : 'text-gray-500'}
                    `}>
                        <Calendar size={18} />
                        <span className="font-bold text-base uppercase tracking-tight">{dateKey}</span>
                        {isToday && <span className={`text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold uppercase`}>Hôm nay</span>}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {tasks.map(task => {
                            const isCompleted = completedEvents.has(task.id);
                            const isUrgent = !isCompleted && (task.timestart * 1000 - Date.now() < 86400000 * 2);
                            const hasAlarm = alarms[task.id] !== undefined;
                            const style = getEventStyle(task);
                            const shortDesc = task.description ? cleanHtml(task.description).slice(0, 100) + (task.description.length > 100 ? '...' : '') : '';

                            return (
                                <div 
                                    key={task.id} 
                                    className={`relative flex flex-col p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer group
                                    ${isCompleted 
                                        ? 'bg-gray-50 border-gray-100 opacity-60' 
                                        : `bg-white border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-${theme.text.split('-')[1]}-200`
                                    }`}
                                    onClick={() => onEventClick && onEventClick(task)}
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Top Badges */}
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'bg-gray-100 text-gray-500' : style.badge}`}>
                                                    {task.modulename}
                                                </span>
                                                {isUrgent && (
                                                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md flex items-center gap-1">
                                                        <AlertTriangle size={10} /> Gấp
                                                    </span>
                                                )}
                                                {hasAlarm && !isCompleted && (
                                                    <span className="text-orange-500"><BellRing size={12} /></span>
                                                )}
                                            </div>

                                            {/* Main Content */}
                                            <h3 className={`text-base sm:text-lg font-bold leading-snug mb-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                {task.activityname}
                                            </h3>
                                            <p className={`text-xs sm:text-sm font-semibold mb-2 ${isCompleted ? 'text-gray-400' : style.subText}`}>
                                                {task.course.fullname}
                                            </p>

                                            {/* Info Row */}
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                {task.formattedtime && (
                                                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                                        <span className="opacity-50">🕒</span> {cleanHtml(task.formattedtime)}
                                                    </span>
                                                )}
                                                {task.location && (
                                                     <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                                        <MapPin size={12} className="opacity-50" /> {task.location}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Desc Preview */}
                                            {shortDesc && !isCompleted && (
                                                <div className="mt-3 flex gap-2">
                                                    <AlignLeft size={12} className="mt-0.5 opacity-30 shrink-0" />
                                                    <p className="text-[11px] text-gray-400 italic leading-relaxed line-clamp-2">
                                                        {shortDesc}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Checkbox (Right aligned) */}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleComplete(task.id);
                                            }}
                                            className={`flex-shrink-0 self-start mt-1 p-1 rounded-full transition-all active:scale-90 ${
                                                isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'
                                            }`}
                                        >
                                            {isCompleted ? <CheckCircle2 size={28} className="fill-green-50" /> : <Circle size={28} />}
                                        </button>
                                    </div>
                                    
                                    {/* Left Status Bar indicator instead of full border */}
                                    {!isCompleted && (
                                        <div className={`absolute top-4 bottom-4 left-0 w-1 rounded-r-full ${style.bg.replace('bg-', 'bg-').replace('50', '400')}`}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default WeeklySchedule;
