import { Course, Exam, User, ProctorAlert } from './types';

export const mockUsers: User[] = [
  {
    id: 'usr-3',
    name: 'م/اسعد الشميري',
    email: 'admin@naba.edu',
    avatar: '/avatar_manager.jpg',
    role: 'admin',
    major: 'إدارة تكنولوجيا التعليم',
    semester: 'مدير النظام الفني'
  }
];

export const mockCourses: Course[] = [];

export const mockExams: Exam[] = [];

export const mockProctorAlerts: ProctorAlert[] = [];

// Mock Proctoring Data
export const mockProctoringData = {
  videoUrl: "/mock-video.mp4", // Placeholder video URL
  snapshots: [],
  violations: []
};
