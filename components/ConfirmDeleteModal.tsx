
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  scheduleName: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, scheduleName, onConfirm, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (inputValue.toLowerCase().trim() !== 'tôi đồng ý') return;
    
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Xác nhận xóa lịch
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Bạn đang yêu cầu xóa lịch trình: <span className="font-bold text-gray-900">{scheduleName}</span>
          </p>
          
          <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-xs text-red-700">
            Hành động này sẽ ẩn lịch khỏi danh sách của bạn.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Để xác nhận, vui lòng nhập <span className="font-bold text-gray-900">tôi đồng ý</span>:
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="nhập tôi đồng ý"
              autoFocus
            />
          </div>
        </div>

        <div className="p-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
            disabled={isDeleting}
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            disabled={inputValue.toLowerCase().trim() !== 'tôi đồng ý' || isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? 'Đang xóa...' : <><Trash2 size={16} /> Xóa vĩnh viễn</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
