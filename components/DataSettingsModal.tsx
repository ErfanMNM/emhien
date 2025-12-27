
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileJson, FileUp, Save, Palette, Check, Sparkles, Heart, Loader2, Calendar, Download, Upload, Database } from 'lucide-react';
import { CalendarData, ThemeColor } from '../types';
import { getThemeColors } from '../utils';
import { exportDBFile, importDBFile } from '../lib/db';

interface DataSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: CalendarData, name: string, isNew: boolean) => Promise<void>;
  currentScheduleName?: string;
  themeColor: ThemeColor;
  onSetTheme: (color: ThemeColor) => void;
  existingMonths?: string[]; 
  onRefreshApp: () => void; // Prop mới để báo cho App cần refresh lại dữ liệu
}

const DataSettingsModal: React.FC<DataSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport, 
  currentScheduleName = "Lịch học mới",
  themeColor,
  onSetTheme,
  existingMonths = [],
  onRefreshApp
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [isNewSchedule, setIsNewSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDBActionLoading, setIsDBActionLoading] = useState(false);

  const theme = getThemeColors(themeColor);

  const themes: { id: ThemeColor, name: string, bg: string, desc: string }[] = [
      { id: 'blue', name: 'Mặc định', bg: 'bg-blue-600', desc: 'Sáng sủa & Chuyên nghiệp' },
      { id: 'rose', name: 'Bé Hiền', bg: 'bg-rose-500', desc: 'Ngọt ngào & Dành riêng cho em' },
      { id: 'emerald', name: 'Matcha', bg: 'bg-emerald-600', desc: 'Tươi mới & Năng lượng' },
      { id: 'violet', name: 'Taro', bg: 'bg-violet-600', desc: 'Mộng mơ & Nhẹ nhàng' },
  ];

  useEffect(() => {
    if (isOpen) {
      setScheduleName(currentScheduleName);
      setJsonInput('');
      setError(null);
      setIsNewSchedule(false);
    }
  }, [isOpen, currentScheduleName]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setJsonInput(event.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setError(null);
    if (!scheduleName.trim()) { setError("Vui lòng nhập tên cho lịch."); return; }
    setIsProcessing(true);
    try {
      if (!jsonInput.trim()) throw new Error("Vui lòng nhập dữ liệu JSON.");
      let parsed = JSON.parse(jsonInput);
      let calendarData: CalendarData | null = null;
      if (parsed.data && parsed.data.weeks) calendarData = parsed.data;
      else if (parsed.weeks && parsed.daynames) calendarData = parsed;
      else if (Array.isArray(parsed.data) && parsed.data[0]?.data?.weeks) calendarData = parsed.data[0].data;
      else if (Array.isArray(parsed) && parsed[0]?.data?.weeks) calendarData = parsed[0].data;

      if (!calendarData) throw new Error("Dữ liệu không đúng cấu trúc LMS.");
      await onImport(calendarData, scheduleName, isNewSchedule);
      onClose();
    } catch (err: any) {
      setError(err.message || "Lỗi nhập liệu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportDB = () => {
      const blob = exportDBFile();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LMS_Study_Data_${new Date().toISOString().split('T')[0]}.sqlite`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportDBFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsDBActionLoading(true);
      try {
          const buffer = await file.arrayBuffer();
          const success = await importDBFile(buffer);
          if (success) {
              alert("Nhập dữ liệu SQLite thành công! Ứng dụng sẽ làm mới.");
              onRefreshApp();
              onClose();
          } else {
              setError("Không thể nhập file này. Có thể file không đúng định dạng SQLite.");
          }
      } catch (err) {
          setError("Lỗi khi đọc file database.");
      } finally {
          setIsDBActionLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div><h2 className="text-xl font-bold text-gray-900">Cài đặt dữ liệu</h2><p className="text-xs text-gray-500">Quản lý giao diện và sao lưu dữ liệu SQLite</p></div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* Section 1: Themes */}
          <section>
            <div className="flex items-center gap-2 mb-4"><div className={`${theme.bgMedium} p-2 rounded-lg ${theme.textDark}`}><Palette size={18} /></div><h3 className="font-bold text-gray-800">Chủ đề</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map(t => (
                <button key={t.id} onClick={() => onSetTheme(t.id)} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${themeColor === t.id ? `${theme.border} ${theme.bgLight}` : 'border-gray-100'}`}><div className={`w-10 h-10 rounded-full ${t.bg} flex items-center justify-center text-white`}>{themeColor === t.id && <Check size={20} />}</div><div><p className={`font-bold text-sm ${themeColor === t.id ? theme.textDark : 'text-gray-700'}`}>{t.name}</p><p className="text-xs text-gray-400">{t.desc}</p></div></button>
              ))}
            </div>
          </section>

          {/* Section 2: Export/Import SQLite */}
          <section>
            <div className="flex items-center gap-2 mb-4"><div className="bg-amber-50 p-2 rounded-lg text-amber-600"><Database size={18} /></div><h3 className="font-bold text-gray-800">Sao lưu & Khôi phục (SQLite)</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                    onClick={handleExportDB}
                    className="flex flex-col items-center gap-2 p-6 bg-amber-50 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-all text-amber-800"
                >
                    <Download size={24} />
                    <span className="text-sm font-bold">Xuất file Database (.sqlite)</span>
                    <span className="text-[10px] opacity-70">Lưu lại toàn bộ lịch và trạng thái học tập</span>
                </button>

                <div className="relative group">
                    <input 
                        type="file" 
                        accept=".sqlite,.db" 
                        onChange={handleImportDBFile}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="flex flex-col items-center gap-2 p-6 bg-blue-50 border border-blue-100 rounded-2xl group-hover:bg-blue-100 transition-all text-blue-800">
                        {isDBActionLoading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                        <span className="text-sm font-bold">Nhập file Database (.sqlite)</span>
                        <span className="text-[10px] opacity-70">Khôi phục dữ liệu từ thiết bị khác</span>
                    </div>
                </div>
            </div>
          </section>

          {/* Section 3: Import Monthly JSON */}
          <section>
            <div className="flex items-center gap-2 mb-4"><div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Calendar size={18} /></div><h3 className="font-bold text-gray-800">Nạp tháng học mới</h3></div>
            
            {!isNewSchedule && existingMonths.length > 0 && (
                <div className="mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Tháng đã nạp trong lịch này:</p>
                    <div className="flex flex-wrap gap-2">
                        {existingMonths.map(m => (
                            <span key={m} className="px-2 py-1 bg-white rounded-lg text-xs font-bold text-blue-700 shadow-sm border border-blue-200 capitalize">{m}</span>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tên bộ lịch</label><input type="text" value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="Ví dụ: Học kỳ 2" /></div>
                    <div className="flex items-end pb-3"><label className="flex items-center gap-3 cursor-pointer select-none group"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isNewSchedule ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>{isNewSchedule && <Check size={14} className="text-white" />}<input type="checkbox" className="hidden" checked={isNewSchedule} onChange={(e) => setIsNewSchedule(e.target.checked)} /></div><span className="text-sm font-semibold text-gray-600">Tạo bộ lịch hoàn toàn mới</span></label></div>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 cursor-pointer relative group">
                      <input type="file" accept=".json" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-700">Tải file JSON từ LMS</p>
                      <p className="text-[10px] text-gray-400">Hỗ trợ dán dữ liệu thô vào bên dưới</p>
                </div>

                {error && <div className="bg-red-50 p-3 rounded-xl text-xs text-red-600 flex items-center gap-2"><AlertTriangle size={14} />{error}</div>}

                <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[10px] resize-none" placeholder='Dán mã JSON tháng học vào đây...'></textarea>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 pb-safe">
          <button onClick={onClose} className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-full font-bold text-sm">Hủy</button>
          <button onClick={handleImport} disabled={isProcessing || !jsonInput} className={`px-8 py-3 ${theme.bg} text-white rounded-full font-bold text-sm flex items-center gap-2 shadow-lg ${theme.shadow}`}>{isProcessing ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {isNewSchedule ? 'Lưu lịch mới' : 'Nạp thêm tháng'}</>}</button>
        </div>
      </div>
    </div>
  );
};

export default DataSettingsModal;
