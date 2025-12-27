
import React, { useEffect, useRef } from 'react';
import { CalendarEvent } from '../types';
import { BellRing, Clock, StopCircle } from 'lucide-react';
import { cleanHtml } from '../utils';

interface AlarmRingingModalProps {
  event: CalendarEvent;
  onDismiss: () => void;
  onSnooze: () => void;
}

const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({ event, onDismiss, onSnooze }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sử dụng âm thanh báo thức
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.loop = true;
    audio.volume = 1.0;
    
    const playAudio = async () => {
      try {
        await audio.play();
      } catch (err) {
        console.error("Autoplay failed:", err);
      }
    };

    playAudio();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-[bounce_1s_infinite]">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
        
        <div className="relative p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6 animate-[ping_1.5s_ease-in-out_infinite]">
            <BellRing size={40} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đến giờ rồi!</h2>
          <p className="text-gray-500 mb-6">Đã đến thời gian hẹn cho sự kiện:</p>

          <div className="bg-gray-50 p-4 rounded-xl w-full mb-8 border border-gray-100">
             <div className="text-xs font-bold text-blue-600 uppercase mb-1">{event.course.fullname}</div>
             <div className="text-lg font-bold text-gray-900 line-clamp-2">{event.activityname}</div>
             <div className="flex items-center justify-center gap-2 text-gray-500 mt-2 text-sm">
                <Clock size={16} />
                <span>{cleanHtml(event.formattedtime) || 'Đang diễn ra'}</span>
             </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onDismiss}
              className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
            >
              <StopCircle size={24} />
              Tắt báo thức
            </button>
            
            <button
              onClick={onSnooze}
              className="w-full py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              Nhắc lại sau 5 phút
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmRingingModal;
