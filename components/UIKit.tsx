
import React from 'react';
import { 
  Palette, Type, Layers, Box, CheckCircle2, Circle, 
  Plus, Bell, Settings, Calendar, Video, AlertTriangle,
  ArrowLeft, Info, Heart
} from 'lucide-react';
import { ThemeColor } from '../types';
import { getThemeColors } from '../utils';

interface UIKitProps {
  onBack: () => void;
  currentTheme: ThemeColor;
}

const UIKit: React.FC<UIKitProps> = ({ onBack, currentTheme }) => {
  const theme = getThemeColors(currentTheme);

  // Fix: Added optional children to the type definition to resolve the TypeScript "missing children" error when using Section as a JSX component.
  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children?: React.ReactNode }) => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-2">
        <div className={`${theme.bgLight} ${theme.text} p-2 rounded-xl`}>
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">LMS Design System</h1>
            <p className="text-xs text-gray-500 font-medium">Phiên bản 1.0 - Theme: {currentTheme.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
           <span className="px-3 py-1 text-[10px] font-bold uppercase text-gray-500">Dành cho Developers</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
        
        {/* Intro Card */}
        <div className={`p-8 rounded-[32px] ${theme.bg} text-white shadow-2xl ${theme.shadow} relative overflow-hidden`}>
            <div className="relative z-10">
                <h1 className="text-3xl font-extrabold mb-2">Hệ thống giao diện đồng nhất</h1>
                <p className="max-w-lg opacity-90 text-sm leading-relaxed">
                    Sử dụng Tailwind CSS kết hợp Lucide Icons để tạo ra trải nghiệm người dùng hiện đại, sạch sẽ và có tính cá nhân hóa cao.
                </p>
            </div>
            <SparklesBackground />
        </div>

        {/* 1. Colors */}
        {/* Fix: Added explicit children for Section usage */}
        <Section title="Màu sắc hệ thống" icon={Palette}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['blue', 'rose', 'emerald', 'violet'] as ThemeColor[]).map(t => {
                    const c = getThemeColors(t);
                    return (
                        <div key={t} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-3">
                            <div className={`w-16 h-16 rounded-2xl ${c.bg} shadow-lg ${c.shadow}`}></div>
                            <div className="text-center">
                                <p className="font-bold text-gray-800 capitalize">{t}</p>
                                <p className="text-[10px] text-gray-400 font-mono tracking-tight">{c.bg}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Section>

        {/* 2. Typography */}
        {/* Fix: Added explicit children for Section usage */}
        <Section title="Kiểu chữ" icon={Type}>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Tiêu đề lớn (Headline 1)</p>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thanh xuân tươi đẹp của Bé Hiền</h1>
                </div>
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Tiêu đề vừa (Headline 2)</p>
                    <h2 className="text-xl font-bold text-gray-800">Quản trị học - BADM1301</h2>
                </div>
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Nội dung (Body)</p>
                    <p className="text-gray-600 leading-relaxed">Dữ liệu được lưu trữ an toàn trên thiết bị (Local-First). Ứng dụng giúp bạn quản lý lịch học và bài tập một cách trực quan.</p>
                </div>
            </div>
        </Section>

        {/* 3. Buttons */}
        {/* Fix: Added explicit children for Section usage */}
        <Section title="Nút bấm (Buttons)" icon={Box}>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-gray-400">Primary Actions</p>
                        <button className={`w-full px-6 py-3 ${theme.bg} text-white rounded-full font-bold shadow-lg ${theme.shadow} transition-all`}>
                            Lưu thay đổi
                        </button>
                        <button className={`w-full px-6 py-3 ${theme.bgLight} ${theme.textDark} rounded-full font-bold transition-all`}>
                            Hoàn thành
                        </button>
                    </div>
                    <div className="space-y-4 text-center">
                        <p className="text-xs font-bold text-gray-400">Floating & Icons</p>
                        <div className="flex justify-center gap-4">
                            <button className={`w-12 h-12 flex items-center justify-center ${theme.bg} text-white rounded-2xl shadow-lg ${theme.shadow}`}>
                                <Plus size={24} />
                            </button>
                            <button className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full">
                                <Settings size={20} />
                            </button>
                            <button className="w-12 h-12 flex items-center justify-center text-orange-600 bg-orange-50 rounded-full">
                                <Bell size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-gray-400">Tab Switchers</p>
                        <div className="bg-gray-100 p-1 rounded-full flex gap-1">
                            <div className="flex-1 bg-white text-gray-800 text-xs font-bold py-2 px-3 rounded-full text-center shadow-sm">Tuần</div>
                            <div className="flex-1 text-gray-400 text-xs font-bold py-2 px-3 rounded-full text-center">Lịch</div>
                        </div>
                    </div>
                </div>
            </div>
        </Section>

        {/* 4. Event Cards */}
        {/* Fix: Added explicit children for Section usage */}
        <Section title="Thẻ sự kiện (Cards)" icon={Layers}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List Style */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 mb-4 uppercase">Kiểu danh sách (List View)</p>
                    <div className="flex items-center p-4 bg-gray-50 rounded-2xl gap-4 border border-transparent hover:border-blue-200 transition-all cursor-pointer">
                        <div className="text-gray-300"><Circle size={24} /></div>
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                             <img src="https://elolms.ou.edu.vn/theme/image.php/boost/quiz/1760682180/monologo?filtericon=1" className="w-5 h-5 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">Bài kiểm tra cuối Chương 1</h4>
                            <p className="text-xs text-gray-500 truncate">Quản trị học - 2517</p>
                        </div>
                        <div className="text-gray-300"><ChevronRight size={18} /></div>
                    </div>
                </div>
                {/* Calendar Style */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 mb-4 uppercase">Kiểu ô lịch (Calendar View)</p>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-1 min-h-[80px] border border-gray-100 rounded-xl bg-gray-50 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-gray-400 mb-1">01</span>
                            <div className="w-full h-1.5 rounded-full bg-blue-400 mb-1"></div>
                            <div className="w-full h-1.5 rounded-full bg-red-400"></div>
                        </div>
                        <div className={`p-1 min-h-[80px] border-2 ${theme.border} rounded-xl ${theme.bgLight} flex flex-col items-center shadow-sm`}>
                            <span className={`text-[10px] font-bold ${theme.textDark} mb-1`}>02</span>
                            <div className={`w-full h-1.5 rounded-full ${theme.bg} mb-1 opacity-80`}></div>
                            <div className="w-full h-1.5 rounded-full bg-amber-400 opacity-80"></div>
                        </div>
                        <div className="p-1 min-h-[80px] border border-gray-100 rounded-xl bg-white flex flex-col items-center opacity-40">
                            <span className="text-[10px] font-bold text-gray-300 mb-1">03</span>
                        </div>
                    </div>
                </div>
            </div>
        </Section>

        {/* 5. Feedback & States */}
        {/* Fix: Added explicit children for Section usage */}
        <Section title="Trạng thái (States)" icon={Info}>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
                        <AlertTriangle size={18} />
                        <span className="text-xs font-bold">Quan trọng / Gấp</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100">
                        <CheckCircle2 size={18} />
                        <span className="text-xs font-bold">Hoàn thành</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100">
                        <Video size={18} />
                        <span className="text-xs font-bold">Hội thảo Video</span>
                    </div>
                </div>
            </div>
        </Section>

        <footer className="text-center pt-10 text-gray-400 text-sm">
             <div className="flex items-center justify-center gap-1.5 font-bold">
                Design with <Heart size={14} className="text-rose-500 fill-rose-500" /> by Bé Hiền Team
             </div>
             <p className="mt-2">© 2025 Hiền Ham Học Design Guidelines</p>
        </footer>
      </div>
    </div>
  );
};

const SparklesBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(10)].map((_, i) => (
            <div 
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                    width: Math.random() * 4 + 2 + 'px',
                    height: Math.random() * 4 + 2 + 'px',
                    top: Math.random() * 100 + '%',
                    left: Math.random() * 100 + '%',
                    animationDelay: Math.random() * 2 + 's'
                }}
            />
        ))}
    </div>
);

const ChevronRight = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

export default UIKit;
