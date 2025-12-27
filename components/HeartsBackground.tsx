
import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface HeartItem {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
  animation: 'floatUp' | 'fallDown';
  hasText: boolean;
}

const HeartsBackground: React.FC = () => {
  const [hearts, setHearts] = useState<HeartItem[]>([]);

  useEffect(() => {
    // Tạo 35 trái tim với các thông số ngẫu nhiên
    const initialHearts = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 20 + Math.random() * 40,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 15,
      animation: Math.random() > 0.4 ? 'fallDown' : 'floatUp', // 60% rơi xuống, 40% bay lên
      hasText: Math.random() > 0.3, // 70% trái tim có kèm chữ
    }));
    setHearts(initialHearts);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: heart.left,
            bottom: heart.animation === 'floatUp' ? '-60px' : 'auto',
            top: heart.animation === 'fallDown' ? '-60px' : 'auto',
            animation: `${heart.animation} ${heart.duration}s linear infinite, sideSway ${heart.duration / 3}s ease-in-out infinite`,
            animationDelay: `${heart.delay}s`,
            fontSize: `${heart.size}px`
          }}
        >
          <div className="relative flex items-center justify-center">
            <Heart 
              size={heart.size} 
              fill="currentColor" 
              className="opacity-60"
            />
            {heart.hasText && (
              <span className="heart-text" style={{ fontSize: `${heart.size * 0.25}px` }}>
                T&lt;3H
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeartsBackground;
