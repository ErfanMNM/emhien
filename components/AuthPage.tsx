
import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile 
} from 'firebase/auth';
import { GraduationCap, Loader2, LogIn, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
    onLoginSuccess: () => void;
    onBack?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
            }
            onLoginSuccess();
        } catch (err: any) {
            console.error(err);
            let message = "Đã xảy ra lỗi. Vui lòng thử lại.";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                message = "Email hoặc mật khẩu không chính xác.";
            } else if (err.code === 'auth/email-already-in-use') {
                message = "Email này đã được sử dụng.";
            } else if (err.code === 'auth/weak-password') {
                message = "Mật khẩu quá yếu (tối thiểu 6 ký tự).";
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-blue-600 p-8 text-center relative">
                    {onBack && (
                        <button onClick={onBack} className="absolute top-4 left-4 p-2 text-white/80 hover:bg-white/20 rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4 text-white">
                        <GraduationCap size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">Hiền Ham Học</h1>
                    <p className="text-blue-100 text-sm">Siêu Vip • Đồng bộ đám mây với Firebase</p>
                </div>

                <div className="p-8">
                    <div className="flex gap-4 mb-8 bg-gray-50 p-1 rounded-xl">
                        <button
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Đăng nhập
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Đăng ký
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5">Họ tên</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5">Mật khẩu</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : isLogin ? (
                                <>
                                    <LogIn size={20} /> Vào ứng dụng
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} /> Tạo tài khoản mới
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
