import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import CoursesView from './components/CoursesView';
import ExamView from './components/ExamView';
import ProctorDashboard from './components/ProctorDashboard';
import AiTutorView from './components/AiTutorView';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';
import ProfileView from './components/ProfileView';
import InstructorCourses from './components/InstructorCourses';
import StudentAnalytics from './components/StudentAnalytics';

import { mockUsers, mockCourses, mockExams } from './data/mock';
import { Course, User, Exam, Lecture } from './types';

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<any | null>(null);
  const [currentRole, setCurrentRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Localized states to support progress modifications or notifications
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [notificationsCount, setNotificationsCount] = useState(3);

  const handleAddLecture = (courseId: string, lecture: Lecture) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          lectures: [...course.lectures, lecture]
        };
      }
      return course;
    }));
  };

  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [...prev, newCourse]);
  };

  // Auto-restore JWT session from httpOnly cookie on startup
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(resData => {
        if (resData.success && resData.data) {
          const u = resData.data;
          setAuthenticatedUser({
            id: u.id,
            name: u.full_name || u.name,
            role: u.role,
            university_id: u.student_id || u.university_id,
            email: u.email,
            is_first_login: u.is_first_login
          });
          setCurrentRole(u.role);
          // Auto route based on role
          if (u.role === 'student') {
            setActiveTab('dashboard');
          } else if (u.role === 'instructor') {
            setActiveTab('proctor-dashboard');
          } else {
            setActiveTab('admin-dashboard');
          }
        }
      })
      .catch(() => {
        // Safe to ignore in case of no cookie / first visit
      });
  }, []);
  
  const currentUser: User = authenticatedUser ? {
    id: authenticatedUser.id,
    name: authenticatedUser.name,
    email: authenticatedUser.email || `${authenticatedUser.university_id}@ust.edu`,
    avatar: authenticatedUser.role === 'student'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      : authenticatedUser.role === 'instructor'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
        : '/avatar_manager.jpg',
    role: authenticatedUser.role,
    major: authenticatedUser.major || (authenticatedUser.role === 'student' ? 'علوم الحاسب والذكاء الاصطناعي' : 'إدارة تكنولوجيا التعليم'),
    semester: authenticatedUser.role === 'student' ? 'الفصل الدراسي الثاني - السنة الرابعة' : 'مدير النظام الفني',
    studentId: authenticatedUser.university_id
  } : mockUsers[0];

  const handleRoleChange = (role: 'student' | 'instructor' | 'admin') => {
    // Security Guard: Prevent unauthorized role switching
    if (role === 'admin' && currentUser.role !== 'admin') {
      return;
    }
    if (role === 'instructor' && currentUser.role === 'student') {
      return;
    }

    setCurrentRole(role);
    setSelectedCourseId(null);
    if (role === 'student') {
      setActiveTab('dashboard');
    } else if (role === 'instructor') {
      setActiveTab('proctor-dashboard');
    } else {
      setActiveTab('admin-dashboard');
    }
  };

  const handleSelectCourse = (courseId: string | null) => {
    setSelectedCourseId(courseId);
    if (courseId) {
      setActiveTab('courses');
    }
  };

  const handleExamSubmitted = (score: number, answers: Record<string, string>, warnings: string[]) => {
    console.log('Exam completed!', { score, answers, warnings });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout request failed', e);
    }
    setAuthenticatedUser(null);
  };

  // If no active session, render the localized university login view
  if (!authenticatedUser) {
    return <Login onLoginSuccess={(user) => {
      setAuthenticatedUser(user);
      setCurrentRole(user.role);
      if (user.role === 'student') {
        setActiveTab('dashboard');
      } else if (user.role === 'instructor') {
        setActiveTab('proctor-dashboard');
      } else {
        setActiveTab('admin-dashboard');
      }
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-slate-100 selection:text-slate-900" id="app-root-container">
      {/* Platform Header */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenNotifications={() => setNotificationsCount(0)}
        onLogout={handleLogout}
      />

      {/* Main Structural Layout Grid */}
      <div className="flex flex-1 items-stretch">
        
        {/* Navigation Sidebar Drawer */}
        <Sidebar
          currentUser={currentUser}
          currentRole={currentRole}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'courses') {
              setSelectedCourseId(null);
            }
          }}
        />

        {/* Content Area and Frame */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col justify-between min-h-[calc(100vh-77px)]">
          
          <div className="flex-1 pb-8">
            {/* Student Portal Navigation Routing */}
            {currentRole === 'student' && (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard
                    courses={courses}
                    exams={exams}
                    onNavigateToCourses={() => setActiveTab('courses')}
                    onNavigateToExams={() => setActiveTab('exams')}
                    onSelectCourse={handleSelectCourse}
                    studentName={currentUser.name}
                    studentId={currentUser.studentId}
                    studentMajor={currentUser.major}
                  />
                )}
                {activeTab === 'courses' && (
                  <CoursesView
                    courses={courses}
                    selectedCourseId={selectedCourseId}
                    onSelectCourse={handleSelectCourse}
                  />
                )}
                {activeTab === 'exams' && (
                  <ExamView
                    exams={exams}
                    onExamSubmitted={handleExamSubmitted}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'ai-tutor' && (
                  <AiTutorView />
                )}
              </>
            )}

            {/* Instructor Portal Navigation Routing */}
            {currentRole === 'instructor' && (currentUser.role === 'instructor' || currentUser.role === 'admin') && (
              <>
                {activeTab === 'proctor-dashboard' && (
                  <ProctorDashboard mode="proctor" />
                )}
                
                {activeTab === 'ai-generator' && (
                  <ProctorDashboard mode="generator" />
                )}

                {activeTab === 'courses-instructor' && (
                  <InstructorCourses 
                    courses={courses}
                    onAddLecture={handleAddLecture}
                    onAddCourse={handleAddCourse}
                    instructorName={currentUser.name}
                  />
                )}
                
                {activeTab === 'student-analytics' && (
                  <StudentAnalytics />
                )}
              </>
            )}

            {/* Admin Portal Navigation Routing */}
            {currentRole === 'admin' && currentUser.role === 'admin' && activeTab !== 'profile' && (
              <AdminDashboard 
                activeSection={activeTab} 
                setActiveSection={setActiveTab}
                globalCourses={courses}
              />
            )}

            {/* Profile view for all roles */}
            {activeTab === 'profile' && (
              <ProfileView currentUser={currentUser} currentRole={currentRole} />
            )}
          </div>

          {/* Platform Footer */}
          <Footer />
        </main>
      </div>

      {/* Force Change Password Modal if it's First Login */}
      {authenticatedUser.is_first_login && (
        <ChangePasswordModal
          universityId={authenticatedUser.university_id}
          onSuccess={handleLogout}
        />
      )}
    </div>
  );
}

