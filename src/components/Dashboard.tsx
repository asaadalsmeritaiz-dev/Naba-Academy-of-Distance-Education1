import React from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  ChevronLeft,
  Clock,
  PlayCircle,
  ShieldAlert,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';
import { Course, Exam } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  courses: Course[];
  exams: Exam[];
  onNavigateToCourses: () => void;
  onNavigateToExams: () => void;
  onSelectCourse: (courseId: string) => void;
  studentName?: string;
  studentId?: string;
  studentMajor?: string;
}

export default function Dashboard({
  courses,
  exams,
  onNavigateToCourses,
  onNavigateToExams,
  onSelectCourse,
  studentName = "طالب جامعي",
  studentId = "",
  studentMajor = ""
}: DashboardProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="student-dashboard-root">
      {/* Dynamic Academic Greeting Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-150" id="academic-greeting-panel">
        <div className="absolute top-0 left-0 w-64 h-64 bg-slate-1000/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="relative z-10 space-y-3">
          <span className="text-[10px] bg-slate-1000/30 border border-slate-700/20 text-slate-200 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            بوابة الطالب الذكية
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            {language === 'ar' ? 'أهلاً بك مجدداً،' : 'Welcome back,'} {studentName} 👋
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-350 font-bold pt-2 border-t border-slate-800/40">
            <div>
              <span className="text-slate-400">{language === 'ar' ? 'الرقم الأكاديمي: ' : 'Academic ID: '}</span>
              <span className="font-mono text-slate-200">{studentId}</span>
            </div>
            <div>
              <span className="text-slate-400">{language === 'ar' ? 'التخصص الدراسي: ' : 'Academic Major: '}</span>
              <span className="text-slate-200">{studentMajor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Upcoming Exam Warning Banner */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-pulse" id="upcoming-exam-alert-banner">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wide block">تنبيه اختبار مجدول هام</span>
            <h4 className="text-sm font-extrabold text-slate-900">الامتحان النصفي الموحد: مقدمة في الذكاء الاصطناعي</h4>
            <p className="text-xs text-slate-500 font-medium">الامتحان مجدول غداً الساعة ١٠:٠٠ صباحاً. الرجاء مراجعة شروط المراقبة والتأكد من تفعيل الكاميرا والشاشة قبل الدخول.</p>
          </div>
        </div>
        <button
          onClick={onNavigateToExams}
          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
          id="btn-go-to-exam"
        >
          الذهاب لغرفة الامتحان الآمنة
        </button>
      </div>

      {/* KPI Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="academic-stats-grid">
        {/* GPA CARD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="stat-card-gpa">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">المعدل التراكمي (GPA)</span>
            <p className="text-2xl font-black text-slate-800">٣.٨ <span className="text-xs text-slate-400">/ ٤.٠</span></p>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full block w-max">مرتبة الشرف الثانية</span>
          </div>
        </div>

        {/* CREDIT HOURS CARD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="stat-card-hours">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">الساعات المعتمدة الكلية</span>
            <p className="text-2xl font-black text-slate-800">٤٥ <span className="text-xs text-slate-400">ساعة مسجلة</span></p>
            <span className="text-[10px] text-slate-400 block font-medium">الخطة الأكاديمية: ١٢٠ ساعة</span>
          </div>
        </div>

        {/* CURRENT SEMESTER CARD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="stat-card-semester">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">الفصل الدراسي الحالي</span>
            <p className="text-lg font-black text-slate-800">خريف ٢٠٢٦</p>
            <span className="text-[10px] text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-full block w-max">السنة الرابعة التخصصية</span>
          </div>
        </div>
      </div>

      {/* Main Content Split Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-split-content">
        {/* Left Column: Course Progress list */}
        <div className="lg:col-span-2 space-y-6" id="dashboard-left-column">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800">مقرراتي الدراسية النشطة والتقدم المستمر</h3>
            <button
              onClick={onNavigateToCourses}
              className="text-xs font-bold text-slate-800 hover:text-slate-950 flex items-center gap-1 hover:underline"
              id="view-all-courses-btn"
            >
              عرض جميع المقررات
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="courses-cards-grid">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between"
                id={`course-progress-card-${course.id}`}
              >
                <div>
                  <div className="h-32 w-full relative">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-slate-800 shadow-sm border border-slate-100">
                      {course.code}
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] text-slate-800 font-bold block">{course.category}</span>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-slate-800 transition-colors leading-relaxed">
                      {course.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">أستاذ المساق: {course.instructorName}</p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-slate-50 space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">معدل الإنجاز الحالي</span>
                      <span className="font-bold text-slate-800">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-900 h-full rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    id={`btn-continue-course-${course.id}`}
                  >
                    <PlayCircle className="h-4 w-4" />
                    متابعة المساق والدروس
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Schedule & Quick Actions */}
        <div className="space-y-6" id="dashboard-right-column">
          {/* Quick Actions Container */}
          <div className="space-y-3" id="quick-actions-section">
            <h3 className="text-base font-extrabold text-slate-800">إجراءات سريعة</h3>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm grid grid-cols-2 gap-3" id="quick-actions-grid">
              <button
                onClick={onNavigateToCourses}
                className="p-4 bg-slate-100/50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group"
                id="quick-btn-browse-courses"
              >
                <BookOpen className="h-5 w-5 text-slate-800 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-extrabold text-slate-800">تصفح المقررات</span>
              </button>
              <button
                onClick={onNavigateToExams}
                className="p-4 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group"
                id="quick-btn-view-schedule"
              >
                <ShieldAlert className="h-5 w-5 text-rose-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-extrabold text-slate-800">جدول الاختبارات</span>
              </button>
            </div>
          </div>

          <h3 className="text-base font-extrabold text-slate-800">الجدول والتذكيرات الهامة</h3>
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4" id="academic-reminders-panel">
            {/* Live session list */}
            {courses.flatMap(c => c.liveSessions).filter(s => s.isActive).map(session => (
              <div key={session.id} className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-3" id={`live-session-item-${session.id}`}>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full animate-pulse">مباشر حالياً</span>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {session.dateTime}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-relaxed">{session.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">بواسطة: {session.instructor}</p>
                </div>
                <a
                  href={session.link}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PlayCircle className="h-4 w-4" />
                  دخول الغرفة الافتراضية
                </a>
              </div>
            ))}

            {/* General upcoming item */}
            <div className="space-y-3 divide-y divide-slate-50">
              <div className="pt-1 flex justify-between items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-800 rounded-lg shrink-0 mt-0.5">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="space-y-1 text-right flex-1">
                  <span className="text-[10px] text-slate-800 font-bold block">إصدار محاضرة جديدة</span>
                  <p className="text-xs font-bold text-slate-700 leading-normal">خوارزميات تصنيف الصور والشبكات الالتفافية (CNN)</p>
                  <span className="text-[10px] text-slate-400 block font-medium">غداً، الساعة ٠٩:٠٠ صباحاً</span>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="space-y-1 text-right flex-1">
                  <span className="text-[10px] text-amber-600 font-bold block">انتهاء الموعد النهائي</span>
                  <p className="text-xs font-bold text-slate-700 leading-normal">تقديم ورقة عمل الذكاء الاصطناعي والأخلاقيات الرقمية</p>
                  <span className="text-[10px] text-slate-400 block font-medium">الخميس القادم، الساعة ١١:٥٩ مساءً</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Advisor Box */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg p-5 space-y-3 relative overflow-hidden" id="ai-advisor-container">
            <div className="absolute right-0 bottom-0 h-24 w-24 bg-gradient-to-br from-slate-1000/20 to-transparent rounded-full blur-xl"></div>
            <span className="text-[9px] bg-slate-1000/20 border border-slate-700/20 text-slate-300 font-bold px-2 py-0.5 rounded-full inline-block">
              نصائح المساعد التعليمي AI
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "أحمد، بناءً على تحليل مشاهدتك للمحاضرة الثانية لمادة الذكاء الاصطناعي، يلاحظ تكرار إيقاف تشغيل الفيديو عند الجزء الخاص بخوارزمية A*. أوصيك بسؤال روبوت الدردشة المساعد لشرح المسائل الحسابية التقديرية (Heuristics) بشكل تفصيلي."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
