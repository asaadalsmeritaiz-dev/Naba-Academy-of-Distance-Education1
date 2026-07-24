import React, { useState } from 'react';
import { Bell, GraduationCap, User, ShieldAlert, CheckCircle, Settings, LogOut } from 'lucide-react';
import { User as UserType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentUser: UserType;
  currentRole: 'student' | 'instructor' | 'admin';
  onRoleChange: (role: 'student' | 'instructor' | 'admin') => void;
  onOpenNotifications: () => void;
  onLogout?: () => void;
}

export default function Header({
  currentUser,
  currentRole,
  onRoleChange,
  onOpenNotifications,
  onLogout
}: HeaderProps) {
  const { t, toggleLanguage, language, isRtl } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { 
      id: 1, 
      text: language === 'ar' ? 'تمت إضافة تقييم جديد لمادة الذكاء الاصطناعي' : 'New evaluation added for AI course', 
      date: language === 'ar' ? 'منذ ١٠ دقائق' : '10m ago', 
      unread: true 
    },
    { 
      id: 2, 
      text: language === 'ar' ? 'تبدأ المحاضرة التفاعلية المباشرة بعد قليل' : 'Interactive lecture starting soon', 
      date: language === 'ar' ? 'منذ ٢٥ دقيقة' : '25m ago', 
      unread: true 
    },
    { 
      id: 3, 
      text: language === 'ar' ? 'تم تحديث ملخص المحاضرة الثانية بواسطة الذكاء الاصطناعي' : 'Lecture 2 summary updated by AI', 
      date: language === 'ar' ? 'منذ ساعتين' : '2h ago', 
      unread: false 
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white" id="app-header">
      {/* Brand Logo and Platform Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-800 text-white rounded-xl shadow-md border border-slate-700 flex items-center justify-center">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {language === 'ar' ? 'أكاديمية نبا' : 'Naba Academy'}
            <span className="text-xs bg-slate-800 text-slate-200 px-2 py-0.5 rounded-full font-medium border border-slate-700">
              {language === 'ar' ? 'للتعليم عن بعد' : 'Distance Education'}
            </span>
          </h1>
        </div>
      </div>

      {/* User Profile Controls */}
      <div className="flex items-center gap-4">

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer shadow-sm hover:text-white"
        >
          {language === 'ar' ? 'English' : 'العربية'}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              onOpenNotifications();
            }}
            className="p-2.5 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl border border-slate-800 transition-colors relative"
            title={t('notifications')}
            id="notifications-bell"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-rose-600 rounded-full border-2 border-slate-900 ring-1 ring-rose-300"></span>
          </button>

          {showNotifications && (
            <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-3 w-80 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200`}>
              <div className="px-4 py-3 border-b border-slate-850 bg-slate-850 flex justify-between items-center">
                <span className="font-bold text-slate-200 text-sm">
                  {language === 'ar' ? 'الإشعارات الأخيرة' : 'Recent Notifications'}
                </span>
                <span className="text-xs text-slate-350 font-bold hover:underline cursor-pointer">
                  {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                </span>
              </div>
              <div className="divide-y divide-slate-850 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-4 hover:bg-slate-850/50 transition-colors flex gap-3 ${n.unread ? 'bg-slate-850/20' : ''}`}>
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-white' : 'bg-slate-650'}`} />
                    <div className="space-y-1">
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{n.text}</p>
                      <span className="text-[10px] text-slate-450 block">{n.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center border-t border-slate-850 bg-slate-850">
                <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-300 font-bold hover:text-white">
                  {language === 'ar' ? 'إغلاق القائمة' : 'Close Menu'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className={`flex items-center gap-3 ${isRtl ? 'border-r pr-4' : 'border-l pl-4'} border-slate-800`}>
          <div className={`text-left hidden sm:block ${isRtl ? 'text-right' : 'text-left'}`}>
            <span className="text-xs bg-slate-800 text-slate-250 font-bold px-2 py-0.5 rounded-full block text-center mb-0.5 border border-slate-700">
              {currentRole === 'student' 
                ? (language === 'ar' ? 'طالب منتظم' : 'Student') 
                : currentRole === 'instructor' 
                  ? (language === 'ar' ? 'عضو هيئة التدريس' : 'Faculty') 
                  : (language === 'ar' ? 'مدير المنصة الفني' : 'Technical Admin')}
            </span>
            <p className="text-sm font-bold text-white">{currentUser.name}</p>
            <p className="text-[10px] text-slate-450">
              {currentRole === 'admin' 
                ? (language === 'ar' ? 'الرمز التعريفي: UST-001' : 'ID: UST-001') 
                : (currentUser.studentId || (language === 'ar' ? 'أستاذ المساق' : 'Course Instructor'))}
            </p>
          </div>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-10 w-10 rounded-xl object-cover ring-2 ring-slate-800 shadow-sm"
          />
          {onLogout && (
            <button
              onClick={onLogout}
              className={`p-2.5 text-slate-450 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-all border border-transparent hover:border-rose-900/50 ${isRtl ? 'mr-2' : 'ml-2'}`}
              title={t('logout')}
              id="logout-btn"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
