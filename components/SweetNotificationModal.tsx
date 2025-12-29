
import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, X } from 'lucide-react';

interface SweetNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sweetMessages = [
  "💕 Bé Hiền yêu dấu của anh Thức, anh yêu em nhiều lắm!",
  "✨ Mỗi ngày bên em là một ngày hạnh phúc nhất của anh!",
  "🌹 Em là ánh sáng trong cuộc đời anh, bé Hiền ơi!",
  "💖 Anh cảm ơn em vì đã đến bên anh, bé yêu!",
  "🌸 Em là điều tuyệt vời nhất mà anh từng có!",
  "💝 Bé Hiền à, em làm trái tim anh đập nhanh hơn mỗi ngày!",
  "🌺 Anh muốn nói với em rằng: Anh yêu em rất nhiều!",
  "💐 Em là lý do anh thức dậy với nụ cười mỗi sáng!",
  "💗 Bé Hiền yêu, em là kho báu quý giá nhất của anh!",
  "🌷 Anh sẽ luôn ở bên em, bảo vệ và yêu thương em!",
];

interface SparkleData {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

const SweetNotificationModal: React.FC<SweetNotificationModalProps> = ({ isOpen, onClose }) => {
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [sparkles, setSparkles] = useState<SparkleData[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Chọn một tin nhắn ngẫu nhiên
      const randomMessage = sweetMessages[Math.floor(Math.random() * sweetMessages.length)];
      setCurrentMessage(randomMessage);
      setIsAnimating(true);
      
      // Tạo sparkles một lần
      const newSparkles: SparkleData[] = Array.from({ length: 20 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 12 + Math.random() * 8,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      }));
      setSparkles(newSparkles);
      
      // Tự động đóng sau 8 giây
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Đợi animation fade out
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`relative bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-pink-200/50 transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sparkle effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {sparkles.map((sparkle, i) => (
            <Sparkles
              key={i}
              size={sparkle.size}
              className="absolute text-pink-300/60 animate-pulse"
              style={{
                left: `${sparkle.left}%`,
                top: `${sparkle.top}%`,
                animationDelay: `${sparkle.delay}s`,
                animationDuration: `${sparkle.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-pink-500 flex items-center justify-center transition-all hover:scale-110 shadow-sm"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="relative p-8 pt-12 flex flex-col items-center text-center">
          {/* Heart icon with animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-pink-200/50 rounded-full blur-xl animate-ping"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Heart size={48} className="text-white fill-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
            💕 Gửi Bé Hiền Yêu Dấu 💕
          </h2>

          {/* Message */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-pink-200/50 shadow-inner">
            <p className="text-lg font-medium text-gray-800 leading-relaxed">
              {currentMessage}
            </p>
          </div>

          {/* Decorative hearts */}
          <div className="flex items-center gap-2 text-pink-400/60">
            <Heart size={20} className="fill-current animate-pulse" />
            <Heart size={24} className="fill-current animate-pulse" style={{ animationDelay: '0.2s' }} />
            <Heart size={20} className="fill-current animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Footer text */}
          <p className="mt-4 text-sm text-pink-600/70 font-medium">
            Từ anh Thức với tình yêu ❤️
          </p>
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-pink-100/50 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default SweetNotificationModal;

