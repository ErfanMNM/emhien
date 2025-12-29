
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarData, CalendarEvent, CalendarDay, ThemeColor } from '../types';
import { getEventStyle, isVideoConference, shouldHideEvent, formatDate, getThemeColors, cleanHtml, getLunarDayInfoBatch, LunarDayInfo } from '../utils';
import { Video, ChevronRight, Calendar as CalendarIcon, ChevronLeft, ChevronRight as ChevronRightIcon, Clock, MapPin, CheckCircle2 } from 'lucide-react';

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
  const [lunarInfoMap, setLunarInfoMap] = useState<Map<number, LunarDayInfo>>(new Map());
  const theme = getThemeColors(themeColor);

  const activePeriodName = periodNames[activePeriodIndex];
  const activeData = periods[activePeriodName];

  // Load thông tin lịch âm cho các ngày trong tháng hiện tại
  useEffect(() => {
    if (!activeData) return;

    const timestamps: number[] = [];
    activeData.weeks.forEach(week => {
      week.days.forEach(day => {
        if (day.mday && day.timestamp) {
          timestamps.push(day.timestamp);
        }
      });
    });

    if (timestamps.length > 0) {
      getLunarDayInfoBatch(timestamps).then(infoMap => {
        setLunarInfoMap(infoMap);
      }).catch(err => {
        console.error('[CalendarView] Lỗi load lịch âm:', err);
      });
    }
  }, [activePeriodIndex, activeData]);

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
                        const lunarInfo = lunarInfoMap.get(day.timestamp);
                        
                        // Xác định màu khung dựa trên ngày tốt/xấu
                        let borderColor = '';
                        if (lunarInfo) {
                          if (lunarInfo.isGoodDay === true) {
                            borderColor = 'border-green-400 border-2'; // Ngày tốt - xanh lá
                          } else if (lunarInfo.isGoodDay === false) {
                            borderColor = 'border-purple-400 border-2'; // Ngày xấu - tím
                          }
                        }
                        
                        return (
                            <div key={day.timestamp} onClick={() => setSelectedTimestamp(day.timestamp)} className={`relative min-h-[4rem] sm:min-h-[6rem] p-1 transition-all cursor-pointer group flex flex-col items-center hover:bg-gray-50 rounded-lg mx-0.5 ${borderColor}`}>
                                <div className="mb-1 mt-1">
                                    <span className={`text-xs sm:text-sm font-medium w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${day.istoday ? `${theme.bg} text-white` : isSelected ? `${theme.bgMedium} ${theme.textDark} font-bold` : 'text-gray-700'}`}>{day.mday}</span>
                                </div>
                                {/* Hiển thị ngày âm lịch */}
                                {lunarInfo && lunarInfo.lunarDate && (
                                  <div className="text-[8px] sm:text-[9px] text-gray-500 font-medium mb-0.5">
                                    {lunarInfo.lunarDate.split('-')[0]}/{lunarInfo.lunarDate.split('-')[1]}
                                  </div>
                                )}
                                {/* Mobile View: Colored Dots */}
                                <div className="sm:hidden flex gap-1 w-full justify-center flex-wrap px-1">
                                    {displayEvents.slice(0, 3).map((e) => {
                                        const style = getEventStyle(e);
                                        return (
                                            <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></div>
                                        );
                                    })}
                                    {displayEvents.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>}
                                </div>
                                {/* Desktop View: Colored Bars */}
                                <div className="hidden sm:flex flex-col gap-1 w-full px-1">
                                    {displayEvents.slice(0, 2).map((e) => {
                                        const style = getEventStyle(e);
                                        const isCompleted = completedEvents.has(e.id);
                                        return (
                                            <div key={e.id} className={`text-[9px] px-1.5 py-0.5 rounded truncate font-semibold border border-transparent ${isCompleted ? 'bg-gray-100 text-gray-400 line-through' : `${style.bg} ${style.subText}`}`}>
                                                {e.activityname}
                                            </div>
                                        );
                                    })}
                                    {displayEvents.length > 2 && (
                                        <div className="text-[9px] text-center text-gray-400 font-medium">+{displayEvents.length - 2} khác</div>
                                    )}
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
            
            {/* Thông tin lịch âm */}
            {selectedTimestamp && lunarInfoMap.has(selectedTimestamp) && (() => {
                const lunarInfo = lunarInfoMap.get(selectedTimestamp);
                if (!lunarInfo) return null;
                
                return (
                    <div className={`mb-4 p-4 rounded-2xl border-2 ${
                        lunarInfo.isGoodDay === true 
                            ? 'bg-green-50 border-green-200' 
                            : lunarInfo.isGoodDay === false 
                            ? 'bg-purple-50 border-purple-200' 
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className={lunarInfo.isGoodDay === true ? 'text-green-600' : lunarInfo.isGoodDay === false ? 'text-purple-600' : 'text-gray-500'} size={18} />
                            <h4 className="font-bold text-gray-800 text-sm">Thông tin lịch âm</h4>
                        </div>
                        <div className="space-y-1.5 text-sm">
                            {lunarInfo.lunarDate && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 font-medium">Ngày âm lịch:</span>
                                    <span className="text-gray-800 font-bold">{lunarInfo.lunarDate}</span>
                                </div>
                            )}
                            {lunarInfo.isGoodDay !== null && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 font-medium">Đánh giá:</span>
                                    <span className={`font-bold ${
                                        lunarInfo.isGoodDay ? 'text-green-600' : 'text-purple-600'
                                    }`}>
                                        {lunarInfo.isGoodDay ? '✓ Ngày tốt' : '✗ Ngày xấu'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEvents.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-gray-100 text-gray-400 shadow-sm flex flex-col items-center">
                         <CalendarIcon size={32} className="mb-2 opacity-20" />
                         <p>Không có sự kiện nào trong ngày này.</p>
                    </div>
                ) : (
                    selectedEvents.map(event => {
                        const style = getEventStyle(event);
                        const isCompleted = completedEvents.has(event.id);
                        return (
                            <div 
                                key={event.id} 
                                onClick={() => onEventClick(event)} 
                                className={`relative flex flex-col sm:flex-row items-start p-5 rounded-3xl transition-all cursor-pointer bg-white group shadow-sm hover:shadow-md border border-transparent
                                    ${isCompleted 
                                        ? 'opacity-60 grayscale' 
                                        : `border-l-8 ${style.border.replace('border', 'border-l')}`
                                    }
                                `}
                            >
                                <div className="flex w-full gap-4">
                                     <div className={`hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-gray-100' : style.iconBg} ${style.iconText}`}>
                                        {isVideoConference(event) ? <Video size={20} /> : <img src={event.icon.iconurl} alt="" className="w-6 h-6 object-contain" />}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${isCompleted ? 'bg-gray-100 text-gray-500' : style.badge}`}>
                                                {event.modulename}
                                            </span>
                                            {isCompleted && <CheckCircle2 size={16} className="text-green-500" />}
                                        </div>

                                        <h4 className={`text-base font-bold leading-snug mb-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                            {event.activityname}
                                        </h4>
                                        <p className={`text-sm font-medium mb-3 ${style.subText}`}>
                                            {event.course.fullname}
                                        </p>

                                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                                            {event.formattedtime && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} className="text-gray-400" />
                                                    <span>{cleanHtml(event.formattedtime)}</span>
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
                                    
                                    <div className="self-center">
                                         <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </div>
  );
};

export default CalendarView;
