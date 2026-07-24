import { Course, Lecture, ExamQuestion, ProctorAlert } from '../types';

export const mockStudents = [];

export const mockAlerts: ProctorAlert[] = [];

export const mockQuestions: ExamQuestion[] = [];

export const mockLectures: Lecture[] = [];

export const mockCourses: Course[] = [];

export const mockUsers = [
  {
    id: 'usr-3',
    name: 'م/اسعد الشميري',
    email: 'admin@naba.edu',
    avatar: '/avatar_manager.jpg',
    role: 'admin' as const,
    major: 'إدارة تكنولوجيا التعليم',
    semester: 'مدير النظام الفني'
  }
];

export const mockExams = [];

// Mock Proctoring Data
export const mockProctoringData = {
  videoUrl: "/mock-video.mp4", // Placeholder video URL
  snapshots: [],
  violations: []
};

