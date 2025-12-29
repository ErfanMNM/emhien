
import React, { useState } from 'react';
import { CalendarEvent, ThemeColor } from '../types';
import { X, ExternalLink, Calendar, BookOpen, Video, CheckCircle2, Circle, Bell, Trash2, Settings } from 'lucide-react';
import { formatDate, isVideoConference, requestNotificationPermission, getThemeColors, cleanHtml } from '../utils';

interface EventModalProps {
  event: CalendarEvent | null;
  isCompleted?: boolean;
  alarmMinutes?: number | null; // null means no alarm
  onToggleComplete?: (id: number) => void;
  onSetAlarm?: (id: number, minutesBefore: number | null) => void;
  onDelete?: (id: number) => void; 
  onClose: () => void;
  themeColor: ThemeColor;
}

const EventModal: React.FC<EventModalProps> = ({ 
  event, 
  isCompleted = false, 
  alarmMinutes = null,
  onToggleComplete, 
  onSetAlarm,
  onDelete,
  onClose,
  themeColor
}) => {
  const theme = getThemeColors(themeColor);

  if (!event) return null;

  const isVC = isVideoConference(event);
  const isPersonal = event.isPersonal;

  const handleAlarmSelect = async (minutes: number | null) => {
    // Nếu người dùng muốn đặt giờ (minutes khác null)
    if (minutes !== null && onSetAlarm) {
       // Kiểm tra xem trình duyệt có hỗ trợ không
       if (!("Notification" in window)) {
           alert("Trình duyệt của bạn không hỗ trợ thông báo.");
           return;
       }

       // Kiểm tra nếu đã bị chặn trước đó
       if (Notification.permission === 'denied') {
           alert("⚠️ Quyền thông báo đang bị CHẶN.\n\nVui lòng bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ -> Tìm mục 'Thông báo' -> Chọn 'Cho phép' (Allow) để nhận nhắc nhở.");
           return;
       }

       // Yêu cầu quyền
       const granted = await requestNotificationPermission();
       if (!granted) {
           // Người dùng vừa bấm "Block" hoặc tắt popup
           return;
       }

       // Tự động đăng ký Web Push subscription để nhận thông báo khi app đóng
       try {
         const { ensureWebPushSubscription } = await import('../utils');
         await ensureWebPushSubscription();
         console.log('[EventModal] Đã đảm bảo Web Push subscription khi đặt alarm');
       } catch (e) {
         console.warn('[EventModal] Không thể đăng ký Web Push:', e);
         // Vẫn tiếp tục đặt alarm dù Web Push không thành công
       }
    }
    
    // Nếu đã có quyền hoặc đang tắt báo thức (minutes === null)
    if (onSetAlarm) {
        onSetAlarm(event.id, minutes);
    }
  };

  const getAlarmLabel = (minutes: number | null) => {
      if (minutes === null) return "Chưa đặt";
      if (minutes === 0) return "Đúng giờ";
      if (minutes === 15) return "15 phút";
      if (minutes === 30) return "30 phút";
      if (minutes === 60) return "1 giờ";
      return `${minutes} phút`;
  };

  const alarmOptions = [0, 15, 30, 60];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className={`bg-white w-full rounded-t-[32px] sm:rounded-[28px] shadow-2xl sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 shrink-0">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex gap-2">
             {isPersonal && onDelete && (
                <button
                    onClick={() => {
                        if (window.confirm("Bạn có chắc chắn muốn xóa kế hoạch này?")) {
                            onDelete(event.id);
                            onClose();
                        }
                    }}
                    className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={20} />
                </button>
             )}
             {!isPersonal && (
                 <a 
                    href={event.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full ${theme.text} ${theme.bgLight} transition-colors`}
                >
                    <ExternalLink size={20} />
                </a>
             )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 overflow-y-auto space-y-6">
          
          {/* Title Section */}
          <div className="flex gap-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1
                ${isVC ? 'bg-amber-100 text-amber-700' : isPersonal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
             `}>
                {isVC ? <Video size={24} /> : <img src={event.icon.iconurl} alt="" className="w-6 h-6 object-contain opacity-80" />}
             </div>
             <div>
                <h3 className={`text-xl sm:text-2xl font-semibold leading-tight text-gray-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                    {event.activityname}
                </h3>
                <span className="text-sm font-medium text-gray-500 mt-1 block">
                    {event.course.fullname}
                </span>
             </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
             <div className="flex items-start gap-4">
                <div className="w-12 flex justify-center pt-0.5"><Calendar className="text-gray-400" size={20} /></div>
                <div>
                    <p className="text-base text-gray-800">{formatDate(event.timestart)}</p>
                    <p className="text-sm text-gray-500">{cleanHtml(event.formattedtime) || 'Cả ngày'}</p>
                </div>
             </div>

             <div className="flex items-start gap-4">
                <div className="w-12 flex justify-center pt-0.5"><BookOpen className="text-gray-400" size={20} /></div>
                <div>
                    <p className="text-sm text-gray-800 uppercase font-medium">{event.modulename}</p>
                    <p className="text-sm text-gray-500">{isVC ? 'Video Conference' : isPersonal ? 'Cá nhân' : 'Hoạt động khóa học'}</p>
                </div>
             </div>
          </div>

          {/* Alarm Section */}
          {onSetAlarm && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                          <Bell size={16} />
                       </div>
                       <div className="flex flex-col">
                           <span className="font-bold text-gray-700 leading-none">Thông báo</span>
                           <span className="text-[10px] text-gray-400 mt-1">Trình duyệt sẽ nhắc bạn</span>
                       </div>
                   </div>
                   
                   <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                       alarmMinutes !== null ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                   }`}>
                       {getAlarmLabel(alarmMinutes)}
                   </span>
               </div>
               
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                   <button 
                    onClick={() => handleAlarmSelect(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border
                        ${alarmMinutes === null 
                            ? 'bg-slate-800 text-white border-slate-800' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                   >
                       Tắt
                   </button>
                   
                   {alarmOptions.map((mins) => (
                       <button
                        key={mins}
                        onClick={() => handleAlarmSelect(mins)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border
                            ${alarmMinutes === mins 
                                ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm ring-2 ring-orange-100' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                       >
                           {getAlarmLabel(mins)}
                       </button>
                   ))}
               </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
              <div 
                className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 prose max-w-none prose-sm prose-p:my-1 max-h-32 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: event.description }}
             />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white shrink-0 pb-safe">
           {onToggleComplete && (
               <button
                onClick={() => onToggleComplete(event.id)}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold transition-all transform active:scale-95
                    ${isCompleted 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : `${theme.bg} text-white ${theme.bgHover} shadow-lg ${theme.shadow}`
                    }`}
               >
                 {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                 {isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
               </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
