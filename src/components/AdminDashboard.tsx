import React, { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  BookOpen,
  ShieldAlert,
  Sparkles,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Key,
  Save,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  BarChart2,
  Bell,
  Check
} from 'lucide-react';
import {
  mockStats,
  mockUsers as initialUsers,
  mockTerms as initialTerms,
  mockActivities,
  mockSettings as initialSettings,
  AdminUser,
  AcademicTerm,
  SystemSettings
} from '../data/mockAdmin';
import { Course } from '../types';

interface AdminDashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  globalCourses: Course[];
}

export default function AdminDashboard({ activeSection, setActiveSection, globalCourses }: AdminDashboardProps) {
  // --- STATE ---
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [terms, setTerms] = useState<AcademicTerm[]>(initialTerms);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  
  // Feedback Toasts / Modals state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [showEditTermModal, setShowEditTermModal] = useState<AcademicTerm | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState<AdminUser | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  // Add Student / Instructor Form State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentMajor, setNewStudentMajor] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentRole, setNewStudentRole] = useState<'student' | 'instructor'>('student');
  const [newStudentLoading, setNewStudentLoading] = useState(false);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  
  // Term Form State
  const [newTermName, setNewTermName] = useState('');
  const [newTermStart, setNewTermStart] = useState('');
  const [newTermEnd, setNewTermEnd] = useState('');

  // User Edit Form State
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [editUserStatus, setEditUserStatus] = useState<'active' | 'suspended' | 'pending'>('active');

  // User Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- UTILS & TOASTS ---
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Get next incremental student ID starting from 202600001
  const getNextStudentId = (currentUsers: AdminUser[]) => {
    let maxId = 202600000;
    currentUsers.forEach((u) => {
      if (u.role === 'student') {
        const idStr = u.university_id || '';
        const idNum = parseInt(idStr, 10);
        if (!isNaN(idNum) && idNum >= 202600001 && idNum < 202700000) {
          if (idNum > maxId) {
            maxId = idNum;
          }
        }
      }
    });
    return String(maxId + 1);
  };

  // --- USER ACTIONS ---
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId || !newStudentName || !newStudentMajor) {
      setAddStudentError('يرجى تعبئة الحقول الإلزامية');
      return;
    }

    setAddStudentError(null);
    setGeneratedTempPassword(null);
    setNewStudentLoading(true);

    const isStudent = newStudentRole === 'student';

    try {
      const response = await fetch('/api/auth/register-university', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university_id: newStudentId,
          full_name: newStudentName,
          major: newStudentMajor,
          email: newStudentEmail || undefined,
          role: newStudentRole
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAddStudentError(data.error || (isStudent ? 'حدث خطأ أثناء تسجيل الطالب' : 'حدث خطأ أثناء تسجيل الأستاذ'));
      } else {
        setGeneratedTempPassword(data.temp_password);
        triggerToast(
          isStudent 
            ? 'تم تسجيل الطالب وتوليد كلمة المرور بنجاح!' 
            : 'تم تسجيل الأستاذ وتوليد كلمة المرور بنجاح!', 
          'success'
        );
        
        // Append to the local list
        const newUserRecord: AdminUser = {
          id: Date.now(),
          name: newStudentName,
          email: newStudentEmail || `${newStudentId}@ust.edu`,
          role: newStudentRole,
          status: 'active',
          joinDate: new Date().toLocaleDateString('en-GB'),
          university_id: newStudentId
        };
        setUsers(prev => [newUserRecord, ...prev]);

        // Clear fields except the generated pass (so the admin can see it in modal)
        setNewStudentId('');
        setNewStudentName('');
        setNewStudentMajor('');
        setNewStudentEmail('');
      }
    } catch (err) {
      console.error(err);
      setAddStudentError('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً');
    } finally {
      setNewStudentLoading(false);
    }
  };

  const handleToggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        triggerToast(
          `تم ${nextStatus === 'active' ? 'تنشيط' : 'إيقاف'} حساب المستخدم ${u.name} بنجاح`,
          nextStatus === 'active' ? 'success' : 'info'
        );
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleResetPassword = (user: AdminUser) => {
    triggerToast(`تم إرسال رابط إعادة تعيين كلمة المرور بنجاح إلى ${user.email}`, 'success');
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setShowEditUserModal(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setEditUserStatus(user.status);
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditUserModal) return;

    setUsers(prev => prev.map(u => {
      if (u.id === showEditUserModal.id) {
        return {
          ...u,
          name: editUserName,
          email: editUserEmail,
          role: editUserRole,
          status: editUserStatus
        };
      }
      return u;
    }));

    triggerToast(`تم تحديث بيانات العضو "${editUserName}" بنجاح`, 'success');
    setShowEditUserModal(null);
  };

  // --- TERM ACTIONS ---
  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName || !newTermStart || !newTermEnd) {
      triggerToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
      return;
    }

    const newTerm: AcademicTerm = {
      id: `term-${Date.now()}`,
      name: newTermName,
      startDate: newTermStart,
      endDate: newTermEnd,
      status: 'upcoming'
    };

    setTerms(prev => [newTerm, ...prev]);
    setShowAddTermModal(false);
    setNewTermName('');
    setNewTermStart('');
    setNewTermEnd('');
    triggerToast(`تم إنشاء الترم الأكاديمي "${newTerm.name}" بنجاح`, 'success');
  };

  const handleToggleTermActive = (termId: string) => {
    setTerms(prev => prev.map(t => {
      if (t.id === termId) {
        const nextIsActive = t.status === 'active';
        const nextStatus = nextIsActive ? 'completed' : 'active';
        
        // Deactivate others if activating this one
        if (!nextIsActive) {
          triggerToast(`تم تفعيل الترم "${t.name}" وإغلاق الفصول الأخرى`, 'success');
          return { ...t, status: 'active' };
        } else {
          triggerToast(`تم إكمال الترم الأكاديمي "${t.name}"`, 'info');
          return { ...t, status: 'completed' };
        }
      }
      // If we activated one, make sure all others are deactivated
      return t.status === 'active' && t.id !== termId ? { ...t, status: 'completed' } : t;
    }));
  };

  const handleDeleteTerm = (termId: string, termName: string) => {
    if (confirm(`هل أنت متأكد من حذف الترم الأكاديمي "${termName}"؟`)) {
      setTerms(prev => prev.filter(t => t.id !== termId));
      triggerToast(`تم إزالة الترم الأكاديمي "${termName}" بنجاح`, 'info');
    }
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('تم حفظ كافة إعدادات النظام وتحديث الحماية البرمجية للمراقب الذكي بنجاح!', 'success');
  };

  const handleGenerateReport = () => {
    triggerToast('جاري تحضير وطباعة التقرير الشامل لمنظومة التعليم الموحد لأكاديمية نبا...', 'info');
    setTimeout(() => {
      triggerToast('اكتمل توليد التقرير! تم تنزيل المستند PDF كنسخة معاينة ذكية.', 'success');
    }, 2000);
  };

  const handleResetPlatform = async () => {
    setResetLoading(true);
    try {
      const response = await fetch('/api/auth/reset-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Reset local state - keep only the logged in Admin user
        setUsers([
          { id: 8, name: 'م/اسعد الشميري', email: 'admin@naba.edu', role: 'admin', status: 'active', joinDate: '01/01/2026' }
        ]);
        setTerms([]);
        
        triggerToast('تمت إعادة تهيئة المنصة بالكامل وحذف كافة البيانات والطلاب للبدء من الصفر بنجاح!', 'success');
        setShowResetConfirmModal(false);
        setActiveSection('admin-overview');
      } else {
        triggerToast('فشل في تصفير المنصة: ' + (data.error || 'خطأ غير معروف'), 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('حدث خطأ أثناء محاولة تصفير المنصة بالاتصال بالخادم', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // --- USER FILTERING COMPUTATIONS ---
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative" id="admin-root">
      
      {/* Toast Feedback */}
      {toast && (
        <div 
          className={`fixed bottom-5 left-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-xs font-bold animate-bounce ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : toast.type === 'error' 
                ? 'bg-rose-50 border-rose-100 text-rose-800' 
                : 'bg-slate-100 border-slate-200 text-slate-950'
          }`}
          id="admin-toast-banner"
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          ) : (
            <TrendingUp className="h-5 w-5 text-slate-800 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Context Breadcrumb / Location Indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-white px-4 py-2.5 w-max rounded-xl border border-slate-100 shadow-sm" id="admin-breadcrumb">
        <span>لوحة التحكم الفنية</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800">
          {activeSection === 'admin-dashboard' && 'لوحة الإحصائيات العامة'}
          {activeSection === 'admin-users' && 'إدارة المستخدمين'}
          {activeSection === 'admin-terms' && 'إدارة الترمات الأكاديمية'}
          {activeSection === 'admin-courses' && 'المساقات الأكاديمية العامة'}
          {activeSection === 'admin-settings' && 'إعدادات النظام'}
          {activeSection === 'admin-logs' && 'سجلات العمليات الأمنية'}
        </span>
      </div>

      {/* --- SECTION 1: OVERVIEW DASHBOARD --- */}
      {activeSection === 'admin-dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-200" id="admin-view-overview">
          
          {/* Header & Quick actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">نظام المراقبة والإدارة الفائقة (Super Admin Cockpit)</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">تتبع مستقر لكافة السجلات التعليمية، أمان جلسات المراقبة وتنشيط فصول أكاديمية نبا.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddTermModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                id="quick-add-term"
              >
                <Plus className="h-4 w-4" />
                إضافة ترم جديد
              </button>
              <button
                onClick={handleGenerateReport}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors border border-slate-200"
                id="quick-generate-report"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                توليد التقرير الأمني العام
              </button>
              <button
                onClick={() => setActiveSection('admin-users')}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                id="quick-manage-roles"
              >
                <Users className="h-4 w-4 text-slate-400" />
                تعديل الصلاحيات
              </button>
            </div>
          </div>

          {/* 4 KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="admin-kpi-row">
            <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">إجمالي الطلاب المقيدين</span>
                <p className="text-2xl font-black text-slate-850">{mockStats.totalStudents}</p>
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  +١٢٪ نمو سنوي
                </span>
              </div>
              <div className="p-3 bg-slate-50 text-slate-750 rounded-xl border border-slate-100 shadow-inner">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">أعضاء هيئة التدريس</span>
                <p className="text-2xl font-black text-slate-850">{mockStats.totalInstructors}</p>
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full block w-max">
                  +٣ انضموا هذا الشهر
                </span>
              </div>
              <div className="p-3 bg-slate-50 text-slate-750 rounded-xl border border-slate-100 shadow-inner">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">المقررات والمساقات</span>
                <p className="text-2xl font-black text-slate-850">{mockStats.totalCourses}</p>
                <span className="text-[10px] text-slate-450 font-medium block">موزعة عبر جميع الفصول</span>
              </div>
              <div className="p-3 bg-slate-50 text-slate-750 rounded-xl border border-slate-100 shadow-inner">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">اختبارات مباشرة الآن</span>
                <p className="text-2xl font-black text-rose-650 flex items-center gap-2">
                  {mockStats.activeExams}
                  <span className="h-2.5 w-2.5 bg-rose-500 rounded-full animate-ping"></span>
                </p>
                <span className="text-[10px] text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-full block w-max">
                  مراقبة حية نشطة للكاميرات
                </span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-650 rounded-xl border border-rose-100 shadow-inner">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Simulated Charts and Recent Activity Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Visual Charts Block */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-150/85 p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-slate-850 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-slate-750" />
                  مؤشرات وإحصائيات التسجيل والتحصيل التعليمي
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Chart 1: Bar Chart Simulation */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">معدل تسجيل الطلاب لكل ترم</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">تحديث فوري</span>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>خريف ٢٠٢٦ (الحالي)</span>
                          <span className="text-slate-700">١,٢٤٥ طالب</span>
                        </div>
                        <div className="w-full bg-slate-50 h-6.5 rounded-lg overflow-hidden flex items-center pr-3 relative">
                          <div className="bg-gradient-to-l from-slate-200 to-blue-500 h-full rounded-lg absolute right-0 top-0 transition-all duration-1000" style={{ width: '100%' }} />
                          <span className="text-[10px] font-extrabold text-white z-10">١٠٠٪ (الأعلى)</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>ربيع ٢٠٢٦</span>
                          <span className="text-slate-700">٩٨٠ طالب</span>
                        </div>
                        <div className="w-full bg-slate-50 h-6.5 rounded-lg overflow-hidden flex items-center pr-3 relative">
                          <div className="bg-gradient-to-l from-slate-100 to-blue-400 h-full rounded-lg absolute right-0 top-0 transition-all duration-1000" style={{ width: '78%' }} />
                          <span className="text-[10px] font-extrabold text-white z-10">٧٨٪</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>خريف ٢٠٢٥</span>
                          <span className="text-slate-700">٨٤٠ طالب</span>
                        </div>
                        <div className="w-full bg-slate-50 h-6.5 rounded-lg overflow-hidden flex items-center pr-3 relative">
                          <div className="bg-gradient-to-l from-slate-50 to-blue-300 h-full rounded-lg absolute right-0 top-0 transition-all duration-1000" style={{ width: '67%' }} />
                          <span className="text-[10px] font-extrabold text-slate-700 z-10">٦٧٪</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart 2: Radial Pie/Donut Chart Simulation */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">معدل إكمال المقررات العامة للمنصة</span>
                      <span className="text-[10px] font-bold text-slate-400">إحصائيات الإنجاز</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2 space-y-4">
                      {/* Styled Semi-donut simulation */}
                      <div className="relative h-28 w-28 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-12 border-slate-50"></div>
                        <div className="absolute inset-0 rounded-full border-12 border-t-emerald-500 border-r-blue-600 border-b-amber-400 border-l-slate-200 rotate-45"></div>
                        <div className="text-center z-10">
                          <span className="text-xl font-black text-slate-800 block">٨٨٪</span>
                          <span className="text-[8px] text-slate-450 font-bold">إجمالي الإنجاز</span>
                        </div>
                      </div>

                      {/* Legends */}
                      <div className="grid grid-cols-3 gap-2 w-full text-center">
                        <div className="p-1.5 bg-emerald-50 rounded-lg">
                          <span className="text-[9px] text-emerald-700 font-extrabold block">مكتمل</span>
                          <span className="text-xs font-black text-slate-850">٥٥٪</span>
                        </div>
                        <div className="p-1.5 bg-slate-100 rounded-lg">
                          <span className="text-[9px] text-slate-700 font-extrabold block">قيد الدراسة</span>
                          <span className="text-xs font-black text-slate-850">٣٣٪</span>
                        </div>
                        <div className="p-1.5 bg-amber-50 rounded-lg">
                          <span className="text-[9px] text-amber-700 font-extrabold block">لم تبدأ</span>
                          <span className="text-xs font-black text-slate-850">١٢٪</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-150/85 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-850 border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>سجل الأنشطة البرمجية والأكاديمية</span>
                  <span className="text-[9px] font-extrabold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full block">نشاط حي</span>
                </h3>

                <div className="space-y-4 max-h-[310px] overflow-y-auto pr-1">
                  {mockActivities.map((act) => (
                    <div key={act.id} className="flex gap-3 text-xs items-start border-b border-slate-50 pb-3 last:border-none last:pb-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        act.type === 'course' 
                          ? 'bg-blue-50 text-blue-600' 
                          : act.type === 'exam' 
                            ? 'bg-rose-50 text-rose-600' 
                            : act.type === 'term' 
                              ? 'bg-purple-50 text-purple-600' 
                              : 'bg-amber-50 text-amber-600'
                      }`}>
                        {act.type === 'course' ? (
                          <BookOpen className="h-4 w-4" />
                        ) : act.type === 'exam' ? (
                          <ShieldAlert className="h-4 w-4" />
                        ) : act.type === 'term' ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-700 leading-relaxed font-semibold">{act.message}</p>
                        <span className="text-[10px] text-slate-450 font-medium block">{act.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 2: USER MANAGEMENT --- */}
      {activeSection === 'admin-users' && (
        <div className="space-y-6 animate-in fade-in duration-200" id="admin-view-users">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">إدارة المستخدمين والأذونات التعليمية</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">تعديل معلومات المشرفين والأساتذة والطلاب، وإعادة ضبط كلمات المرور فورياً.</p>
            </div>
            <div>
              <button
                onClick={() => {
                  setShowAddStudentModal(true);
                  setNewStudentRole('student');
                  setGeneratedTempPassword(null);
                  setAddStudentError(null);
                  setNewStudentId(getNextStudentId(users));
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4.5 py-3 rounded-2xl shadow-md shadow-slate-200/60 flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5"
                id="admin-add-student-trigger"
              >
                <Plus className="h-4.5 w-4.5" />
                إضافة مستخدم جديد (طالب / مدرس)
              </button>
            </div>
          </div>

          {/* Filters Area */}
          <div className="bg-white rounded-2xl border border-slate-150/80 p-4.5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث عن طالب أو أستاذ..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl pr-10 pl-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 font-medium"
              />
            </div>

            {/* Filter selectors */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">الدور المالي:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value as any); setCurrentPage(1); }}
                  className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="all">الكل</option>
                  <option value="student">طلاب</option>
                  <option value="instructor">أساتذة</option>
                  <option value="admin">مشرفين</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">الحالة:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                  className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="all">الكل</option>
                  <option value="active">نشط</option>
                  <option value="suspended">موقف</option>
                  <option value="pending">معلق</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-4.5 px-6">#</th>
                    <th className="py-4.5 px-6">الاسم الكامل</th>
                    <th className="py-4.5 px-6">البريد الإلكتروني</th>
                    <th className="py-4.5 px-6">الدور</th>
                    <th className="py-4.5 px-6">حالة الحساب</th>
                    <th className="py-4.5 px-6">تاريخ التسجيل</th>
                    <th className="py-4.5 px-6 text-center">العمليات الأمنية والسلوكية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                        لا توجد نتائج مطابقة لفلترة البحث الحالية.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => {
                      const absoluteIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 text-slate-400 font-bold">{absoluteIndex}</td>
                          <td className="py-4 px-6 font-bold text-slate-900">{user.name}</td>
                          <td className="py-4 px-6 font-mono text-slate-500">{user.email}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              user.role === 'admin' 
                                ? 'bg-slate-100 text-slate-900 border border-slate-200' 
                                : user.role === 'instructor' 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.role === 'admin' ? 'مدير نظام' : user.role === 'instructor' ? 'أستاذ' : 'طالب'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                              user.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : user.status === 'suspended' 
                                  ? 'bg-rose-50 text-rose-700' 
                                  : 'bg-amber-50 text-amber-700'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                user.status === 'active' ? 'bg-emerald-500' : user.status === 'suspended' ? 'bg-rose-500' : 'bg-amber-500'
                              }`} />
                              {user.status === 'active' ? 'نشط' : user.status === 'suspended' ? 'موقف' : 'معلق'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-mono font-bold">{user.joinDate}</td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleOpenEditUser(user)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 rounded-lg text-slate-500 transition-all border border-slate-100"
                                title="تعديل بيانات العضو"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                className={`p-2 rounded-lg border transition-all ${
                                  user.status === 'active' 
                                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-100 text-rose-600' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600'
                                }`}
                                title={user.status === 'active' ? 'إيقاف الحساب' : 'تنشيط الحساب'}
                              >
                                {user.status === 'active' ? (
                                  <UserX className="h-3.5 w-3.5" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleResetPassword(user)}
                                className="p-2 bg-slate-50 hover:bg-amber-50 hover:text-amber-600 rounded-lg text-slate-500 transition-all border border-slate-100"
                                title="إعادة تعيين كلمة المرور"
                              >
                                <Key className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100 text-xs font-bold text-slate-500">
              <span>عرض {Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredUsers.length, currentPage * itemsPerPage)} من أصل {filteredUsers.length} عضو مقيد</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg">صفحة {currentPage} من {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 3: ACADEMIC TERMS --- */}
      {activeSection === 'admin-terms' && (
        <div className="space-y-6 animate-in fade-in duration-200" id="admin-view-terms">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">إدارة الفصول والترمات الأكاديمية</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">تنشيط الفصول الحالية، التحكم بالتواريخ الزمنية للاختبارات، وترحيل السجلات الأكاديمية.</p>
            </div>
            <button
              onClick={() => setShowAddTermModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              <Plus className="h-4 w-4" />
              إضافة ترم جديد
            </button>
          </div>

          {/* List of Terms Card / Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="terms-list-container">
            {terms.map((term) => (
              <div 
                key={term.id} 
                className={`bg-white rounded-3xl border-2 p-6 shadow-sm flex flex-col justify-between space-y-5 transition-all ${
                  term.status === 'active' 
                    ? 'border-slate-800 shadow-slate-100/40 shadow-md relative' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
                id={`term-card-${term.id}`}
              >
                {term.status === 'active' && (
                  <span className="absolute -top-3 right-5 bg-slate-900 text-white text-[9px] font-extrabold px-3 py-1 rounded-full border-2 border-white uppercase tracking-wider shadow-sm">
                    الترم المالي الحالي نشط
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-900 text-sm">{term.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                      term.status === 'active' 
                        ? 'bg-slate-100 text-slate-900' 
                        : term.status === 'completed' 
                          ? 'bg-slate-100 text-slate-500' 
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {term.status === 'active' ? 'نشط مفعّل' : term.status === 'completed' ? 'منتهي ومحفوظ' : 'قيد التدشين'}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100/80">
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">تاريخ الانطلاق:</span>
                      <span className="font-mono">{term.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">تاريخ الإغلاق المتوقع:</span>
                      <span className="font-mono">{term.endDate}</span>
                    </div>
                  </div>
                </div>

                {/* Operations and actions on Terms */}
                <div className="flex gap-2 border-t border-slate-100 pt-4 mt-auto">
                  <button
                    onClick={() => handleToggleTermActive(term.id)}
                    className={`flex-1 text-[11px] font-extrabold py-2 px-3 rounded-xl transition-colors ${
                      term.status === 'active'
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {term.status === 'active' ? 'أرشفة الترم وإغلاقه' : 'تفعيل وتنشيط هذا الترم'}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteTerm(term.id, term.name)}
                    className="p-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-500 transition-colors"
                    title="حذف الترم"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SECTION 4: GLOBAL COURSES VIEW --- */}
      {activeSection === 'admin-courses' && (
        <div className="space-y-6 animate-in fade-in duration-200" id="admin-view-courses">
          <div>
            <h2 className="text-xl font-black text-slate-900">سجل المساقات الدراسية بالمنصة</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">تتبع مستقر لمساقات الطلاب المقيدة ونسب التقدم الأكاديمي والتحصيل الأكاديمي.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {globalCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-150/80 overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="h-36 relative bg-slate-900">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-full h-full object-cover brightness-75"
                    />
                    <span className="absolute top-3 right-3 bg-black/70 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg">
                      {course.code}
                    </span>
                    <span className="absolute bottom-3 left-3 bg-slate-900 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                      {course.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-black text-slate-900 text-sm leading-snug">{course.title}</h3>
                    <p className="text-[11px] text-slate-400 font-bold">أستاذ المادة: {course.instructorName}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{course.description}</p>
                  </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>معدل الفهم والتقدم للمساق:</span>
                    <span className="text-slate-800 font-extrabold">{course.progress}٪</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full rounded-full" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SECTION 5: SYSTEM CONFIGURATION SETTINGS --- */}
      {activeSection === 'admin-settings' && (
        <div className="space-y-6 animate-in fade-in duration-200" id="admin-view-settings">
          <div>
            <h2 className="text-xl font-black text-slate-900">إعدادات النظام والحماية الأمنية الفائقة</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">تحديث معايير المراقبة الذكية بالكاميرا والشاشات، وصلاحيات المخالفات التلقائية.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-8 max-w-4xl">
            
            {/* Subsection 1: General Platform Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-blue-950 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Database className="h-4.5 w-4.5 text-slate-800" />
                إعدادات المنصة العامة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">اسم المنصة التعليمية:</label>
                  <input
                    type="text"
                    disabled
                    value={settings.siteName}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-bold cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">البريد الإلكتروني المعتمد للمشرف الفني:</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Subsection 2: AI Proctoring Rigorous Constraints */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-rose-950 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-600" />
                إعدادات المراقبة الذكية الذكاء الاصطناعي (Proctoring Engine)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Camera stream toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-800 block">تفعيل المراقبة الذكية بالكاميرا المباشرة</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">تحليل ملامح الوجه وحركة الرأس للطلاب</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.proctoringCameraEnabled}
                      onChange={(e) => setSettings({ ...settings, proctoringCameraEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                {/* Screen lock stream toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-800 block">تفعيل مراقبة شاشة الطالب والمحافظة على التبويب</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">تتبع الانتقال بين التبويبات والخروج القسري</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.proctoringScreenEnabled}
                      onChange={(e) => setSettings({ ...settings, proctoringScreenEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                {/* Max Violations Allowed */}
                <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <label className="text-xs font-black text-slate-800">الحد الأقصى للمخالفات السلوكية المسموحة:</label>
                    <span className="text-rose-600 text-[10px] font-bold">يتعرض الطالب للاستبعاد بعدها</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.maxViolations}
                    onChange={(e) => setSettings({ ...settings, maxViolations: parseInt(e.target.value) || 3 })}
                    className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-800 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Subsection 3: Notification Alerts triggers */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-blue-950 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Bell className="h-4.5 w-4.5 text-slate-800" />
                إعدادات الإشعارات والتقارير
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-800 block">إشعار بريدي تلقائي فور نشر النتائج</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">إرسال الدرجات للطلاب على البريد الأكاديمي</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailOnResults}
                      onChange={(e) => setSettings({ ...settings, emailOnResults: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-800 block">تنبيه فوري للمشرفين عند وجود مخالفة</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">إصدار صوتي وبصري في غرفة تحكم الأساتذة</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.alertOnViolations}
                      onChange={(e) => setSettings({ ...settings, alertOnViolations: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs py-3.5 px-8 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                id="save-settings-btn"
              >
                <Save className="h-4 w-4 text-emerald-400" />
                حفظ التكوين وإعدادات الخادم العامة
              </button>
            </div>
          </form>

          {/* Danger Zone: Reset Platform */}
          <div className="mt-8 pt-6 border-t border-rose-100 space-y-4">
            <h3 className="text-sm font-black text-rose-800 flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-rose-600" />
              منطقة الخطر: إعادة تهيئة النظام بالكامل (الاستعداد للبدء من الصفر)
            </h3>
            <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-3xl space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <span className="text-xs font-black text-rose-900 block">حذف كافة البيانات وإعادة التهيئة للبدء من الصفر</span>
                <span className="text-[10px] text-rose-700/80 font-semibold block">
                  عند تفعيل هذا الخيار، سيتم حذف جميع حسابات الطلاب، المدرسين، الفصول الدراسية النشطة، والاختبارات نهائياً من قاعدة البيانات، وسيبقى حساب المدير الرئيسي فقط لتتمكن من بناء وتجربة الدورة التعليمية من نقطة الصفر.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 px-6 rounded-xl flex items-center gap-2 transition-colors cursor-pointer self-start md:self-auto shrink-0 shadow-md hover:shadow-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                تصفير المنصة والبدء من الصفر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 6: SYSTEM LOGS --- */}
      {activeSection === 'admin-logs' && (
        <div className="space-y-6 animate-in fade-in duration-200" id="admin-view-logs">
          <div>
            <h2 className="text-xl font-black text-slate-900">سجل عمليات النظام الأمنية والفنية (System Security Logs)</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">سجل بروتوكولي متكامل لعمليات الدخول، التعديل، والتحكم الذكي بجلسات الامتحانات.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <span className="text-xs font-black text-slate-800">الرمز السري الأمني للجلسات: </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-3 py-1 rounded-full font-bold">SECURE_SSL_ACTIVE</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3.5 text-xs">
                <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">١٢:٣٥:٠٢</span>
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">طلب مصادقة ناجح لقاعة الامتحان الذكي (العدسة الافتراضية)</span>
                  <span className="text-[10px] text-slate-400 font-medium block">الموقع المرجعي: Server.ts Proxy Engine</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3.5 text-xs">
                <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">١٢:١٢:٤٤</span>
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">رصد محاولة تجاوز واجهة المراقبة المرئية</span>
                  <span className="text-[10px] text-slate-400 font-medium block">تنبيه موجه تلقائياً لغرفة عمليات الأستاذ المشرف</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3.5 text-xs">
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">١١:٠٤:١٢</span>
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">تحديث جداول الفصول الدراسية وتعديل التوافق لترم خريف ٢٠٢٦</span>
                  <span className="text-[10px] text-slate-400 font-medium block">بواسطة المشرف التقني العام</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOCK ADD TERM DIALOG / MODAL --- */}
      {showAddTermModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-base font-black text-slate-900">إضافة ترم أكاديمي جديد</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">أدخل بيانات المخطط الزمني للفصل الدراسي القادم لتشغيله.</p>
            </div>

            <form onSubmit={handleAddTerm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">اسم الترم الأكاديمي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ربيع ٢٠٢٧"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">تاريخ البداية:</label>
                  <input
                    type="date"
                    required
                    value={newTermStart}
                    onChange={(e) => setNewTermStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-850 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">تاريخ النهاية:</label>
                  <input
                    type="date"
                    required
                    value={newTermEnd}
                    onChange={(e) => setNewTermEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-850 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  حفظ الفصل الدراسي
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTermModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-3 rounded-xl transition-colors"
                >
                  إلغاء الأمر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MOCK EDIT USER DIALOG / MODAL --- */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-base font-black text-slate-900">تعديل بيانات العضو</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">تحديث الصلاحية والبريد وتصنيف رتبة الحساب الدراسي.</p>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">اسم المستخدم بالكامل:</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">رتبة العضوية:</label>
                  <select
                    value={editUserRole}
                    onChange={(e: any) => setEditUserRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-850 font-bold"
                  >
                    <option value="student">طالب</option>
                    <option value="instructor">أستاذ</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">حالة الحساب الأكاديمي:</label>
                  <select
                    value={editUserStatus}
                    onChange={(e: any) => setEditUserStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-850 font-bold"
                  >
                    <option value="active">نشط</option>
                    <option value="suspended">موقف</option>
                    <option value="pending">معلق</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-3 rounded-xl transition-colors"
                >
                  إلغاء الأمر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD NEW USER MODAL --- */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-md space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">تسجيل مستخدم جديد بالنظام الموحد</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">أدخل تفاصيل الهوية الأكاديمية والمهنية لتوليد حساب أمني مؤقت.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>

            {addStudentError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex gap-2 text-xs text-rose-600 font-semibold leading-relaxed">
                <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                <span>{addStudentError}</span>
              </div>
            )}

            {generatedTempPassword ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <div className="flex gap-2 text-xs text-emerald-800 font-bold">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>تم إنشاء الحساب الأكاديمي بنجاح!</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-100/50 space-y-2">
                  <p className="text-[10px] text-slate-400 font-semibold">بيانات الدخول الأكاديمية (قم بنسخها ومشاركتها مع المستخدم):</p>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-800">الرقم الأكاديمي: <span className="font-mono text-slate-800 select-all font-black">{newStudentId || "المسجل مسبقاً"}</span></p>
                    <p className="font-bold text-slate-800">كلمة المرور المؤقتة: <span className="font-mono text-emerald-600 select-all font-black">{generatedTempPassword}</span></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setGeneratedTempPassword(null);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                >
                  إتمام وحفظ
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddStudentSubmit} className="space-y-4">
                {/* Account Type (Role) Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">نوع الحساب الأكاديمي: *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewStudentRole('student');
                        setNewStudentId(getNextStudentId(users));
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        newStudentRole === 'student'
                          ? 'bg-slate-150 border-slate-800 text-slate-950 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      طالب منتظم
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewStudentRole('instructor');
                        setNewStudentId(`INS-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        newStudentRole === 'instructor'
                          ? 'bg-slate-150 border-slate-800 text-slate-950 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      أستاذ / مدرس
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    {newStudentRole === 'student' ? 'الرقم الأكاديمي (الرقم الجامعي): *' : 'الرقم الأكاديمي (الرقم الوظيفي للتدريس): *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newStudentRole === 'student' ? 'مثال: 202600001' : 'مثال: INS-2023-4402'}
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    {newStudentRole === 'student' ? 'الاسم الكامل للطالب: *' : 'الاسم الكامل للأستاذ/المدرس: *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newStudentRole === 'student' ? 'أدخل الاسم الرباعي للطالب' : 'أدخل الاسم الرباعي للأستاذ'}
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    {newStudentRole === 'student' ? 'التخصص الأكاديمي: *' : 'القسم أو الكلية التعليمية: *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newStudentRole === 'student' ? 'مثال: هندسة البرمجيات' : 'مثال: قسم علوم الحاسب والذكاء الاصطناعي'}
                    value={newStudentMajor}
                    onChange={(e) => setNewStudentMajor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    {newStudentRole === 'student' ? 'البريد الإلكتروني الجامعي للطالب (اختياري):' : 'البريد الإلكتروني المهني للأستاذ (اختياري):'}
                  </label>
                  <input
                    type="email"
                    placeholder={newStudentRole === 'student' ? 'student@univ.edu' : 'instructor@univ.edu'}
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-mono font-bold"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="submit"
                    disabled={newStudentLoading}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {newStudentLoading ? (
                      <span className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : null}
                    <span>تسجيل وإصدار الحساب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- RESET PLATFORM CONFIRMATION MODAL --- */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 rounded-2xl shrink-0">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">هل أنت متأكد من إعادة تهيئة المنصة بالكامل؟</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">تحذير أمني: هذا الإجراء سيقوم بتنظيف قاعدة البيانات وحذف كافة الحسابات التعليمية والطلاب للبدء من الصفر.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">ما سيحدث عند الاستمرار:</p>
              <ul className="list-disc pr-4 space-y-1 font-semibold">
                <li>سيتم حذف كافة الطلاب المسجلين والبيانات التابعة لهم.</li>
                <li>سيتم حذف كافة الأساتذة والمدرسين الذين تم تسجيلهم.</li>
                <li>سيتم حذف كافة الفصول الدراسية، المواد، والامتحانات.</li>
                <li>سيتم الحفاظ فقط على حساب المشرف العام الأكاديمي الرئيسي لتتمكن من البدء مباشرة.</li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={resetLoading}
                onClick={handleResetPlatform}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {resetLoading ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : null}
                <span>نعم، تصفير المنصة بالكامل</span>
              </button>
              <button
                type="button"
                disabled={resetLoading}
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء الأمر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
