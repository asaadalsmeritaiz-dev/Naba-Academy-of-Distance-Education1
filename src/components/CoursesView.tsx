import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  PlayCircle,
  FileText,
  BrainCircuit,
  MessageSquare,
  Sparkles,
  ChevronRight,
  CheckCircle,
  Loader2,
  Send,
  User,
  ArrowRight
} from 'lucide-react';
import { Course, Lecture } from '../types';

interface CoursesViewProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string | null) => void;
  onUpdateLectureProgress?: (courseId: string, lectureId: string, completed: boolean) => void;
}

export default function CoursesView({
  courses,
  selectedCourseId,
  onSelectCourse,
  onUpdateLectureProgress
}: CoursesViewProps) {
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'video' | 'transcript' | 'summary'>('video');
  const [summaryText, setSummaryText] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || null;

  // Reset lecture when changing courses
  useEffect(() => {
    if (activeCourse && activeCourse.lectures.length > 0) {
      setSelectedLecture(activeCourse.lectures[0]);
      setSummaryText('');
      setChatMessages([
        {
          sender: 'ai',
          text: `مرحباً بك! أنا المرشد الدراسي الذكي لمساق "${activeCourse.title}". يمكنك سؤالي عن أي شيء يخص هذه المحاضرة والرمز البرمجي والنقاط الصعبة.`
        }
      ]);
    } else {
      setSelectedLecture(null);
    }
  }, [selectedCourseId]);

  // Set chat greeting when lecture changes
  useEffect(() => {
    if (selectedLecture) {
      setSummaryText(selectedLecture.summary || '');
      setChatMessages([
        {
          sender: 'ai',
          text: `مرحباً بك! أنا المرشد الدراسي الذكي. أنت تشاهد حالياً "${selectedLecture.title}". كيف يمكنني مساعدتك في فهم هذا الدرس اليوم؟`
        }
      ]);
    }
  }, [selectedLecture]);

  // Mock server or native API call to summarize using Gemini API
  const handleGenerateSummary = async () => {
    if (!selectedLecture) return;
    setIsGeneratingSummary(true);
    setSummaryText('');

    try {
      // Call local backend endpoint which proxies to Google Gemini API
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: selectedLecture.title,
          transcript: selectedLecture.transcript
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSummaryText(data.summary);
      } else {
        // Fallback to beautiful mock AI response if backend isn't ready
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSummaryText(
          `### الملخص المتقدم بواسطة ذكاء أكاديمية نبا:\n\n` +
          `**١. الأفكار المحورية الرئيسية:**\n` +
          `* ${selectedLecture.title} تتناول بالتحليل البنى الأساسية وحالات الاستخدام.\n` +
          `* تركز المادة على تمكين الفهم العميق وتطبيق المعايير المثلى.\n\n` +
          `**٢. الهيكل الشامل والشروحات:**\n` +
          `* **تفكيك المشكلة:** يتم تقسيم الأنظمة لتمثيل العناصر بشكل تفاعلي.\n` +
          `* **البعد التقني:** معالجة البيانات بأقصر المسارات الرياضية الممكنة.\n\n` +
          `**٣. دليل المذاكرة السريعة للامتحان:**\n` +
          `* ركز جيداً على اختبارات قياس الكفاءة والنماذج المطروحة في آخر الفصل.\n` +
          `* احرص على مراجعة دالة الكفاءة وطرق تقييم السرعة الاستيعابية.`
        );
      }
    } catch (err) {
      // Fallback
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSummaryText(
        `### ملخص ذكي تفصيلي:\n\n` +
        `• **المفهوم الرئيسي:** تم التطرق لتعريفات هامة تتعلق بمساق ${activeCourse?.title}.\n` +
        `• **النقاط التقنية:** معالجة الإشارات وتحليل المدخلات والوصول إلى أقصى كفاءة لآلية اتخاذ القرار.\n` +
        `• **توجيهات المحاضر:** تكرر هذا المفهوم في امتحانات السنوات السابقة، يرجى حفظ الفروق الأساسية.`
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedLecture) return;

    const userMsg = userInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setUserInput('');
    setIsAiResponding(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: selectedLecture.title,
          transcript: selectedLecture.transcript,
          message: userMsg
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        throw new Error('Fallback');
      }
    } catch (err) {
      // Premium Mock AI answers in Arabic based on course topic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      let reply = 'سؤال رائع جداً! ';
      if (userMsg.includes('كيف') || userMsg.includes('ماذا') || userMsg.includes('شرح')) {
        reply += `بالإشارة إلى ما تم شرحه في المحاضرة حول "${selectedLecture.title}"، فإن هذا المفهوم يعتمد بشكل أساسي على تفكيك المدخلات وتغذية نموذج اتخاذ القرار بها. هل ترغب في أن أقوم بصياغة مثال برمجي بلغة Python يوضح الخطوات العملية لبنائه خطوة بخطوة؟`;
      } else if (userMsg.includes('امتحان') || userMsg.includes('سؤال')) {
        reply += `بالنسبة للامتحان النصفي، تأكد من فهم الأسئلة النظرية حول الفروق الجوهرية التي ذكرتها د. سارة في بداية المحاضرة، وخاصة الجداول المقارنة. سأقترح عليك مراجعتها بعناية.`;
      } else {
        reply += `من وجهة نظر أكاديمية، يمثل موضوع "${selectedLecture.title}" حجر الأساس للمواضيع القادمة. أنصحك بالتركيز على حفظ المصطلحات الإنجليزية المرادفة لأنها ستدرج في أسئلة الاختيار من متعدد في الامتحان النهائي.`;
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } finally {
      setIsAiResponding(false);
    }
  };

  // If no course is selected, show list of courses
  if (!activeCourse) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300" id="courses-list-view">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-slate-800">مقرراتك الجامعية للفصل الدراسي الحالي</h2>
          <p className="text-slate-500 text-sm font-medium">اختر مساقاً لمتابعة المحاضرات المسجلة وحلقات النقاش التفاعلية.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="h-44 w-full relative">
                  <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 px-3 py-1 rounded-xl text-xs font-black text-slate-900 shadow-sm">
                    {course.code}
                  </span>
                  <div className="absolute bottom-4 right-4 text-white">
                    <span className="text-[10px] uppercase font-bold tracking-wide text-slate-200">{course.category}</span>
                    <h3 className="font-extrabold text-sm mt-0.5">{course.title}</h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <User className="h-4 w-4 text-slate-900" />
                    <span>المحاضر: {course.instructorName}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-50 space-y-4 bg-slate-50/50">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">نسبة الإنجاز</span>
                    <span className="text-slate-800 font-extrabold">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => onSelectCourse(course.id)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <PlayCircle className="h-4.5 w-4.5" />
                  دخول المساق والدروس ({course.lectures.length} دروس)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Course lecture player and details
  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="course-detail-view">
      {/* Course Title Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="course-header-banner">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectCourse(null)}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="رجوع للمقررات"
            id="back-to-courses-btn"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] bg-slate-100 text-slate-900 font-black px-2.5 py-0.5 rounded-lg border border-slate-200">{activeCourse.code}</span>
              <span className="text-xs text-slate-400 font-bold">{activeCourse.category}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2.5 py-0.5 rounded-lg border border-slate-200">٣ ساعات معتمدة</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mt-1">{activeCourse.title}</h2>
            <p className="text-xs text-slate-500 font-medium">بإشراف المحاضر الأكاديمي: {activeCourse.instructorName}</p>
          </div>
        </div>
        <div className="text-right text-xs space-y-1">
          <div className="text-slate-400 font-bold">معدل التقدم العام في المنهج</div>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-slate-900 h-full rounded-full" style={{ width: `${activeCourse.progress}%` }} />
            </div>
            <span className="text-slate-800 font-extrabold">{activeCourse.progress}%</span>
          </div>
        </div>
      </div>

      {/* Main Study Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playback & Summarization Left Panels */}
        <div className="lg:col-span-2 space-y-6">
          {selectedLecture ? (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                {/* Custom Highly-Styled Mock Video Player Placeholder */}
                <div className="aspect-video w-full bg-slate-950 relative group flex flex-col items-center justify-center p-8 overflow-hidden select-none" id="mock-lecture-video-player">
                  <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent" />
                  
                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-bold text-white flex items-center gap-2 z-10">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    تسجيل بجودة عالية HD • غير متزامن
                  </div>
                  <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-extrabold text-white z-10">
                    رقم الدرس: {selectedLecture.id.replace('l-', '٠')}
                  </div>

                  {/* Pulsing Play Button Interface */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer group-hover:scale-105 transition-transform duration-300">
                    <div className="p-5 bg-white/10 group-hover:bg-slate-900 border border-white/20 rounded-full text-white shadow-2xl transition-all duration-300">
                      <PlayCircle className="h-14 w-14" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{selectedLecture.title}</h4>
                      <p className="text-[11px] text-slate-300 font-medium">انقر لبدء المشاهدة الحية أو التقديم</p>
                    </div>
                  </div>

                  {/* Simulated Progress bar at the bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent space-y-2 z-10">
                    <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold font-mono">
                      <span>٠٠:٠٠</span>
                      <span>/</span>
                      <span>{selectedLecture.duration}</span>
                    </div>
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
                      <div className="bg-slate-1000 h-full w-1/3 rounded-full relative">
                        <div className="absolute -left-1 -top-1 h-3.5 w-3.5 bg-white rounded-full shadow-lg border-2 border-slate-800"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lecture Tab Headers */}
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => setActiveSubTab('video')}
                    className={`flex-1 py-4 text-center font-bold text-xs border-b-2 transition-all ${
                      activeSubTab === 'video'
                        ? 'border-slate-800 text-slate-900 bg-white shadow-sm'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'
                    }`}
                  >
                    التوصيف الأكاديمي والمنهج
                  </button>
                  <button
                    onClick={() => setActiveSubTab('transcript')}
                    className={`flex-1 py-4 text-center font-bold text-xs border-b-2 transition-all ${
                      activeSubTab === 'transcript'
                        ? 'border-slate-800 text-slate-900 bg-white shadow-sm'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'
                    }`}
                  >
                    تفريغ المحاضرة والملاحظات
                  </button>
                  <button
                    onClick={() => setActiveSubTab('summary')}
                    className={`flex-1 py-4 text-center font-bold text-xs border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'summary'
                        ? 'border-slate-800 text-slate-900 bg-white shadow-sm'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    ملخص الذكاء الاصطناعي AI
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="p-6 min-h-[160px] max-h-[300px] overflow-y-auto">
                  {activeSubTab === 'video' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-slate-800 text-sm">موضوع الدرس: {selectedLecture.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{selectedLecture.description}</p>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-4 space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-800">الأهداف والمنهج التعليمي للأسبوع الحالي:</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 font-medium list-inside">
                          <li className="flex items-center gap-1.5">✔️ فهم الأساس الفلسفي والتطبيقي لـ {activeCourse.title}</li>
                          <li className="flex items-center gap-1.5">✔️ تمييز الهياكل والخوارزميات الهندسية المعتمدة</li>
                          <li className="flex items-center gap-1.5">✔️ القدرة على محاكاة الحلول رياضياً وبرمجياً</li>
                          <li className="flex items-center gap-1.5">✔️ مراجعة حالات الاستخدام في الصناعة الحديثة</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'transcript' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-800 font-bold">تفريغ نصي توليدي معتمد لجلستك الدراسية</span>
                        <span className="text-[10px] text-slate-400">الدقة التقريبية: ٩٨٪</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        "{selectedLecture.transcript}"
                      </p>
                    </div>
                  )}

                  {activeSubTab === 'summary' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">توليد ملخص فوري للمحاضرة في نقاط مرتبة بمساعدة نموذج Gemini 3.5.</p>
                        <button
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary}
                          className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
                        >
                          {isGeneratingSummary ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              جاري التوليد...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                              توليد ملخص ذكي
                            </>
                          )}
                        </button>
                      </div>

                      {summaryText ? (
                        <div className="bg-amber-50/40 border border-amber-100 p-5 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-2 whitespace-pre-line font-medium" id="ai-bullet-summary-content">
                          {summaryText}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-xs text-slate-400 font-bold">
                          لم يتم توليد الملخص لهذه المحاضرة بعد. انقر على الزر لتوليده فوراً بمساعدة الذكاء الاصطناعي.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Forum Section (Academic Discussion Forum) */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6" id="academic-course-forum">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <MessageSquare className="h-4.5 w-4.5 text-slate-900" />
                      منتدى النقاش والتفاعل الأكاديمي للمساق
                    </h3>
                    <p className="text-slate-400 text-[10px] font-bold">شارك أسئلتك، مذكراتك الأكاديمية مع زملائك ومحاضر المساق</p>
                  </div>
                  <button className="bg-slate-100 hover:bg-slate-100 text-slate-900 border border-slate-200 font-extrabold text-[11px] py-2 px-3.5 rounded-xl transition-colors">
                    + إنشاء منشور نقاش
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Forum Post 1 */}
                  <div className="border border-slate-100 rounded-2xl p-4 space-y-3 hover:border-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-xs font-black">
                          ف
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">فيصل ناصر الحربي</span>
                          <span className="text-[10px] text-slate-400 font-medium">منذ ٣ ساعات • طالب مسجل</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 font-extrabold">استفسار أكاديمي</span>
                    </div>
                    <div className="space-y-1 text-right">
                      <h4 className="text-xs font-extrabold text-slate-800">استفسار بخصوص دالة الكفاءة الرياضية لخوارزمية النجم الـ Heuristics</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        السلام عليكم، هل القيمة التقديرية h(n) في الخوارزمية يجب أن تكون دائماً أقل من أو تساوي التكلفة الفعلية لضمان المثالية (Admissibility)؟
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-700 leading-relaxed space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                        رد معتمد • د. سارة الغامدي (المحاضر):
                      </div>
                      "نعم فيصل، هذا شرط جوهري يسمى Admissibility لضمان أقصر مسار دائماً. لو تخطت التقديرية التكلفة الفعلية، قد تتجاهل الخوارزمية الحل الأمثل وتبحث في مسار فرعي غير فعال."
                    </div>
                  </div>

                  {/* Forum Post 2 */}
                  <div className="border border-slate-100 rounded-2xl p-4 space-y-3 hover:border-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                          م
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">مريم عبد الله الكعبي</span>
                          <span className="text-[10px] text-slate-400 font-medium">منذ أمس • طالبة مسجلة</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 font-extrabold">مذكرة دراسية</span>
                    </div>
                    <div className="space-y-1 text-right">
                      <h4 className="text-xs font-extrabold text-slate-800">ملخص رائع لتبسيط مفهوم شجرة القرار الإحصائية</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        قمت بتلخيص خوارزمية جين بالاعتماد على معامل الشوائب Gini Impurity ووضعت رسمة توضيحية ممتازة في المرفقات الأكاديمية.
                      </p>
                    </div>
                  </div>

                  {/* Forum Post 3 */}
                  <div className="border border-slate-100 rounded-2xl p-4 space-y-3 hover:border-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black">
                          س
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">سعود بن فهد</span>
                          <span className="text-[10px] text-slate-400 font-medium">منذ يومين • طالب مسجل</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200 font-extrabold">عام النقاش</span>
                    </div>
                    <div className="space-y-1 text-right">
                      <h4 className="text-xs font-extrabold text-slate-800">هل ستدرج مسائل البرمجة الخطية النظرية في الامتحان النصفي الموحد؟</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        زميلكم سعود يسأل هل نركز على الرسم البياني للمنطقة الممكنة أم نكتفي بفهم الجانب الرياضي فقط؟
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 text-slate-400 font-bold">
              يرجى اختيار محاضرة من القائمة الجانبية للبدء.
            </div>
          )}
        </div>

        {/* Sidebar: Lectures List & Interactive Chatbot */}
        <div className="space-y-6">
          {/* List of Lectures */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-900" />
              دروس ومحاضرات المساق
            </h3>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {activeCourse.lectures.map((lecture, index) => {
                const isSelected = selectedLecture?.id === lecture.id;
                return (
                  <div
                    key={lecture.id}
                    onClick={() => setSelectedLecture(lecture)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-slate-350 bg-slate-100/40'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PlayCircle className={`h-5 w-5 shrink-0 ${isSelected ? 'text-slate-800' : 'text-slate-400'}`} />
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">الدرس {index + 1}</span>
                        <h4 className={`text-xs font-bold leading-normal ${isSelected ? 'text-blue-950' : 'text-slate-700'}`}>
                          {lecture.title.replace(/^المحاضرة \d+: /, '')}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{lecture.duration}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Tutor Assistant Sidebox */}
          <div className="bg-slate-50 rounded-3xl border border-slate-150 p-5 shadow-sm flex flex-col h-[320px] justify-between">
            <div className="space-y-1.5 pb-3 border-b border-slate-200/60 flex items-center gap-2">
              <BrainCircuit className="h-4.5 w-4.5 text-slate-800" />
              <div>
                <h3 className="font-black text-slate-800 text-xs">المرشد الأكاديمي المساعد</h3>
                <span className="text-[9px] text-slate-400 font-bold">ذكاء توليدي نشط • محتوى المساق</span>
              </div>
            </div>

            {/* Chat message display area */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-[11px]" id="tutor-chat-box">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-start' : 'justify-start flex-row-reverse'}`}>
                  {msg.sender === 'ai' && (
                    <div className="h-6 w-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      AI
                    </div>
                  )}
                  <div
                    className={`p-2.5 rounded-xl max-w-[85%] font-medium leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white text-slate-700 border border-slate-150 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiResponding && (
                <div className="flex gap-2 justify-start flex-row-reverse items-center text-slate-400 text-[10px]">
                  <Loader2 className="h-3 w-3 animate-spin text-slate-800" />
                  <span>المرشد يفكر ويصوغ الإجابة...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-200/60">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="اسأل المرشد الذكي عن الدرس..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-1000 font-medium text-slate-800"
                id="tutor-chat-input"
              />
              <button
                type="submit"
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
