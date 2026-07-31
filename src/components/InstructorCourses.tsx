import React, { useState } from 'react';
import { 
  BookOpen, 
  PlusCircle, 
  Video, 
  Clock, 
  FileText, 
  PlayCircle, 
  ChevronRight, 
  Sparkles, 
  AlertCircle,
  FolderPlus
} from 'lucide-react';
import { Course, Lecture } from '../types';

interface InstructorCoursesProps {
  courses: Course[];
  onAddLecture: (courseId: string, lecture: Lecture) => void;
  onAddCourse: (course: Course) => void;
  instructorName: string;
}

export default function InstructorCourses({ 
  courses, 
  onAddLecture, 
  onAddCourse,
  instructorName 
}: InstructorCoursesProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  // New Lecture Form State
  const [newLecTitle, setNewLecTitle] = useState('');
  const [newLecDesc, setNewLecDesc] = useState('');
  const [newLecDuration, setNewLecDuration] = useState('');
  const [newLecVideoUrl, setNewLecVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
  const [newLecTranscript, setNewLecTranscript] = useState('');

  // New Course Form State
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('علوم الحاسوب');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseImage, setNewCourseImage] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400');

  const instructorCourses = courses.filter(c => c.instructorName === instructorName || c.instructorName === 'د. سارة أحمد');

  const handleAddLectureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newLecTitle || !newLecDuration) return;

    const newLecture: Lecture = {
      id: `lec-${Date.now()}`,
      courseId: selectedCourse.id,
      title: newLecTitle,
      description: newLecDesc,
      duration: newLecDuration,
      videoUrl: newLecVideoUrl,
      transcript: newLecTranscript || 'لم يتم إدخال تفريغ نصي لهذه المحاضرة.',
      summary: '',
      isCompleted: false
    };

    onAddLecture(selectedCourse.id, newLecture);
    
    // Refresh selected course view in-state
    setSelectedCourse(prev => {
      if (!prev) return null;
      return {
        ...prev,
        lectures: [...prev.lectures, newLecture]
      };
    });

    // Reset Form
    setNewLecTitle('');
    setNewLecDesc('');
    setNewLecDuration('');
    setNewLecVideoUrl('https://www.w3schools.com/html/mov_bbb.mp4');
    setNewLecTranscript('');
    setShowAddLectureModal(false);
  };

  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode || !newCourseTitle || !newCourseDesc) return;

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      code: newCourseCode,
      title: newCourseTitle,
      instructorName: instructorName,
      progress: 0,
      image: newCourseImage,
      category: newCourseCategory,
      description: newCourseDesc,
      lectures: [],
      liveSessions: []
    };

    onAddCourse(newCourse);

    // Reset Form
    setNewCourseCode('');
    setNewCourseTitle('');
    setNewCourseDesc('');
    setNewCourseImage('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400');
    setShowAddCourseModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="instructor-courses-view">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">إدارة المساقات التعليمية</h2>
          <p className="text-xs text-slate-500 font-medium">عرض وإدارة المواد الدراسية ورفع المحاضرات المرئية للطلاب.</p>
        </div>
        <button
          onClick={() => setShowAddCourseModal(true)}
          className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <FolderPlus className="h-4 w-4" />
          إنشاء مساق دراسي جديد
        </button>
      </div>

      {selectedCourse ? (
        // Detailed Course View
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
            العودة لقائمة المساقات
          </button>

          {/* Course Hero Card */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="md:w-1/3 relative h-48 md:h-auto">
              <img 
                src={selectedCourse.image} 
                alt={selectedCourse.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <span className="absolute bottom-4 right-4 bg-slate-900/90 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedCourse.code}
              </span>
            </div>
            <div className="p-6 md:w-2/3 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] bg-slate-100 text-slate-800 font-extrabold px-2.5 py-1 rounded-md">
                  {selectedCourse.category}
                </span>
                <h3 className="text-lg font-black text-slate-800">{selectedCourse.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{selectedCourse.description}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="text-xs text-slate-400 font-semibold">
                  عدد المحاضرات المرفوعة: <span className="text-slate-800 font-extrabold">{selectedCourse.lectures.length}</span>
                </div>
                <button
                  onClick={() => setShowAddLectureModal(true)}
                  className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  إضافة محاضرة جديدة
                </button>
              </div>
            </div>
          </div>

          {/* Lectures List */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-800 px-1">المحاضرات الدراسية الحالية</h4>
            {selectedCourse.lectures.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl space-y-3">
                <Video className="h-8 w-8 text-slate-300 mx-auto animate-pulse" />
                <h5 className="font-extrabold text-slate-700 text-xs">لا توجد محاضرات مرفوعة بعد</h5>
                <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">ابدأ بإضافة محاضرات مرئية لتمكين الطلاب من دراستها والاستعانة بالذكاء الاصطناعي لتلخيصها.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {selectedCourse.lectures.map((lec, idx) => (
                  <div 
                    key={lec.id}
                    className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md hover:border-slate-200/80 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-50 text-slate-700 rounded-xl shrink-0">
                        <PlayCircle className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-extrabold text-slate-900">
                          {idx + 1}. {lec.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium max-w-xl">
                          {lec.description}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lec.duration} دقيقة
                          </span>
                          {lec.transcript && (
                            <span className="text-[9px] bg-slate-50 text-slate-600 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              مرفق تفريغ نصي
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Courses List Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructorCourses.map((course) => (
            <div 
              key={course.id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44">
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <span className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-md">
                    {course.code}
                  </span>
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-[9px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-md">
                    {course.category}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 line-clamp-1">{course.title}</h3>
                  <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">
                  محاضرات: <span className="font-extrabold text-slate-800">{course.lectures.length}</span>
                </span>
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="text-xs font-extrabold text-slate-900 hover:text-slate-700 transition-colors flex items-center gap-1"
                >
                  إدارة المحاضرات
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Lecture Modal */}
      {showAddLectureModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">إضافة محاضرة جديدة لمساق: {selectedCourse.title}</h3>
              <button 
                onClick={() => setShowAddLectureModal(false)}
                className="text-slate-400 hover:text-slate-800 font-extrabold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddLectureSubmit} className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">عنوان المحاضرة *</label>
                <input 
                  type="text" 
                  value={newLecTitle}
                  onChange={(e) => setNewLecTitle(e.target.value)}
                  placeholder="مثال: المحاضرة الثالثة: مقدمة في التعلم العميق"
                  required
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">المدة الزمنية (بالدقائق) *</label>
                  <input 
                    type="text" 
                    value={newLecDuration}
                    onChange={(e) => setNewLecDuration(e.target.value)}
                    placeholder="مثال: 50:00"
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">رابط الفيديو (MP4) *</label>
                  <input 
                    type="text" 
                    value={newLecVideoUrl}
                    onChange={(e) => setNewLecVideoUrl(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">وصف مختصر للمحاضرة</label>
                <textarea 
                  value={newLecDesc}
                  onChange={(e) => setNewLecDesc(e.target.value)}
                  placeholder="اكتب وصفاً موجزاً عما سيتم تغطيته في هذه المحاضرة..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block flex items-center gap-1">
                  تفريغ المحاضرة النصي (Transcript) 
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-0.5">
                    <Sparkles className="h-3 w-3 text-slate-650" />
                    مهم لملخصات الذكاء الاصطناعي
                  </span>
                </label>
                <textarea 
                  value={newLecTranscript}
                  onChange={(e) => setNewLecTranscript(e.target.value)}
                  placeholder="الصق تفريغ المحاضرة النصي هنا ليقوم الذكاء الاصطناعي بالتلخيص الأكاديمي والرد على الطلاب..."
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddLectureModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 font-bold text-xs px-5 py-3 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm"
                >
                  حفظ المحاضرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">إنشاء مساق دراسي جديد</h3>
              <button 
                onClick={() => setShowAddCourseModal(false)}
                className="text-slate-400 hover:text-slate-800 font-extrabold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddCourseSubmit} className="space-y-4 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">رمز المساق الأكاديمي *</label>
                  <input 
                    type="text" 
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="مثال: CS402"
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">عنوان المساق *</label>
                  <input 
                    type="text" 
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="مثال: هندسة البرمجيات المتقدمة"
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">الفئة / التخصص</label>
                  <select 
                    value={newCourseCategory}
                    onChange={(e) => setNewCourseCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50"
                  >
                    <option value="علوم الحاسوب">علوم الحاسوب</option>
                    <option value="هندسة البرمجيات">هندسة البرمجيات</option>
                    <option value="تكنولوجيا التعليم">تكنولوجيا التعليم</option>
                    <option value="الذكاء الاصطناعي">الذكاء الاصطناعي</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">رابط الصورة المصغرة</label>
                  <input 
                    type="text" 
                    value={newCourseImage}
                    onChange={(e) => setNewCourseImage(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">توصيف المساق بالتفصيل *</label>
                <textarea 
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="اكتب تفاصيل المساق، والمهارات التي سيكتسبها الطلاب..."
                  rows={3}
                  required
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-slate-800 bg-slate-50/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 font-bold text-xs px-5 py-3 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm"
                >
                  إنشاء المساق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
