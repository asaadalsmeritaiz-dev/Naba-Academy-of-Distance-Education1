import { Course, Lecture, ExamQuestion, ProctorAlert, Exam } from '../types';

export const mockUsers = [
  {
    id: 'usr-3',
    name: 'م/اسعد الشميري',
    email: 'admin@naba.edu',
    avatar: '/avatar_manager.jpg',
    role: 'admin' as const,
    major: 'إدارة تكنولوجيا التعليم',
    semester: 'مدير النظام الفني',
    university_id: 'admin'
  },
  {
    id: 'usr-2',
    name: 'د. سارة أحمد',
    email: 'sara@naba.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    role: 'instructor' as const,
    major: 'هندسة البرمجيات والذكاء الاصطناعي',
    semester: 'الفصل الدراسي الثاني - السنة الرابعة',
    university_id: 'instructor'
  },
  {
    id: 'usr-1',
    name: 'أحمد محمد عبد الله',
    email: 'ahmed@naba.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'student' as const,
    major: 'علوم الحاسب والذكاء الاصطناعي',
    semester: 'الفصل الدراسي الثاني - السنة الرابعة',
    university_id: '202600001'
  }
];

export const mockStudents = [
  {
    id: 'usr-1',
    name: 'أحمد محمد عبد الله',
    email: 'ahmed@naba.edu',
    studentId: '202600001',
    major: 'علوم الحاسب والذكاء الاصطناعي',
    progress: 60,
    gpa: 3.8
  },
  {
    id: 'usr-4',
    name: 'خالد عمر صالح',
    email: 'khaled@naba.edu',
    studentId: '202600002',
    major: 'علوم الحاسب والذكاء الاصطناعي',
    progress: 45,
    gpa: 3.2
  },
  {
    id: 'usr-5',
    name: 'فاطمة علي سعيد',
    email: 'fatima@naba.edu',
    studentId: '202600003',
    major: 'علوم الحاسب والذكاء الاصطناعي',
    progress: 80,
    gpa: 3.9
  }
];

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    code: 'CS401',
    title: 'مقدمة في الذكاء الاصطناعي',
    instructorName: 'د. سارة أحمد',
    progress: 60,
    image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=400&auto=format&fit=crop&q=60',
    category: 'علوم الحاسوب',
    description: 'دراسة المفاهيم الأساسية للذكاء الاصطناعي وخوارزميات البحث وتطبيقات الشبكات العصبية والتعلم الآلي.',
    lectures: [
      {
        id: 'lec-1-1',
        courseId: 'course-1',
        title: 'المحاضرة الأولى: مقدمة وتعريف بالذكاء الاصطناعي',
        description: 'التعريف بالمفاهيم الأساسية، اختبار تورينج، وتاريخ تطور الذكاء الاصطناعي.',
        duration: '45:00',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        transcript: 'مرحباً بكم يا شباب في المحاضرة الأولى من مساق الذكاء الاصطناعي. اليوم سنتحدث عن الذكاء الاصطناعي وتاريخه. الذكاء الاصطناعي هو فرع من علوم الحاسوب يهدف إلى خلق أنظمة قادرة على محاكاة الذكاء البشري مثل التفكير والتعلم وحل المشكلات. اختبار تورينج هو اختبار شهير وضعه آلان تورينج في عام 1950 لتقييم قدرة الآلة على إظهار سلوك ذكي لا يمكن تمييزه عن سلوك الإنسان.',
        summary: '',
        isCompleted: true
      },
      {
        id: 'lec-1-2',
        courseId: 'course-1',
        title: 'المحاضرة الثانية: خوارزميات البحث الأعمى والبحث الموجه',
        description: 'دراسة خوارزميات البحث مثل Breadth-First Search و Depth-First Search والبحث الكفء A*.',
        duration: '55:00',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        transcript: 'في هذه المحاضرة سنتطرق إلى خوارزميات البحث في الذكاء الاصطناعي. عندما نواجه مشكلة مثل إيجاد أقصر طريق في خريطة، نحتاج إلى استراتيجيات بحث. خوارزميات البحث الأعمى مثل البحث بعرض أولاً والبحث بعمق أولاً لا تمتلك معلومات عن المسافة المتبقية للهدف. أما خوارزميات البحث الموجه مثل خوارزمية A* فإنها تستخدم دالة الكشف الإرشادية لتقدير التكلفة وتوفير الوقت والجهد للوصول للحل الأمثل.',
        summary: '',
        isCompleted: false
      }
    ],
    liveSessions: [
      {
        id: 'live-1-1',
        courseId: 'course-1',
        title: 'جلسة مناقشة وتطبيقات عملية حول خوارزميات البحث الموجه',
        instructor: 'د. سارة أحمد',
        dateTime: '2026-08-02T10:00:00.000Z',
        link: 'https://meet.google.com/abc-defg-hij',
        isActive: true
      }
    ]
  },
  {
    id: 'course-2',
    code: 'SE402',
    title: 'هندسة البرمجيات المتقدمة',
    instructorName: 'م/اسعد الشميري',
    progress: 35,
    image: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=400&auto=format&fit=crop&q=60',
    category: 'هندسة البرمجيات',
    description: 'شرح أنماط التصميم المعمارية، هندسة المتطلبات، والمنهجيات الرشيقة (Agile Scrum).',
    lectures: [
      {
        id: 'lec-2-1',
        courseId: 'course-2',
        title: 'المحاضرة الأولى: المنهجيات الرشيقة وسكروم',
        description: 'فهم قيم المانيفستو الرشيق، وتطبيق إطار العمل سكروم في المشاريع البرمجية.',
        duration: '50:00',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        transcript: 'أهلاً بكم في مقرر هندسة البرمجيات المتقدمة. اليوم سنناقش المنهجيات الرشيقة أو ما يُعرف بـ Agile. في المشاريع البرمجية الحديثة، نبتعد عن النموذج الشلالي التقليدي ونتجه نحو دورات تطوير قصيرة ومرنة. إطار العمل سكروم يعتمد على فترات عمل تسمى Sprints تمتد عادة من أسبوعين إلى أربعة أسابيع، ويتميز بوجود أدوار واضحة مثل مدير المنتج وسكروم ماستر وفريق التطوير لضمان التسليم المستمر بجودة عالية.',
        summary: '',
        isCompleted: true
      }
    ],
    liveSessions: []
  }
];

export const mockExams: Exam[] = [
  {
    id: 'exam-1',
    courseId: 'course-1',
    courseTitle: 'مقدمة في الذكاء الاصطناعي',
    title: 'الاختبار النصفي الموحد للذكاء الاصطناعي',
    durationMinutes: 30,
    totalPoints: 12,
    questions: [
      {
        id: 'gq1',
        type: 'mcq',
        text: 'ما هو الاختبار الشهير المستخدم لتقييم قدرة الآلة على محاكاة السلوك البشري الذكي؟',
        options: ['اختبار تورينج', 'اختبار بيل', 'اختبار آينشتاين', 'اختبار تسلا'],
        correctAnswer: 'اختبار تورينج',
        points: 5
      },
      {
        id: 'gq2',
        type: 'boolean',
        text: 'خوارزمية البحث الموجه A* تعتمد حصرياً على البحث الأعمى بدون استخدام دالة الكشف الإرشادية.',
        options: ['صحيح', 'خطأ'],
        correctAnswer: 'خطأ',
        points: 3
      },
      {
        id: 'gq3',
        type: 'short',
        text: 'اشرح باختصار مفهوم الذكاء الاصطناعي واذكر اثنين من تطبيقاته في الحياة اليومية.',
        correctAnswer: 'الذكاء الاصطناعي هو قدرة الأنظمة الرقمية على محاكاة الذكاء البشري مثل التعلم وحل المشكلات. تطبيقاته تشمل: المساعدين الصوتيين (مثل Siri)، وأنظمة التوصية في منصات البث والتسوق الإلكتروني.',
        points: 4
      }
    ]
  }
];

export const mockAlerts: ProctorAlert[] = [
  {
    id: 'alert-1',
    timestamp: '10:12',
    type: 'tab_switch',
    severity: 'medium',
    studentName: 'أحمد محمد عبد الله',
    message: 'قام الطالب بالتبديل إلى نافذة متصفح أخرى.'
  },
  {
    id: 'alert-2',
    timestamp: '10:15',
    type: 'multiple_faces',
    severity: 'high',
    studentName: 'خالد عمر صالح',
    message: 'تم رصد أكثر من وجه واحد أمام الكاميرا.'
  },
  {
    id: 'alert-3',
    timestamp: '10:20',
    type: 'no_face',
    severity: 'high',
    studentName: 'أحمد محمد عبد الله',
    message: 'وجه الطالب غير ظاهر أمام الكاميرا.'
  },
  {
    id: 'alert-4',
    timestamp: '10:22',
    type: 'audio_anomaly',
    severity: 'low',
    studentName: 'فاطمة علي سعيد',
    message: 'تم رصد ضوضاء غير طبيعية في الخلفية.'
  }
];

export const mockQuestions: ExamQuestion[] = [];
export const mockLectures: Lecture[] = [];

// Mock Proctoring Data
export const mockProctoringData = {
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  snapshots: [
    { timestamp: '10:12', url: 'snap1', description: 'تنبيه: تبديل التبويب النشط' },
    { timestamp: '10:15', url: 'snap2', description: 'تنبيه: وجود شخص آخر في الإطار' },
    { timestamp: '10:20', url: 'snap3', description: 'تنبيه: عدم وجود وجه أمام الكاميرا' }
  ],
  violations: [
    { timestamp: '10:12', time: '10:12', type: 'tab_switch', severity: 'medium', details: 'تبديل التبويب النشط' },
    { timestamp: '10:15', time: '10:15', type: 'multiple_faces', severity: 'high', details: 'وجود شخص آخر في الإطار' },
    { timestamp: '10:20', time: '10:20', type: 'no_face', severity: 'high', details: 'عدم وجود وجه أمام الكاميرا' }
  ]
};
