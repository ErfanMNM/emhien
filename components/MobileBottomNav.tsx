
import React from 'react';
import { Clock, Calendar, List, Menu } from 'lucide-react';
import { AppView, ThemeColor } from '../types';
import { getThemeColors } from '../utils';

interface MobileBottomNavProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onOpenMenu: () => void;
  themeColor: ThemeColor;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
  currentView, 
  onChangeView, 
  onOpenMenu,
  themeColor
}) => {
  const theme = getThemeColors(themeColor);

  const navItems = [
    { id: 'weekly', icon: Clock, label: 'Tuần' },
    { id: 'calendar', icon: Calendar, label: 'Lịch' },
    { id: 'list', icon: List, label: 'DS' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 pb-safe z-40 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as AppView)}
              className="flex flex-col items-center gap-1 min-w-[64px] group"
            >
              <div className={`
                px-5 py-1.5 rounded-full transition-all duration-300
                ${isActive ? `${theme.bgMedium} ${theme.textDark}` : 'bg-transparent text-gray-500 group-active:bg-gray-100'}
              `}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? '' : 'text-gray-500'} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? theme.textDark : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center gap-1 min-w-[64px] group"
        >
          <div className="px-5 py-1.5 rounded-full bg-transparent text-gray-500 group-active:bg-gray-100 transition-all">
             <Menu size={24} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold text-gray-500">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
