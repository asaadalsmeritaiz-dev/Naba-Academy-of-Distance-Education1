export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  university_id?: string;
}

export interface AcademicTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
}

export interface SystemActivity {
  id: string;
  message: string;
  timestamp: string;
  type: 'course' | 'exam' | 'term' | 'user';
}

export interface SystemSettings {
  siteName: string;
  contactEmail: string;
  defaultLanguage: string;
  proctoringCameraEnabled: boolean;
  proctoringScreenEnabled: boolean;
  maxViolations: number;
  emailOnResults: boolean;
  alertOnViolations: boolean;
}

export const mockStats = {
  totalStudents: 0,
  totalInstructors: 0,
  totalCourses: 0,
  activeExams: 0,
};

export const mockUsers: AdminUser[] = [
  { id: 8, name: 'م/اسعد الشميري', email: 'admin@naba.edu', role: 'admin', status: 'active', joinDate: '01/01/2026', university_id: 'admin' },
];

export const mockTerms: AcademicTerm[] = [];

export const mockActivities: SystemActivity[] = [];

export const mockSettings: SystemSettings = {
  siteName: 'أكاديمية نبا للتعليم عن بعد | Naba Academy',
  contactEmail: 'admin@naba.edu',
  defaultLanguage: 'ar',
  proctoringCameraEnabled: true,
  proctoringScreenEnabled: true,
  maxViolations: 3,
  emailOnResults: true,
  alertOnViolations: true,
};
