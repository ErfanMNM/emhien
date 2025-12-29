
import React from 'react';
import { ArrowLeft, GraduationCap, Heart, Sparkles, CheckCircle, Zap, Shield, Cloud, Database, Smartphone, Bell } from 'lucide-react';
import { ThemeColor } from '../types';
import { getThemeColors } from '../utils';

interface AboutPageProps {
  onBack: () => void;
  themeColor: ThemeColor;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack, themeColor }) => {
  const theme = getThemeColors(themeColor);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">Về Ứng Dụng</h1>
            <p className="text-xs text-gray-500">Thông tin phiên bản và tính năng</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-500">
        
        {/* App Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`${theme.bg} p-4 rounded-2xl mb-4 shadow-lg`}>
              <GraduationCap size={48} className="text-white" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-2">Hiền Ham Học</h1>
            
            <div className="mb-4">
              <span className="text-sm bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white px-4 py-2 rounded-full uppercase font-black shadow-lg border border-amber-300 inline-flex items-center gap-2 animate-pulse" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <Sparkles size={14} className="fill-white" />
                Siêu Vip
              </span>
            </div>
            
            <p className="text-gray-600 text-lg font-medium mb-2">Phiên bản 1.0.19</p>
            <p className="text-gray-500 text-sm">Quản lý lịch học và bài tập cá nhân hóa dành cho bé Hiền đáng yêu</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <Smartphone size={20} />
              </div>
              <h3 className="font-bold text-gray-800">PWA Offline</h3>
            </div>
            <p className="text-sm text-gray-600">Chạy offline, cài đặt như app thật</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-2 rounded-xl text-green-600">
                <Bell size={20} />
              </div>
              <h3 className="font-bold text-gray-800">Nhắc Nhở Thông Minh</h3>
            </div>
            <p className="text-sm text-gray-600">Thông báo trước khi sự kiện diễn ra</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                <Cloud size={20} />
              </div>
              <h3 className="font-bold text-gray-800">Đồng Bộ Firebase</h3>
            </div>
            <p className="text-sm text-gray-600">Sao lưu và đồng bộ đám mây</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <Database size={20} />
              </div>
              <h3 className="font-bold text-gray-800">SQLite Local</h3>
            </div>
            <p className="text-sm text-gray-600">Dữ liệu lưu trữ cục bộ an toàn</p>
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-blue-600" />
            Thông Tin Phiên Bản
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-gray-600 font-medium">Phiên bản:</span>
              <span className="font-bold text-gray-800">1.0.19 - Siêu Vip</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-gray-600 font-medium">Ngày phát hành:</span>
              <span className="font-bold text-gray-800">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-gray-600 font-medium">Nền tảng:</span>
              <span className="font-bold text-gray-800">PWA (Progressive Web App)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Trạng thái:</span>
              <span className="font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">Đang hoạt động</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="text-sm text-gray-400 font-medium flex items-center justify-center gap-1.5 mb-2">
            Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> for Bé Hiền
          </div>
          <p className="text-xs text-gray-400">© 2025 Hiền Ham Học - Siêu Vip Edition</p>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;

