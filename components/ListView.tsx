
import React from 'react';
import { CalendarEvent, ThemeColor } from '../types';
import { formatDate, isVideoConference, getThemeColors, cleanHtml, getEventStyle } from '../utils';
import { Clock, Video, AlertCircle, CheckCircle2, Circle, BellRing, MapPin } from 'lucide-react';

interface ListViewProps {
  events: CalendarEvent[];
  completedEvents: Set<number>;
  alarms?: Record<number, number>;
  onEventClick: (event: CalendarEvent) => void;
  onToggleComplete: (id: number) => void;
  themeColor: ThemeColor;
  showCompleted: boolean;
}

const ListView: React.FC<ListViewProps> = ({ 
  events, 
  completedEvents, 
  alarms = {}, 
  onEventClick, 
  onToggleComplete, 
  themeColor,
  showCompleted
}) => {
  const theme = getThemeColors(themeColor);

  const filteredEvents = events.filter(e => showCompleted || !completedEvents.has(e.id));

  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const dateKey = event.timestart;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<number, CalendarEvent[]>);

  const sortedDates = Object.keys(eventsByDate).map(Number).sort((a, b) => a - b);

  if (filteredEvents.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 text-gray-500 shadow-sm mx-4">
              <p>Tất cả các nhiệm vụ đã được hoàn thành!</p>
              {!showCompleted && (
                  <p className="text-xs mt-2 text-gray-400">Bật "Hiện việc đã xong" để xem lại các sự kiện cũ.</p>
              )}
          </div>
      )
  }

  return (
    <div className="space-y-8 pb-10">
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="sticky top-0 z-10 bg-[#f8f9fa]/95 backdrop-blur py-2 mb-2 flex items-center gap-3 ml-2">
             <div className={`w-3 h-3 rounded-full ${theme.bg}`}></div>
             <h3 className="font-bold text-gray-900 text-lg uppercase tracking-tight">
                {formatDate(date)}
             </h3>
          </div>
          
          <div className="space-y-4 px-2">
            {eventsByDate[date].map((event) => {
              const isVC = isVideoConference(event);
              const isCompleted = completedEvents.has(event.id);
              const hasAlarm = alarms[event.id] !== undefined;
              const style = getEventStyle(event);
              const borderColorClass = style.dot.replace('bg-', 'border-');

              return (
                <div 
                  key={event.id} 
                  className={`group relative flex flex-col sm:flex-row items-start p-5 rounded-2xl transition-all border-l-[6px] shadow-sm hover:shadow-md
                    ${isCompleted 
                        ? 'bg-gray-50 border-gray-200 opacity-70' 
                        : `bg-white ${borderColorClass}`
                    }
                  `}
                >
                   {/* Checkbox Area - Absolute on mobile, Left on desktop */}
                   <div className="absolute top-5 right-5 sm:static sm:mr-4">
                       <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(event.id);
                        }}
                        className={`p-1 rounded-full transition-colors ${
                            isCompleted ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'
                        }`}
                       >
                         {isCompleted ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                       </button>
                   </div>

                   {/* Content Click Area */}
                  <div 
                    className="flex-1 w-full cursor-pointer"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`hidden sm:flex flex-shrink-0 mt-1 ${isCompleted ? 'grayscale opacity-50' : ''}`}>
                            {isVC ? (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.iconBg} ${style.iconText}`}>
                                    <Video size={24} />
                                </div>
                            ) : (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                                    <img src={event.icon.iconurl} alt="" className="w-6 h-6 object-contain opacity-90" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                                    isCompleted ? 'bg-gray-200 text-gray-500' : style.badge
                                }`}>
                                    {event.modulename}
                                </span>
                                
                                {isVC && !isCompleted && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-amber-100 text-amber-800">
                                        <AlertCircle size={10} /> Quan trọng
                                    </span>
                                )}
                                
                                {hasAlarm && !isCompleted && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-orange-50 text-orange-600">
                                        <BellRing size={10} /> Đã hẹn giờ
                                    </span>
                                )}
                            </div>

                            {/* Title & Course - Allow Wrap */}
                            <div>
                                <h4 className={`text-base font-bold leading-snug ${
                                    isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                                }`}>
                                    {event.activityname}
                                </h4>
                                <p className={`text-sm font-medium mt-1 leading-relaxed ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {event.course.fullname}
                                </p>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                                {event.formattedtime && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-gray-400" />
                                        <span className="font-medium">{cleanHtml(event.formattedtime)}</span>
                                    </div>
                                )}
                                {event.location && (
                                     <div className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>{event.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListView;
