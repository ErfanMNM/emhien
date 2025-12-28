
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileUp, Save, Palette, Check, Loader2, Calendar, Download, Upload, Database, Cloud, CloudUpload, CloudDownload, LogIn, RefreshCw, Clock, Activity } from 'lucide-react';
import { CalendarData, ThemeColor } from '../types';
import { getThemeColors } from '../utils';
import { exportDBFile, importDBFile, getDBBinary } from '../lib/db';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

interface DataSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: CalendarData, name: string, isNew: boolean) => Promise<void>;
  currentScheduleName?: string;
  themeColor: ThemeColor;
  onSetTheme: (color: ThemeColor) => void;
  existingMonths?: string[]; 
  onRefreshApp: () => void;
  onOpenAuth: () => void;
}

const LS_KEY_SYNC = 'lms_last_sync_time';

const DataSettingsModal: React.FC<DataSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport, 
  currentScheduleName = "Lịch học mới",
  themeColor,
  onSetTheme,
  existingMonths = [],
  onRefreshApp,
  onOpenAuth
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [isNewSchedule, setIsNewSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDBActionLoading, setIsDBActionLoading] = useState(false);
  
  const [user, setUser] = useState<any>(auth.currentUser);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Cloud Check States
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);
  const [cloudLastModified, setCloudLastModified] = useState<Date | null>(null);
  const [localLastSync, setLocalLastSync] = useState<Date | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null); // New state for last check
  const [hasNewerVersion, setHasNewerVersion] = useState(false);

  const theme = getThemeColors(themeColor);

  useEffect(() => {
    if (isOpen) {
      setScheduleName(currentScheduleName);
      setJsonInput('');
      setError(null);
      setIsNewSchedule(false);
      setUser(auth.currentUser);
      
      // Load local sync time
      const savedSync = localStorage.getItem(LS_KEY_SYNC);
      if (savedSync) {
          setLocalLastSync(new Date(savedSync));
      }
      
      // Auto check if logged in
      if (auth.currentUser) {
          checkCloudStatus();
      }
    }
  }, [isOpen, currentScheduleName]);

  const checkCloudStatus = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      setIsCheckingCloud(true);
      setError(null);
      try {
          const storageRef = ref(storage, `backups/${currentUser.uid}/study_data.sqlite`);
          const metadata = await getMetadata(storageRef);
          
          const cloudTime = new Date(metadata.updated); // hoặc timeCreated
          setCloudLastModified(cloudTime);
          
          const localTime = localStorage.getItem(LS_KEY_SYNC);
          
          if (!localTime) {
              setHasNewerVersion(true);
          } else {
              // Nếu thời gian trên cloud mới hơn thời gian sync lần cuối > 5 giây (trừ hao độ trễ mạng)
              if (cloudTime.getTime() > new Date(localTime).getTime() + 5000) {
                  setHasNewerVersion(true);
              } else {
                  setHasNewerVersion(false);
              }
          }
      } catch (err: any) {
          if (err.code === 'storage/object-not-found') {
              setCloudLastModified(null);
              setHasNewerVersion(false);
          } else {
              console.error("Check cloud error:", err);
          }
      } finally {
          setIsCheckingCloud(false);
          setLastCheckTime(new Date()); // Update last check time
      }
  };

  if (!isOpen) return null;

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
      a.download = `LMS_Backup_${new Date().toISOString().split('T')[0]}.sqlite`;
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
              alert("Nhập dữ liệu SQLite thành công!");
              onRefreshApp();
              onClose();
          } else {
              setError("Không thể nhập file này.");
          }
      } catch (err) {
          setError("Lỗi khi đọc file database.");
      } finally {
          setIsDBActionLoading(false);
      }
  };

  const updateSyncTimestamp = () => {
      const now = new Date();
      localStorage.setItem(LS_KEY_SYNC, now.toISOString());
      setLocalLastSync(now);
      setHasNewerVersion(false);
      checkCloudStatus(); // Re-check to update UI cleanly
  };

  const handleCloudUpload = async () => {
      if (!user) return;
      setIsSyncing(true);
      setError(null);
      console.log("[Cloud Upload] Starting upload...");
      try {
          const data = getDBBinary();
          if (!data) {
              throw new Error("Không lấy được dữ liệu DB từ bộ nhớ.");
          }
          const storageRef = ref(storage, `backups/${user.uid}/study_data.sqlite`);
          await uploadBytes(storageRef, data);
          console.log("[Cloud Upload] Upload successful.");
          updateSyncTimestamp();
          alert("Đã sao lưu lên Firebase Cloud thành công!");
      } catch (err: any) {
          console.error("[Cloud Upload Error]", err);
          setError("Lỗi đồng bộ Cloud: " + err.message);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleCloudDownload = async () => {
      if (!user) {
          console.error("User not logged in");
          return;
      }
      
      console.log(`[Cloud Download] Starting download for user: ${user.uid}`);
      setIsSyncing(true);
      setError(null);
      
      try {
          const storageRef = ref(storage, `backups/${user.uid}/study_data.sqlite`);
          
          console.log("[Cloud Download] 1. Getting Download URL...");
          // Lấy URL tải xuống
          const url = await getDownloadURL(storageRef);
          console.log("[Cloud Download] URL obtained:", url);
          
          try {
             // Thử tải trực tiếp (có thể lỗi CORS)
             console.log("[Cloud Download] 2. Attempting fetch...");
             const response = await fetch(url);
             if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
             
             const buffer = await response.arrayBuffer();
             console.log(`[Cloud Download] Buffer size: ${buffer.byteLength} bytes. Importing...`);
             const success = await importDBFile(buffer);
             
             if (success) {
                 updateSyncTimestamp();
                 alert("Đã khôi phục dữ liệu từ Firebase thành công!");
                 onRefreshApp();
                 onClose();
             } else {
                 throw new Error("File tải về không hợp lệ.");
             }
          } catch (fetchErr: any) {
             console.warn("[Cloud Download] Auto-fetch failed (CORS likely). Switching to manual download.", fetchErr);
             
             // Hướng dẫn fix CORS cho Developer trong Console
             const bucketName = storage.app.options.storageBucket;
             console.group("⚠️ CẤU HÌNH CORS CHO FIREBASE STORAGE");
             console.log("Lỗi này xảy ra do Firebase chặn tải file từ tên miền khác (CORS).");
             console.log("Để khắc phục triệt để, hãy COPY và CHẠY lệnh sau trong Google Cloud Shell:");
             // Sử dụng lệnh echo để tạo file cors.json luôn, tránh lỗi "No such file"
             console.log(`%cecho '[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json && gsutil cors set cors.json gs://${bucketName}`, "color: #2563eb; font-weight: bold; padding: 4px; background: #eff6ff; border-radius: 4px;");
             console.groupEnd();
             
             // Fallback: Tự động tải file về máy người dùng
             const a = document.createElement('a');
             a.href = url;
             a.target = '_blank';
             a.download = `LMS_Backup_${new Date().toISOString().split('T')[0]}.sqlite`;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);

             setError("Không thể tự động đồng bộ do hạn chế bảo mật trình duyệt (CORS). File đã được tải xuống máy của bạn. Vui lòng nhấn nút 'Nhập file' bên dưới để chọn file vừa tải.");
          }

      } catch (err: any) {
          console.error("[Cloud Download Error]", err);
          let msg = "Lỗi tải dữ liệu.";
          if (err.code === 'storage/object-not-found') {
              msg = "Chưa có bản sao lưu nào trên Cloud. Bạn đã Upload chưa?";
          } else if (err.code === 'storage/unauthorized') {
              msg = "Không có quyền truy cập file này.";
          } else {
              msg = err.message || JSON.stringify(err);
          }
          setError(msg);
      } finally {
          setIsSyncing(false);
      }
  };

  const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(date);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div><h2 className="text-xl font-bold text-gray-900">Cài đặt & Đồng bộ</h2><p className="text-xs text-gray-500">Quản lý giao diện và sao lưu Firebase</p></div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* Section: Themes */}
          <section>
            <div className="flex items-center gap-2 mb-4"><div className={`${theme.bgMedium} p-2 rounded-lg ${theme.textDark}`}><Palette size={18} /></div><h3 className="font-bold text-gray-800">Chủ đề</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'blue', name: 'Mặc định', bg: 'bg-blue-600', desc: 'Sáng sủa & Chuyên nghiệp' },
                { id: 'rose', name: 'Bé Hiền', bg: 'bg-rose-500', desc: 'Ngọt ngào & Dành riêng cho em' },
                { id: 'emerald', name: 'Matcha', bg: 'bg-emerald-600', desc: 'Tươi mới & Năng lượng' },
                { id: 'violet', name: 'Taro', bg: 'bg-violet-600', desc: 'Mộng mơ & Nhẹ nhàng' },
              ].map(t => (
                <button key={t.id} onClick={() => onSetTheme(t.id as ThemeColor)} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${themeColor === t.id ? `${theme.border} ${theme.bgLight}` : 'border-gray-100'}`}><div className={`w-10 h-10 rounded-full ${t.bg} flex items-center justify-center text-white`}>{themeColor === t.id && <Check size={20} />}</div><div><p className={`font-bold text-sm ${themeColor === t.id ? theme.textDark : 'text-gray-700'}`}>{t.name}</p><p className="text-xs text-gray-400">{t.desc}</p></div></button>
              ))}
            </div>
          </section>

          {/* Section: Cloud Sync (Firebase) */}
          <section className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-3xl border border-orange-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-white p-2 rounded-lg text-orange-600 shadow-sm"><Cloud size={18} /></div>
                    <h3 className="font-bold text-gray-800">Đồng bộ Firebase</h3>
                    {user && (
                        <button 
                            onClick={checkCloudStatus} 
                            disabled={isCheckingCloud}
                            className={`p-1.5 rounded-full hover:bg-white/50 text-orange-600 transition-all ${isCheckingCloud ? 'animate-spin' : ''}`}
                            title="Kiểm tra cập nhật"
                        >
                            <RefreshCw size={14} />
                        </button>
                    )}
                </div>
                {user ? (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check size={10} /> {user.email}
                    </span>
                ) : (
                    <button onClick={onOpenAuth} className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline"><LogIn size={14} /> Đăng nhập Firebase</button>
                )}
            </div>

            {user && (
                <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-600 bg-white/50 p-3 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-400" />
                        <span>Máy: <span className="font-semibold">{localLastSync ? formatDate(localLastSync) : 'Chưa đồng bộ'}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Cloud size={12} className="text-gray-400" />
                        <span>Cloud: <span className="font-semibold">{cloudLastModified ? formatDate(cloudLastModified) : 'Chưa có file'}</span></span>
                    </div>
                    {lastCheckTime && (
                        <div className="flex items-center gap-1.5 text-blue-600 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0">
                            <Activity size={12} />
                            <span>Đã kiểm tra: <span className="font-semibold">{formatDate(lastCheckTime)}</span></span>
                        </div>
                    )}
                </div>
            )}
            
            {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100 animate-pulse">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleCloudUpload}
                    disabled={!user || isSyncing}
                    className="flex flex-col items-center justify-center gap-1 p-4 bg-white border border-orange-200 rounded-2xl hover:bg-orange-50 transition-all text-orange-700 disabled:opacity-50"
                >
                    {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <CloudUpload size={20} />}
                    <span className="text-sm font-bold">Lên Cloud</span>
                </button>
                <button 
                    onClick={handleCloudDownload}
                    disabled={!user || isSyncing}
                    className="relative flex flex-col items-center justify-center gap-1 p-4 bg-white border border-orange-200 rounded-2xl hover:bg-orange-50 transition-all text-orange-700 disabled:opacity-50"
                >
                    {hasNewerVersion && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                    {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <CloudDownload size={20} />}
                    <span className="text-sm font-bold">Về máy</span>
                    {hasNewerVersion && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded-full mt-1">Có bản mới</span>}
                </button>
            </div>
          </section>

          {/* Section: Local Backup */}
          <section>
            <div className="flex items-center gap-2 mb-4"><div className="bg-amber-50 p-2 rounded-lg text-amber-600"><Database size={18} /></div><h3 className="font-bold text-gray-800">File Cục bộ (.sqlite)</h3></div>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExportDB} className="flex items-center justify-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm font-bold"><Download size={16} /> Xuất file</button>
                <div className="relative">
                    <input type="file" accept=".sqlite,.db" onChange={handleImportDBFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 text-sm font-bold">
                        {isDBActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Nhập file
                    </div>
                </div>
            </div>
          </section>

          {/* Section: LMS Import */}
          <section>
            <div className="flex items-center gap-2 mb-4"><div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Calendar size={18} /></div><h3 className="font-bold text-gray-800">Nạp JSON LMS mới</h3></div>
            <div className="space-y-4">
                <input type="text" value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" placeholder="Ví dụ: HK251_Lịch_Học" />
                <label className="flex items-center gap-3 cursor-pointer group mb-2"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isNewSchedule ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>{isNewSchedule && <Check size={14} className="text-white" />}<input type="checkbox" className="hidden" checked={isNewSchedule} onChange={(e) => setIsNewSchedule(e.target.checked)} /></div><span className="text-sm font-semibold text-gray-600">Tạo bộ lịch hoàn toàn mới</span></label>
                {/* Error here handles JSON parse errors */}
                <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[10px] resize-none" placeholder='Dán dữ liệu JSON vào đây...'></textarea>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 pb-safe">
          <button onClick={onClose} className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-full font-bold text-sm">Đóng</button>
          <button onClick={handleImport} disabled={isProcessing || !jsonInput} className={`px-8 py-3 ${theme.bg} text-white rounded-full font-bold text-sm flex items-center gap-2 shadow-lg ${theme.shadow}`}>{isProcessing ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Lưu dữ liệu</>}</button>
        </div>
      </div>
    </div>
  );
};

export default DataSettingsModal;
