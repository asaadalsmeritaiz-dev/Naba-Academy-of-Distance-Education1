import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextProps {
  language: Language;
  t: (key: string) => string;
  toggleLanguage: () => void;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Login
    title: "أكاديمية نبا للتعليم عن بعد",
    subtitle: "Naba Academy for Distance Education",
    academic_id: "الرقم الأكاديمي / اسم المستخدم",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    remember_me: "تذكرني",
    forgot_password: "نسيت كلمة المرور؟",
    demo_student: "دخول طالب تجريبي",
    demo_admin: "دخول مدير تجريبي",
    demo_instructor: "دخول مدرس تجريبي",
    academic_id_placeholder: "أدخل رقمك الأكاديمي",
    password_placeholder: "أدخل كلمة المرور الخاصة بك",
    login_error: "الرقم الأكاديمي أو كلمة المرور غير صحيحة",
    login_required: "يرجى إدخال الرقم الأكاديمي وكلمة المرور",
    
    // Sidebar
    dashboard: "لوحة التحكم",
    courses: "المواد الدراسية",
    ai_tutor: "المساعد الذكي (AI)",
    proctoring: "نظام المراقبة",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    
    // Header
    welcome: "مرحباً بك",
    notifications: "الإشعارات",
    no_notifications: "لا توجد إشعارات جديدة",
    profile: "الملف الشخصي",
    change_password: "تغيير كلمة المرور",
    lang_toggle: "English",
    role_student: "بوابة الطالب",
    role_admin: "بوابة المسؤول",

    // Admin Dashboard
    admin_dashboard_title: "لوحة التحكم الفنية",
    stats_students: "إجمالي الطلاب",
    stats_instructors: "إجمالي المدرسين",
    stats_courses: "إجمالي المواد",
    stats_exams: "الاختبارات النشطة",
    recent_activity: "الأنشطة الأخيرة في النظام",
    no_activities: "لا توجد أنشطة حالياً",
    breadcrumb_admin: "لوحة التحكم الفنية",
    breadcrumb_section: "القسم الحالي",

    // General Student Dashboard
    student_dashboard_title: "لوحة التحكم الأكاديمية",
    gpa: "المعدل التراكمي (GPA)",
    registered_hours: "الساعات المسجلة",
    term_gpa: "معدل الفصل الحالي",
    completed_courses: "المواد المنجزة",
    my_schedule: "جدول المحاضرات القادمة",
    ai_advisor: "المستشار الأكاديمي الذكي",
    ask_ai: "اسأل المستشار الأكاديمي عن وضعك الدراسي...",
    send: "إرسال",
    lectures_schedule: "جدول الدروس الأسبوعي",
    exam_schedule: "الاختبارات القادمة",
    no_exams: "لا توجد اختبارات مجدولة حالياً",

    // Footer
    footer_rights: "جميع الحقوق محفوظة. أكاديمية نبا للتعليم عن بعد | Naba Academy for Distance Education",
  },
  en: {
    // Login
    title: "Naba Academy for Distance Education",
    subtitle: "Distance Learning Management System",
    academic_id: "Academic ID / Username",
    password: "Password",
    login: "Sign In",
    remember_me: "Remember Me",
    forgot_password: "Forgot Password?",
    demo_student: "Demo Student Login",
    demo_admin: "Demo Admin Login",
    demo_instructor: "Demo Instructor Login",
    academic_id_placeholder: "Enter your Academic ID",
    password_placeholder: "Enter your password",
    login_error: "Invalid academic ID or password",
    login_required: "Please enter your academic ID and password",
    
    // Sidebar
    dashboard: "Dashboard",
    courses: "My Courses",
    ai_tutor: "AI Tutor",
    proctoring: "Proctoring",
    settings: "Settings",
    logout: "Logout",
    
    // Header
    welcome: "Welcome",
    notifications: "Notifications",
    no_notifications: "No new notifications",
    profile: "Profile Settings",
    change_password: "Change Password",
    lang_toggle: "العربية",
    role_student: "Student Portal",
    role_admin: "Admin Portal",

    // Admin Dashboard
    admin_dashboard_title: "Technical Admin Dashboard",
    stats_students: "Total Students",
    stats_instructors: "Total Instructors",
    stats_courses: "Total Courses",
    stats_exams: "Active Exams",
    recent_activity: "Recent System Activities",
    no_activities: "No recent activities",
    breadcrumb_admin: "Technical Dashboard",
    breadcrumb_section: "Current Section",

    // General Student Dashboard
    student_dashboard_title: "Academic Student Dashboard",
    gpa: "GPA Score",
    registered_hours: "Registered Hours",
    term_gpa: "Current Term GPA",
    completed_courses: "Completed Courses",
    my_schedule: "Upcoming Class Schedule",
    ai_advisor: "AI Academic Advisor",
    ask_ai: "Ask the academic advisor about your study status...",
    send: "Send",
    lectures_schedule: "Weekly Lecture Schedule",
    exam_schedule: "Upcoming Exams",
    no_exams: "No upcoming exams scheduled",

    // Footer
    footer_rights: "All rights reserved. Naba Academy for Distance Education",
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    // Adjust document direction and lang attribute dynamically
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['ar'][key] || key;
  };

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
