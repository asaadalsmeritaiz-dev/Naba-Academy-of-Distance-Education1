import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  ShieldAlert,
  Settings,
  Users,
  FilePlus,
  HelpCircle,
  Clock
} from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  currentUser: User;
  currentRole: 'student' | 'instructor' | 'admin';
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({
  currentUser,
  currentRole,
  activeTab,
  setActiveTab
}: SidebarProps) {
  const { t, language, isRtl } = useLanguage();

  // Navigation for students
  const studentNav = [
    { id: 'dashboard', label: language === 'ar' ? 'لوحة التحكم الرئيسية' : 'Main Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: language === 'ar' ? 'المقررات الدراسية' : 'My Courses', icon: BookOpen },
    { id: 'exams', label: language === 'ar' ? 'الاختبارات الذكية' : 'Smart Exams', icon: ShieldAlert },
    { id: 'ai-tutor', label: language === 'ar' ? 'المساعد الدراسي الذكي' : 'AI Study Assistant', icon: BrainCircuit },
    { id: 'profile', label: language === 'ar' ? 'الملف الشخصي والأمان' : 'Profile & Security', icon: Settings }
  ];

  // Navigation for instructors
  const instructorNav = [
    { id: 'proctor-dashboard', label: language === 'ar' ? 'غرفة المراقبة والتحكم المباشر' : 'Live Proctoring Room', icon: ShieldAlert, badge: language === 'ar' ? 'مباشر' : 'LIVE' },
    { id: 'ai-generator', label: language === 'ar' ? 'توليد الاختبارات بالذكاء الاصطناعي' : 'AI Exam Generator', icon: BrainCircuit },
    { id: 'courses-instructor', label: language === 'ar' ? 'إدارة المساقات التعليمية' : 'Course Management', icon: BookOpen },
    { id: 'student-analytics', label: language === 'ar' ? 'تحليلات سلوكيات الطلاب' : 'Student Analytics', icon: Users },
    { id: 'profile', label: language === 'ar' ? 'الملف الشخصي والأمان' : 'Profile & Security', icon: Settings }
  ];

  // Navigation for admins
  const adminNav = [
    { id: 'admin-dashboard', label: language === 'ar' ? 'لوحة التحكم العامة' : 'General Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: language === 'ar' ? 'إدارة المستخدمين' : 'User Management', icon: Users },
    { id: 'admin-terms', label: language === 'ar' ? 'إدارة الترمات الأكاديمية' : 'Manage Academic Terms', icon: Clock },
    { id: 'admin-courses', label: language === 'ar' ? 'جميع المساقات الدراسية' : 'All Courses', icon: BookOpen },
    { id: 'admin-settings', label: language === 'ar' ? 'إعدادات النظام العام' : 'System Settings', icon: Settings },
    { id: 'admin-logs', label: language === 'ar' ? 'سجلات عمليات النظام' : 'System Logs', icon: FilePlus },
    { id: 'profile', label: language === 'ar' ? 'الملف الشخصي والأمان' : 'Profile & Security', icon: Settings }
  ];

  const currentNav = 
    currentRole === 'student' 
      ? studentNav 
      : currentRole === 'instructor' 
        ? instructorNav 
        : adminNav;

  return (
    <aside className={`w-80 h-[calc(100vh-77px)] bg-white ${isRtl ? 'border-l' : 'border-r'} border-slate-100 flex flex-col justify-between p-5 shrink-0`} id="app-sidebar">
      {/* Navigation Menu */}
      <div className="space-y-6">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3 px-3">
            {currentRole === 'student' 
              ? (language === 'ar' ? 'القائمة الأكاديمية' : 'Academic Menu')
              : currentRole === 'instructor' 
                ? (language === 'ar' ? 'قائمة الإشراف والتعليم' : 'Instruction Menu')
                : (language === 'ar' ? 'قائمة المدير الفني' : 'Technical Menu')}
          </span>
          <nav className="space-y-1.5">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-sm shadow-slate-50/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  id={`sidebar-item-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-slate-800' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {/* Optional Badge */}
                  {'badge' in item && (
                    <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Current Semester / Session Info Card */}
        <div className="bg-gradient-to-br from-slate-100/60 to-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-slate-800" />
            <span className="text-xs font-extrabold text-blue-950">
              {language === 'ar' ? 'الفصل الحالي' : 'Current Term'}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">{currentUser.semester}</p>
            <p className="text-[10px] text-slate-500 font-medium">
              {language === 'ar' ? 'معدل الحضور الدراسي: ٩٤٪' : 'Attendance Rate: 94%'}
            </p>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-900 h-full rounded-full" style={{ width: '94%' }} />
          </div>
        </div>
      </div>

      {/* Quick Help & Platform Support */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-3 py-2 border-t border-slate-50 pt-4">
          <HelpCircle className="h-5 w-5 text-slate-400" />
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              {language === 'ar' ? 'هل تحتاج للمساعدة؟' : 'Need help?'}
            </span>
            <span className="text-[10px] text-slate-400 block hover:underline cursor-pointer">
              {language === 'ar' ? 'تواصل مع الدعم الأكاديمي' : 'Contact academic support'}
            </span>
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-400 font-medium">
          {language === 'ar' ? 'النسخة المحدثة v2.4 • أكاديمية نبا' : 'Version v2.4 • Naba Academy'}
        </div>
      </div>
    </aside>
  );
}
