
import React from 'react';
import { CalendarEvent, ThemeColor } from '../types';
import { formatDate, getEventColor, isVideoConference, getThemeColors, cleanHtml } from '../utils';
import { ChevronRight, Clock, Video, AlertCircle, CheckCircle2, Circle, BellRing } from 'lucide-react';

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

  // Group events by date for a nicer list view
  const filteredEvents = events.filter(e => showCompleted || !completedEvents.has(e.id));

  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const dateKey = event.timestart;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<number, CalendarEvent[]>);

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).map(Number).sort((a, b) => a - b);

  if (filteredEvents.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 text-gray-500 shadow-sm">
              <p>Tất cả các nhiệm vụ đã được hoàn thành!</p>
              {!showCompleted && (
                  <p className="text-xs mt-2 text-gray-400">Bật "Hiện việc đã xong" để xem lại các sự kiện cũ.</p>
              )}
          </div>
      )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3 ml-2">
             <h3 className="font-bold text-gray-900 text-base">
                {formatDate(date)}
             </h3>
             <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="space-y-3">
            {eventsByDate[date].map((event) => {
              const isVC = isVideoConference(event);
              const isCompleted = completedEvents.has(event.id);
              const hasAlarm = alarms[event.id] !== undefined;

              return (
                <div 
                  key={event.id} 
                  className={`group relative flex items-center p-4 rounded-2xl transition-all cursor-pointer border border-transparent
                    ${isCompleted ? 'bg-gray-50 opacity-70' : `bg-white shadow-sm hover:shadow-md ${theme.borderHover}`}
                  `}
                >
                   {/* Checkbox Area */}
                   <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(event.id);
                    }}
                    className={`flex-shrink-0 p-2 -ml-2 rounded-full transition-colors z-10 ${
                        isCompleted ? 'text-green-600' : 'text-gray-300 hover:bg-gray-100'
                    }`}
                   >
                     {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                   </button>

                   {/* Content Click Area */}
                  <div 
                    className="flex items-start gap-4 flex-1 min-w-0"
                    onClick={() => onEventClick(event)}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${isCompleted ? 'grayscale' : ''}`}>
                       {isVC ? (
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                             <Video size={20} />
                          </div>
                       ) : (
                          <img src={event.icon.iconurl} alt="" className="w-10 h-10 opacity-90 object-contain" />
                       )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className={`text-sm font-bold truncate mb-0.5 ${
                        isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                          {event.activityname}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mb-2">
                         {event.course.fullname}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md ${
                              event.modulename === 'quiz' ? 'bg-red-50 text-red-700' : 
                              event.modulename === 'assign' ? 'bg-blue-50 text-blue-700' :
                              event.modulename === 'personal' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                              {event.modulename}
                          </span>
                          
                          {isVC && !isCompleted && (
                             <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-amber-100 text-amber-800">
                                <AlertCircle size={10} /> Quan trọng
                             </span>
                          )}
                          
                          {hasAlarm && !isCompleted && (
                             <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-orange-50 text-orange-600">
                                <BellRing size={10} /> Đã hẹn giờ
                             </span>
                          )}

                          {event.formattedtime && (
                              <div className="flex items-center text-xs text-gray-400 font-medium ml-auto">
                                  <Clock size={12} className="mr-1" />
                                  {cleanHtml(event.formattedtime)}
                              </div>
                          )}
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
