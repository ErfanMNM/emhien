
import React from 'react';
import { CalendarEvent, ThemeColor } from '../types';
import { formatDate, getThemeColors, cleanHtml } from '../utils';
import { CheckCircle2, Circle, AlertTriangle, BookOpen, BellRing, Calendar, Eye, EyeOff } from 'lucide-react';

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

  // Lấy ra các bài kiểm tra (quiz) và bài tập (assign)
  const studyTasks = events
    .filter(e => e.modulename === 'quiz' || e.modulename === 'assign' || e.isPersonal)
    .sort((a, b) => a.timestart - b.timestart);

  // Tính toán thống kê
  const totalTasks = studyTasks.length;
  const completedCount = studyTasks.filter(t => completedEvents.has(t.id)).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  // Lọc list hiển thị
  const incompleteTasks = studyTasks.filter(t => !completedEvents.has(t.id));
  const completedTasksList = studyTasks.filter(t => completedEvents.has(t.id));
  
  const displayList = showCompleted 
    ? [...incompleteTasks, ...completedTasksList].slice(0, 30)
    : incompleteTasks.slice(0, 20);

  // Nhóm tasks theo ngày
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

  const getDayStyles = (timestamp: number) => {
      const day = new Date(timestamp * 1000).getDay();
      switch (day) {
          case 1: return { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' };
          case 2: return { border: 'border-pink-400', bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800' };
          case 3: return { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' };
          case 4: return { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' };
          case 5: return { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
          case 6: return { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' };
          case 0: return { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
          default: return { border: 'border-gray-200', bg: 'bg-white', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className={theme.text} size={20} />
            Kế hoạch học tập tuần này
          </h2>
          <div className="flex items-center gap-4 mt-1">
             <p className="text-sm text-gray-500">Danh sách bài tập và deadline</p>
             <button 
                onClick={() => setShowCompleted(!showCompleted)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border
                    ${showCompleted ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}
                `}
             >
                {showCompleted ? <Eye size={14} /> : <EyeOff size={14} />}
                {showCompleted ? "Đang hiện việc đã xong" : "Đang ẩn việc đã xong"}
             </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full md:w-64">
          <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
            <span>Tiến độ hoàn thành</span>
            <span>{progress}% ({completedCount}/{totalTasks})</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className={`${theme.bg} h-2.5 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Task List Grouped by Date */}
      <div className="space-y-8">
        {displayList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed flex flex-col items-center">
            <CheckCircle2 size={40} className="mb-3 opacity-20" />
            <p className="font-medium">Chưa có nhiệm vụ nào cần hoàn thành.</p>
            {!showCompleted && completedCount > 0 && (
                <button 
                    onClick={() => setShowCompleted(true)}
                    className="mt-3 text-blue-600 text-xs font-bold hover:underline"
                >
                    Xem {completedCount} nhiệm vụ đã xong
                </button>
            )}
          </div>
        ) : (
          sortedDateKeys.map(dateKey => {
            const tasks = groupedTasks[dateKey];
            const firstTask = tasks[0];
            const styles = getDayStyles(firstTask.timestart);

            return (
                <div key={dateKey} className="relative">
                    {/* Date Header */}
                    <div className={`flex items-center gap-2 mb-3 font-bold text-sm uppercase tracking-wide ${styles.text}`}>
                        <Calendar size={16} />
                        {dateKey}
                    </div>

                    {/* Tasks Container */}
                    <div className="flex flex-col gap-3">
                        {tasks.map(task => {
                            const isCompleted = completedEvents.has(task.id);
                            const isUrgent = !isCompleted && (task.timestart * 1000 - Date.now() < 86400000 * 2);
                            const hasAlarm = alarms[task.id] !== undefined;

                            return (
                                <div 
                                    key={task.id} 
                                    className={`relative flex items-start gap-3 p-4 rounded-xl border-l-[6px] transition-all cursor-pointer group
                                    ${isCompleted 
                                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                                        : `${styles.bg} ${styles.border} hover:shadow-md`
                                    }`}
                                    onClick={() => onEventClick && onEventClick(task)}
                                >
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleComplete(task.id);
                                        }}
                                        className={`mt-0.5 flex-shrink-0 transition-colors ${
                                            isCompleted ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
                                        }`}
                                    >
                                        {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${styles.text} opacity-80`}>
                                                {task.course.shortname || task.course.fullname}
                                            </p>
                                            <div className="flex gap-1">
                                                {hasAlarm && !isCompleted && (
                                                    <span className="flex-shrink-0 text-orange-500">
                                                        <BellRing size={14} />
                                                    </span>
                                                )}
                                                {isUrgent && (
                                                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                    <AlertTriangle size={10} /> Gấp
                                                </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className={`text-sm font-bold leading-tight mb-2 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                            {task.activityname}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                            task.modulename === 'quiz' ? 'bg-white text-red-600 border border-red-100' : 
                                            task.modulename === 'assign' ? 'bg-white text-blue-600 border border-blue-100' :
                                            'bg-white text-purple-600 border border-purple-100'
                                            }`}>
                                                {task.modulename}
                                            </span>
                                            {task.formattedtime && (
                                                <span className="text-xs text-gray-500 font-medium bg-white/50 px-1.5 py-0.5 rounded">
                                                    {cleanHtml(task.formattedtime)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
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
