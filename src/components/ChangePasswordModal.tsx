import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  universityId: string;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ universityId, onSuccess }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('يرجى تعبئة جميع الحقول المطلوبة لتحديث كلمة المرور');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة غير مطابقة لتأكيد كلمة المرور');
      return;
    }

    if (newPassword.length < 6) {
      setError('يجب أن تحتوي كلمة المرور الجديدة على ٦ خانات على الأقل لضمان الأمان');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university_id: universityId,
          old_password: oldPassword,
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'فشل تحديث كلمة المرور. يرجى التحقق من كلمة المرور القديمة');
      } else {
        setSuccess('تم تحديث كلمة المرور الخاصة بك بنجاح! سيتم توجيهك للوحة التحكم الآن.');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Password change failed:', err);
      setError('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]" dir="rtl" id="change-password-modal-container">
      <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full shadow-2xl overflow-hidden p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="p-3.5 bg-slate-100 text-slate-800 rounded-2xl w-max mx-auto border border-slate-200 shadow-inner">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">تحديث كلمة المرور الإلزامية</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed px-2">
            هذا هو تسجيل دخولك الأول للنظام الأكاديمي. حرصاً على سرية معلوماتك، يرجى استبدال كلمة المرور الافتراضية بكلمة مرور خاصة بك.
          </p>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex gap-2 text-xs text-rose-600 font-semibold leading-relaxed animate-in fade-in slide-in-from-top-2 duration-150">
              <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-2 text-xs text-emerald-700 font-semibold leading-relaxed">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Old Password Field */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-bold block">كلمة المرور المؤقتة / الحالية</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="مثال: CS-2023-8849@2026"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-1000 focus:bg-white transition-all shadow-sm"
              id="old-password-input"
            />
          </div>

          {/* New Password Field */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-bold block">كلمة المرور الجديدة</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="أدخل كلمة المرور الجديدة"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-1000 focus:bg-white transition-all shadow-sm"
              id="new-password-input"
            />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-bold block">تأكيد كلمة المرور الجديدة</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="أعد إدخال كلمة المرور الجديدة"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-1000 focus:bg-white transition-all shadow-sm"
              id="confirm-password-input"
            />
          </div>

          {/* Show Pass Toggle */}
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="text-[11px] text-slate-800 hover:text-slate-950 font-bold flex items-center gap-1"
          >
            {showPass ? 'إخفاء كلمات المرور' : 'إظهار كلمات المرور'}
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-slate-50 flex items-center justify-center gap-2"
            id="change-password-submit-btn"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            <span>تحديث كلمة المرور وتفعيل الحساب الأكاديمي</span>
          </button>
        </form>

      </div>
    </div>
  );
}
