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
  // Navigation for students
  const studentNav = [
    { id: 'dashboard', label: 'لوحة التحكم الرئيسية', icon: LayoutDashboard },
    { id: 'courses', label: 'المقررات الدراسية', icon: BookOpen },
    { id: 'exams', label: 'الاختبارات الذكية', icon: ShieldAlert },
    { id: 'ai-tutor', label: 'المساعد الدراسي الذكي', icon: BrainCircuit },
    { id: 'profile', label: 'الملف الشخصي والأمان', icon: Settings }
  ];

  // Navigation for instructors
  const instructorNav = [
    { id: 'proctor-dashboard', label: 'غرفة المراقبة والتحكم المباشر', icon: ShieldAlert, badge: 'مباشر' },
    { id: 'ai-generator', label: 'توليد الاختبارات بالذكاء الاصطناعي', icon: BrainCircuit },
    { id: 'courses-instructor', label: 'إدارة المساقات التعليمية', icon: BookOpen },
    { id: 'student-analytics', label: 'تحليلات سلوكيات الطلاب', icon: Users },
    { id: 'profile', label: 'الملف الشخصي والأمان', icon: Settings }
  ];

  // Navigation for admins
  const adminNav = [
    { id: 'admin-dashboard', label: 'لوحة التحكم العامة', icon: LayoutDashboard },
    { id: 'admin-users', label: 'إدارة المستخدمين', icon: Users },
    { id: 'admin-terms', label: 'إدارة الترمات الأكاديمية', icon: Clock },
    { id: 'admin-courses', label: 'جميع المساقات الدراسية', icon: BookOpen },
    { id: 'admin-settings', label: 'إعدادات النظام العام', icon: Settings },
    { id: 'admin-logs', label: 'سجلات عمليات النظام', icon: FilePlus },
    { id: 'profile', label: 'الملف الشخصي والأمان', icon: Settings }
  ];

  const currentNav = 
    currentRole === 'student' 
      ? studentNav 
      : currentRole === 'instructor' 
        ? instructorNav 
        : adminNav;

  return (
    <aside className="w-80 h-[calc(100vh-77px)] bg-white border-l border-slate-100 flex flex-col justify-between p-5 shrink-0" id="app-sidebar">
      {/* Navigation Menu */}
      <div className="space-y-6">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3 px-3">
            {currentRole === 'student' 
              ? 'القائمة الأكاديمية' 
              : currentRole === 'instructor' 
                ? 'قائمة الإشراف والتعليم' 
                : 'قائمة المدير الفني'}
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
            <span className="text-xs font-extrabold text-blue-950">الفصل الحالي</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">{currentUser.semester}</p>
            <p className="text-[10px] text-slate-500 font-medium">معدل الحضور الدراسي: ٩٤٪</p>
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
            <span className="text-xs font-bold text-slate-800 block">هل تحتاج للمساعدة؟</span>
            <span className="text-[10px] text-slate-400 block hover:underline cursor-pointer">تواصل مع الدعم الأكاديمي</span>
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-400 font-medium">
          النسخة المحدثة v2.4 • أكاديمية نبا
        </div>
      </div>
    </aside>
  );
}
