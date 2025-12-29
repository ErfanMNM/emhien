
import React from 'react';
import { ScheduleMetadata, ThemeColor, BeforeInstallPromptEvent } from '../types';
import { Plus, Calendar, X, GraduationCap, Settings, Bell, ChevronRight, Heart, LayoutTemplate, Download, Info } from 'lucide-react';
import { getThemeColors, subscribeWebPushWithWorker } from '../utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ScheduleMetadata[];
  currentScheduleId: string | null;
  onSelectSchedule: (id: string) => void;
  onCreateNew: () => void;
  onOpenSettings: () => void;
  onRequestNotification: () => Promise<boolean>; // Updated to return Promise
  onOpenUIKit?: () => void;
  onOpenAbout?: () => void;
  themeColor: ThemeColor;
  installPrompt?: BeforeInstallPromptEvent | null;
  isInstalled?: boolean;
  onInstallPWA?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  schedules, 
  currentScheduleId, 
  onSelectSchedule, 
  onCreateNew,
  onOpenSettings,
  onRequestNotification,
  onOpenUIKit,
  onOpenAbout,
  themeColor,
  installPrompt,
  isInstalled = false,
  onInstallPWA
}) => {
  
  const theme = getThemeColors(themeColor);

  const handleRequestNotification = async () => {
      if (!("Notification" in window)) {
          alert("Trình duyệt không hỗ trợ thông báo.");
          return;
      }

      if (Notification.permission === 'granted') {
          alert("✅ Bạn đã bật thông báo rồi!");
          onClose();
          return;
      }

      if (Notification.permission === 'denied') {
          alert("⚠️ Quyền thông báo đã bị chặn.\n\nHãy bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ và bật 'Thông báo' (Notifications).");
          return;
      }

      const granted = await onRequestNotification();
      if (granted) {
          alert("✅ Đã bật thông báo thành công!");
          onClose();
      }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel - Navigation Drawer Style */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-[#f8f9fa] transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:hidden'}`}>
        
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 shrink-0 mt-2">
           <div className="flex items-center gap-3 text-gray-800 font-bold text-xl">
              <div className={`${theme.bgMedium} p-2 rounded-xl ${theme.textDark}`}>
                <GraduationCap className="w-6 h-6" />
              </div>
              <span>Hiền Ham Học</span>
           </div>
           <button onClick={onClose} className="lg:hidden text-gray-500 hover:bg-gray-200 rounded-full p-2 transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* List - Material 3 Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
           <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-4 mt-2">
              Lịch của bạn
           </div>
           
           {schedules.length === 0 ? (
             <div className="text-center py-10 px-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl mx-2">
                Chưa có dữ liệu lịch.
             </div>
           ) : (
             schedules.map((schedule) => (
               <button 
                  key={schedule.id}
                  className={`w-full group relative flex items-center justify-between px-4 py-3.5 rounded-r-full transition-all cursor-pointer text-left ${
                    currentScheduleId === schedule.id 
                      ? `${theme.activeItem} font-semibold` 
                      : 'hover:bg-gray-100 text-gray-700 font-medium'
                  }`}
                  onClick={() => {
                    onSelectSchedule(schedule.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
               >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Calendar size={20} className={`flex-shrink-0 ${currentScheduleId === schedule.id ? theme.text : 'text-gray-400'}`} />
                    <div className="truncate text-sm">{schedule.name}</div>
                  </div>
                  {currentScheduleId === schedule.id && (
                      <ChevronRight size={16} className={theme.text} />
                  )}
               </button>
             ))
           )}
           
           <div className="my-4 border-b border-gray-200/50 mx-4"></div>

           <button
            onClick={() => {
                onCreateNew();
                if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-600 hover:bg-white hover:shadow-sm rounded-r-full transition-all font-medium"
          >
            <Plus size={20} />
            <span>Tạo lịch mới</span>
          </button>

          {onOpenUIKit && (
             <button
              onClick={onOpenUIKit}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-blue-600 hover:bg-blue-50 rounded-r-full transition-all font-bold mt-4"
            >
              <LayoutTemplate size={20} />
              <span>UI Design Kit</span>
            </button>
          )}

          {onOpenAbout && (
             <button
              onClick={onOpenAbout}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-600 hover:bg-gray-100 rounded-r-full transition-all font-medium mt-2"
            >
              <Info size={20} />
              <span>Về ứng dụng</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 mb-2">
            {/* Install PWA button - visible on all devices if not installed */}
            {!isInstalled && onInstallPWA && (
              <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-4">
                <button 
                  onClick={() => { onInstallPWA(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all font-bold text-sm shadow-lg"
                >
                  <Download size={18} /> <span>Cài đặt App (Chạy Offline)</span>
                  {installPrompt && <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Nhanh</span>}
                </button>
              </div>
            )}
            
            {/* Mobile-only buttons */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 lg:hidden mb-4 space-y-1">
               <button 
                  onClick={handleRequestNotification}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
               >
                  <Bell size={18} /> <span>Bật thông báo</span>
               </button>
               <button
                  onClick={async () => {
                    await subscribeWebPushWithWorker();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-blue-700 hover:bg-blue-50 rounded-xl transition-colors font-medium text-sm"
               >
                  <Bell size={18} /> <span>Test thông báo từ Cloudflare Worker</span>
               </button>
               <button 
                  onClick={() => { onOpenSettings(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
               >
                  <Settings size={18} /> <span>Quản lý dữ liệu & Giao diện</span>
               </button>
            </div>

            {/* Sweet Footer */}
            <div className="text-center py-2">
                <div className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                   Made with <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" /> for Bé Hiền
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
