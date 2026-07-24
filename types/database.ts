// ==========================================
// Database TypeScript Interfaces (Supabase Tables Schema)
// Matching /supabase-schema.sql
// ==========================================

export type UserRole = 'student' | 'instructor' | 'admin';
export type QuestionType = 'mcq' | 'true_false' | 'essay';

export interface DbUser {
  id: string; // references auth.users.id
  full_name: string;
  student_id: string | null; // university student ID
  major: string | null;
  role: UserRole;
  avatar_url: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface DbTerm {
  id: string;
  name: string; // e.g. "Fall 2026", "Spring 2026"
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCourse {
  id: string;
  term_id: string; // references DbTerm.id
  instructor_id: string; // references DbUser.id
  title: string;
  description: string;
  credit_hours: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbLecture {
  id: string;
  course_id: string; // references DbCourse.id
  title: string;
  video_url: string; // stored in lecture-videos bucket
  transcript: string | null; // for AI processing
  duration: number; // in seconds
  order: number;
  created_at: string;
  updated_at: string;
}

export interface DbEnrollment {
  id: string;
  student_id: string; // references DbUser.id
  course_id: string; // references DbCourse.id
  progress: number; // default 0 percentage
  enrolled_at: string;
  grade: string | null; // e.g. "A", "B+", etc.
  created_at: string;
  updated_at: string;
}

export interface DbExam {
  id: string;
  course_id: string; // references DbCourse.id
  title: string;
  instructions: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  requires_proctoring: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbQuestion {
  id: string;
  exam_id: string; // references DbExam.id
  type: QuestionType;
  question_text: string;
  options: string[] | null; // e.g., ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"]
  correct_answer: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface DbExamAttempt {
  id: string;
  student_id: string; // references DbUser.id
  exam_id: string; // references DbExam.id
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  proctoring_video_url: string | null; // stored in proctoring-recordings bucket
  proctoring_notes: DbProctoringNote[] | null; // AI violation logs
  created_at: string;
  updated_at: string;
}

export interface DbProctoringNote {
  timestamp: string;
  type: 'tab_switch' | 'multiple_faces' | 'no_face' | 'audio_anomaly' | 'right_click';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface DbForumPost {
  id: string;
  course_id: string; // references DbCourse.id
  student_id: string; // references DbUser.id
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DbForumReply {
  id: string;
  post_id: string; // references DbForumPost.id
  student_id: string; // references DbUser.id
  content: string;
  created_at: string;
  updated_at: string;
}
