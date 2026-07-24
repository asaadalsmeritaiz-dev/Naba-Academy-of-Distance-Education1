import React, { useState } from 'react';
import { GraduationCap, Lock, User, Key, AlertCircle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { t, toggleLanguage, language, isRtl } = useLanguage();
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetId, setResetId] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId || !password) {
      setError(t('login_required'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login-university', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university_id: universityId, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || t('login_error'));
      } else {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.warn('Backend login request failed, checking client fallback:', err);
      // Fallback for demo credentials in case of network disconnects
      if (universityId === 'admin' && password === 'admin@2026') {
        onLoginSuccess({
          id: 'admin1-uuid-virtual',
          name: 'م/اسعد الشميري',
          role: 'admin',
          university_id: 'admin',
          email: 'admin@naba.edu'
        });
      } else if (universityId === '202600001' && password === '202600001@2026') {
        onLoginSuccess({
          id: 'student1-uuid-virtual',
          name: 'أحمد محمد العبسي',
          role: 'student',
          university_id: '202600001',
          email: 'ahmed@naba.edu'
        });
      } else if (universityId === 'instructor' && password === 'sara@2026') {
        onLoginSuccess({
          id: 'instructor1-uuid-virtual',
          name: 'د. سارة أحمد',
          role: 'instructor',
          university_id: 'instructor',
          email: 'sara@naba.edu'
        });
      } else {
        setError(t('login_error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetId) {
      setResetError('يرجى إدخال الرقم الأكاديمي لإعادة التعيين');
      return;
    }

    setResetError(null);
    setResetSuccessMessage(null);
    setResetLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university_id: resetId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setResetError(data.error || 'فشل توليد رمز إعادة تعيين كلمة المرور');
      } else {
        setResetSuccessMessage(data.message + (data.token ? ` \nالرمز التجريبي: ${data.token}` : ''));
      }
    } catch (err) {
      console.error('Password reset request failed:', err);
      setResetError('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً');
    } finally {
      setResetLoading(false);
    }
  };

  const fillCredentials = (id: string, pass: string) => {
    setUniversityId(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/70 p-4 md:p-8 relative" dir={isRtl ? 'rtl' : 'ltr'} id="login-viewport">
      {/* Floating Language Switcher */}
      <button
        type="button"
        onClick={toggleLanguage}
        className="absolute top-4 left-4 md:top-8 md:left-8 px-4.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/80 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 z-50 cursor-pointer"
      >
        <span>{t('lang_toggle')}</span>
      </button>

      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative" id="login-container">
        
        {/* Brand Banner */}
        <div className="p-8 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white text-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="p-3.5 bg-white/10 w-max mx-auto rounded-2xl backdrop-blur-md border border-white/10 mb-4 shadow-inner flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">{t('title')}</h2>
          <p className="text-sm font-semibold text-slate-200/90 mt-1" dir="ltr">{t('subtitle')}</p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex gap-2.5 items-start text-xs text-rose-600 font-semibold leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* University ID Field */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-bold block">{t('academic_id')}</label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400`}>
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  placeholder={t('academic_id_placeholder')}
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all shadow-sm`}
                  id="login-university-id-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-bold block">{t('password')}</label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400`}>
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all shadow-sm`}
                  id="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-slate-400 hover:text-slate-600 transition-colors`}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex justify-between items-center px-1 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 h-4 w-4 accent-slate-900 cursor-pointer"
                  id="remember-me-checkbox"
                />
                <span className="text-xs text-slate-500 font-bold">{t('remember_me')}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-xs text-slate-600 hover:text-slate-800 font-bold transition-colors"
              >
                {t('forgot_password')}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-blue-950 hover:from-slate-800 hover:to-blue-900 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-slate-100/50 flex items-center justify-center gap-2"
              id="login-submit-button"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  <span>{language === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>
                </>
              ) : (
                <span>{t('login')}</span>
              )}
            </button>
          </form>

          {/* Quick Access Helper */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100/50 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('202600001', '202600001@2026')}
                className="p-2 bg-white border border-slate-100 hover:border-slate-800 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-all text-center shadow-sm"
              >
                {t('role_student')}
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('instructor', 'sara@2026')}
                className="p-2 bg-white border border-slate-100 hover:border-slate-800 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-all text-center shadow-sm"
              >
                {language === 'ar' ? 'عضو التدريس' : 'Instructor Portal'}
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'admin@2026')}
                className="p-2 bg-white border border-slate-100 hover:border-slate-800 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-all text-center shadow-sm"
              >
                {t('role_admin')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-155">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm">استعادة كلمة المرور المفقودة</h3>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetSuccessMessage(null);
                  setResetError(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                يرجى إدخال الرقم الأكاديمي الخاص بك. سيقوم النظام بتوليد رمز أمان لإعادة تعيين كلمة المرور بشكل مؤقت.
              </p>

              {resetError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex gap-2 text-xs text-rose-600 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-2 text-xs text-emerald-700 font-semibold whitespace-pre-wrap">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block">الرقم الأكاديمي</label>
                <input
                  type="text"
                  placeholder="مثال: CS-2023-8849"
                  value={resetId}
                  onChange={(e) => setResetId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-slate-900 to-blue-950 hover:from-slate-800 hover:to-blue-900 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-slate-50 flex justify-center items-center gap-1.5"
                >
                  {resetLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  <span>طلب رمز أمان جديد</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetSuccessMessage(null);
                    setResetError(null);
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
