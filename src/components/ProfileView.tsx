import React, { useState } from 'react';
import { Lock, Shield, CheckCircle, AlertCircle, User, GraduationCap, Key, RefreshCw } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileViewProps {
  currentUser: UserType;
  currentRole: 'student' | 'instructor' | 'admin';
}

export default function ProfileView({ currentUser, currentRole }: ProfileViewProps) {
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('يرجى ملء جميع حقول كلمة المرور.');
      return;
    }

    if (newPassword.length < 6) {
      setError('يجب أن تحتوي كلمة المرور الجديدة على 6 أحرف على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university_id: currentUser.studentId || 'UST-ADMIN',
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'فشلت عملية تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية.');
      } else {
        setSuccess('تم تحديث كلمة المرور الخاصة بك بنجاح وأمان!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      setError('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200" id="profile-view-container" dir="rtl">
      {/* View Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900">الملف الشخصي والتحكم الأمني</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">تتبع هويتك الأكاديمية وإدارة معايير الخصوصية وكلمة مرورك الموحدة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - ID and Info Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-l from-slate-900 to-slate-800" />
            
            {/* User Avatar */}
            <div className="relative w-24 h-24 mx-auto mt-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="rounded-3xl object-cover ring-4 ring-slate-100 shadow-md h-full w-full"
              />
              <div className="absolute -bottom-1 -left-1 bg-emerald-500 text-white p-1.5 rounded-xl border-4 border-white">
                <Shield className="h-4 w-4" />
              </div>
            </div>

            {/* Profile Core Info */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">{currentUser.name}</h3>
              <p className="text-xs text-slate-800 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full inline-block">
                {currentRole === 'student' ? 'طالب رسمي منتظم' : currentRole === 'instructor' ? 'عضو هيئة التدريس والتحكيم' : 'مدير المنصة الفني'}
              </p>
            </div>

            {/* University ID Box */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">الرقم الأكاديمي الموحد</span>
              <p className="text-lg font-black text-slate-800 font-mono tracking-wider select-all">
                {currentUser.studentId || 'UST-SUPER-ADMIN'}
              </p>
            </div>

            {/* Additional Info Rows */}
            <div className="border-t border-slate-100 pt-5 space-y-3.5 text-right text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                  الكلية والتخصص:
                </span>
                <span className="text-slate-800 font-extrabold">{currentUser.major}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  البريد الإلكتروني:
                </span>
                <span className="text-slate-700 font-bold font-mono text-[11px]">{currentUser.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Password Reset and Security Control */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-800" />
              تحديث وتغيير كلمة المرور الشخصية
            </h3>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-2 text-xs text-rose-600 font-semibold leading-relaxed animate-shake">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-2 text-xs text-emerald-800 font-bold leading-relaxed">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">كلمة المرور الحالية: *</label>
                <div className="relative">
                  <span className="absolute right-3.5 top-3 text-slate-400">
                    <Key className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="أدخل كلمة مرورك الحالية لتأكيد الهوية"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl pr-11 pl-4 py-2.5 text-xs text-slate-850 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">كلمة المرور الجديدة: *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">تأكيد كلمة المرور الجديدة: *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-slate-100"
                >
                  {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Lock className="h-4.5 w-4.5" />}
                  <span>حفظ كلمة المرور الجديدة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
