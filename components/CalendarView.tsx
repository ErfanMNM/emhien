
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarData, CalendarEvent, CalendarDay, ThemeColor } from '../types';
import { getEventColor, isVideoConference, shouldHideEvent, formatDate, getThemeColors, cleanHtml } from '../utils';
import { Video, BellRing, ChevronRight, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface CalendarViewProps {
  periods: Record<string, CalendarData>;
  onEventClick: (event: CalendarEvent) => void;
  filteredCourseId: string;
  alarms?: Record<number, number>;
  themeColor: ThemeColor;
  completedEvents: Set<number>;
  showCompleted: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  periods, 
  onEventClick, 
  filteredCourseId, 
  alarms = {}, 
  themeColor,
  completedEvents,
  showCompleted 
}) => {
  const periodNames = useMemo(() => Object.keys(periods).sort((a, b) => {
      // Giả sử format "tháng MM YYYY"
      const parsePeriod = (p: string) => {
          const match = p.match(/tháng (\d+) (\d+)/);
          if (!match) return 0;
          return parseInt(match[2]) * 12 + parseInt(match[1]);
      };
      return parsePeriod(a) - parsePeriod(b);
  }), [periods]);

  const [activePeriodIndex, setActivePeriodIndex] = useState(0);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);
  const theme = getThemeColors(themeColor);

  const activePeriodName = periodNames[activePeriodIndex];
  const activeData = periods[activePeriodName];

  useEffect(() => {
    // Tìm ngày hôm nay trong period hiện tại nếu có
    if (activeData) {
        let foundToday = false;
        for (const week of activeData.weeks) {
            for (const day of week.days) {
                if (day.istoday) {
                    setSelectedTimestamp(day.timestamp);
                    foundToday = true;
                    break;
                }
            }
            if (foundToday) break;
        }
        if (!foundToday) {
            const firstDay = activeData.weeks[0]?.days.find(d => d.mday === 1) || activeData.weeks[0]?.days[0];
            if (firstDay) setSelectedTimestamp(firstDay.timestamp);
        }
    }
  }, [activePeriodIndex, activeData]);

  const selectedEvents = useMemo(() => {
    if (!selectedTimestamp || !activeData) return [];
    
    for (const week of activeData.weeks) {
        const day = week.days.find(d => d.timestamp === selectedTimestamp);
        if (day) {
            return (filteredCourseId === 'all' 
                ? day.events 
                : day.events.filter(e => e.course.id.toString() === filteredCourseId))
                .filter(e => !shouldHideEvent(e))
                .filter(e => showCompleted || !completedEvents.has(e.id))
                .sort((a, b) => a.timestart - b.timestart);
        }
    }
    return [];
  }, [selectedTimestamp, activeData, filteredCourseId, showCompleted, completedEvents]);

  if (!activeData) return null;

  return (
    <div className="space-y-6">
        {/* Month Selector Bar */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <button 
                onClick={() => setActivePeriodIndex(prev => Math.max(0, prev - 1))}
                disabled={activePeriodIndex === 0}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-full disabled:opacity-20"
            >
                <ChevronLeft size={24} />
            </button>
            <div className="text-center">
                <h2 className="text-lg font-bold text-gray-800 capitalize">{activePeriodName}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeData.weeks.length} tuần học</p>
            </div>
            <button 
                onClick={() => setActivePeriodIndex(prev => Math.min(periodNames.length - 1, prev + 1))}
                disabled={activePeriodIndex === periodNames.length - 1}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-full disabled:opacity-20"
            >
                <ChevronRightIcon size={24} />
            </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden select-none">
            <div className="grid grid-cols-7 border-b border-gray-100 bg-white pt-4 pb-2">
                {activeData.daynames.map((day) => (
                <div key={day.dayno} className="text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">
                        <span className="hidden sm:inline">{day.fullname}</span>
                        <span className="sm:hidden">{day.shortname}</span>
                    </span>
                </div>
                ))}
            </div>

            <div className="bg-white pb-4">
                {activeData.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7">
                    {week.prepadding.map((_, i) => (<div key={`pre-${i}`} className="bg-gray-50/50 min-h-[4rem] sm:min-h-[6rem]"></div>))}
                    {week.days.map((day: CalendarDay) => {
                        const displayEvents = (filteredCourseId === 'all' ? day.events : day.events.filter(e => e.course.id.toString() === filteredCourseId)).filter(e => !shouldHideEvent(e)).filter(e => showCompleted || !completedEvents.has(e.id));
                        const isSelected = selectedTimestamp === day.timestamp;
                        return (
                            <div key={day.timestamp} onClick={() => setSelectedTimestamp(day.timestamp)} className={`relative min-h-[4rem] sm:min-h-[6rem] p-1 transition-all cursor-pointer group flex flex-col items-center hover:bg-gray-50 rounded-lg mx-0.5`}>
                                <div className="mb-1 mt-1">
                                    <span className={`text-xs sm:text-sm font-medium w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${day.istoday ? `${theme.bg} text-white` : isSelected ? `${theme.bgMedium} ${theme.textDark} font-bold` : 'text-gray-700'}`}>{day.mday}</span>
                                </div>
                                <div className="sm:hidden flex flex-col gap-0.5 w-full items-center">
                                    {displayEvents.slice(0, 2).map((e) => (<div key={e.id} className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>))}
                                </div>
                                <div className="hidden sm:flex flex-col gap-1 w-full px-1">
                                    {displayEvents.slice(0, 2).map((e) => (<div key={e.id} className="text-[8px] sm:text-[10px] px-1 py-0.5 rounded bg-gray-100 truncate text-gray-600 font-medium">{e.activityname}</div>))}
                                </div>
                            </div>
                        );
                    })}
                    {week.postpadding.map((_, i) => (<div key={`post-${i}`} className="bg-gray-50/50 min-h-[4rem] sm:min-h-[6rem]"></div>))}
                </div>
                ))}
            </div>
        </div>

        <div className="animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center gap-2 mb-4 px-2">
                <CalendarIcon className={theme.text} size={20} />
                <h3 className="font-bold text-gray-800 text-lg">{selectedTimestamp ? `Sự kiện ngày ${formatDate(selectedTimestamp)}` : 'Chọn một ngày'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedEvents.length === 0 ? (
                    <div className="col-span-full py-10 text-center bg-white rounded-3xl border border-gray-100 text-gray-400 shadow-sm"><p>Trống trong ngày này.</p></div>
                ) : (
                    selectedEvents.map(event => (
                        <div key={event.id} onClick={() => onEventClick(event)} className={`relative flex items-center p-4 rounded-3xl transition-all cursor-pointer bg-white group hover:shadow-md border border-transparent ${completedEvents.has(event.id) ? 'opacity-60' : ''}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 bg-gray-100`}>
                                {isVideoConference(event) ? <Video size={18} /> : <img src={event.icon.iconurl} alt="" className="w-5 h-5 object-contain" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold text-gray-900 truncate ${completedEvents.has(event.id) ? 'line-through' : ''}`}>{event.activityname}</h4>
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">{cleanHtml(event.formattedtime)}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default CalendarView;
