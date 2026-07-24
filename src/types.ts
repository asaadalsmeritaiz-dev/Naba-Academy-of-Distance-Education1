export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  major: string;
  semester: string;
  studentId?: string;
}

export interface Lecture {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  transcript: string;
  summary: string;
  isCompleted?: boolean;
}

export interface LiveSession {
  id: string;
  courseId: string;
  title: string;
  instructor: string;
  dateTime: string;
  link: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  instructorName: string;
  progress: number;
  image: string;
  category: string;
  description: string;
  lectures: Lecture[];
  liveSessions: LiveSession[];
}

export interface ExamQuestion {
  id: string;
  type: 'mcq' | 'boolean' | 'short';
  text: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface Exam {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  durationMinutes: number;
  totalPoints: number;
  questions: ExamQuestion[];
}

export interface ProctorAlert {
  id: string;
  timestamp: string;
  type: 'tab_switch' | 'multiple_faces' | 'no_face' | 'audio_anomaly' | 'right_click' | 'forbidden_copy' | 'forbidden_paste' | 'forbidden_keys';
  severity: 'low' | 'medium' | 'high';
  studentName: string;
  message: string;
}
