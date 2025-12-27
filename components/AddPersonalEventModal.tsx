
import React, { useState } from 'react';
import { X, CalendarPlus, Clock, Type, AlignLeft } from 'lucide-react';

interface AddPersonalEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: { title: string; description: string; date: string; time: string }) => void;
}

const AddPersonalEventModal: React.FC<AddPersonalEventModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;
    onAdd({ title, description, date, time });
    onClose();
    // Reset form
    setTitle('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full rounded-t-2xl sm:rounded-xl shadow-2xl sm:max-w-md overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-purple-50 shrink-0">
          <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
            <CalendarPlus className="text-purple-600" size={20} />
            Thêm kế hoạch cá nhân
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên hoạt động</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type size={16} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="Ví dụ: Học tiếng Anh, Đi tập gym..."
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                <div className="relative">
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="time"
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                </div>
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
            <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                    <AlignLeft size={16} className="text-gray-400" />
                </div>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none h-24 resize-none"
                    placeholder="Nội dung chi tiết..."
                />
            </div>
          </div>

          <div className="pt-2 pb-safe">
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
              >
                Tạo kế hoạch
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonalEventModal;
