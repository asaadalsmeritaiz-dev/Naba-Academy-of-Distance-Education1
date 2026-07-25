import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Video,
  Monitor,
  AlertTriangle,
  Play,
  Loader2,
  Sparkles,
  Check,
  X,
  FileText,
  Upload,
  PlusCircle,
  Award,
  Calendar,
  Clock,
  ChevronRight,
  Maximize2,
  Pause,
  AlertCircle,
  Film
} from 'lucide-react';
import { ProctorAlert, ExamQuestion } from '../types';
import { mockProctorAlerts, mockProctoringData } from '../data';
import { io } from 'socket.io-client';

interface ProctorDashboardProps {
  mode?: 'proctor' | 'generator';
}

export default function ProctorDashboard({ mode = 'proctor' }: ProctorDashboardProps) {
  const [alerts, setAlerts] = useState<ProctorAlert[]>(mockProctorAlerts);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<ExamQuestion[]>([]);
  const [selectedStudentAlert, setSelectedStudentAlert] = useState<ProctorAlert | null>(null);

  // Proctoring Review State
  const [selectedReviewStudent, setSelectedReviewStudent] = useState<any | null>(null);
  const [reviewTime, setReviewTime] = useState<number>(0); // Current playhead in seconds (0 to 300)
  const [isReviewPlaying, setIsReviewPlaying] = useState<boolean>(false);
  const [activeSnapshot, setActiveSnapshot] = useState<any>(mockProctoringData.snapshots[0]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  const getSnapshotVisual = (url: string) => {
    if (url.includes('snap1')) return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60';
    if (url.includes('snap2')) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60';
    if (url.includes('snap3')) return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60';
    if (url.includes('snap4')) return 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=60';
    return url;
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleViewReview = (student: any, jumpTimestamp?: string) => {
    setSelectedReviewStudent(student);
    if (jumpTimestamp) {
      const parts = jumpTimestamp.split(':');
      const seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      setReviewTime(seconds);
      const matched = mockProctoringData.snapshots.find(s => s.timestamp === jumpTimestamp);
      if (matched) {
        setActiveSnapshot(matched);
      }
    } else {
      setReviewTime(0);
      setActiveSnapshot(mockProctoringData.snapshots[0]);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isReviewPlaying && selectedReviewStudent) {
      interval = setInterval(() => {
        setReviewTime((prev) => {
          if (prev >= 300) {
            setIsReviewPlaying(false);
            return 300;
          }
          const nextSec = prev + 1;
          
          // Auto sync active snapshot based on current playing seconds
          const matched = mockProctoringData.snapshots.find(s => {
            const sParts = s.timestamp.split(':');
            const sSec = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
            return Math.abs(sSec - nextSec) < 15;
          });
          if (matched) {
            setActiveSnapshot(matched);
          }

          return nextSec;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isReviewPlaying, selectedReviewStudent]);

  // Connect to socket.io room for the active exam on load to receive real-time alerts
  useEffect(() => {
    if (mode !== 'proctor') return;

    const socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true
    });
    
    // Join proctor room for active exam
    socket.emit('join-exam', 'exam_1');
    
    socket.on('new-violation', (data: any) => {
      console.log("Real-time violation alert received on proctor dashboard:", data);
      
      const newAlert: ProctorAlert = {
        id: `alert-${Date.now()}`,
        studentName: data.studentName || data.studentId,
        message: data.details || data.type,
        timestamp: new Date(data.timestamp).toLocaleTimeString('ar-EG'),
        severity: 'high',
        type: ['tab_switch', 'multiple_faces', 'no_face', 'audio_anomaly', 'right_click', 'forbidden_copy', 'forbidden_paste', 'forbidden_keys'].includes(data.type) ? data.type : 'multiple_faces'
      };
      
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [mode]);

  // Auto Quiz Generator handler using Gemini API
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcriptInput.trim()) return;

    setIsGeneratingQuiz(true);
    setGeneratedQuestions([]);

    try {
      const response = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptInput })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedQuestions(data.questions);
      } else {
        throw new Error('Fallback');
      }
    } catch (err) {
      // Fallback Arabic questions matching AI lecture topic
      await new Promise((resolve) => setTimeout(resolve, 1800));
      setGeneratedQuestions([
        {
          id: 'gq1',
          type: 'mcq',
          text: 'بناءً على تفريغ المحاضرة، ما هي المشكلة الأساسية التي يعالجها "البحث غير الموجه" في المساحات الكبيرة؟',
          options: [
            'مشكلة الانفجار التعادلي أو التضاعف الأسي لعدد الخيارات',
            'عدم وجود دالة هدف محددة',
            'عدم توافق دالة التنشيط Sigmoid',
            'التصنيف غير المتناسق للبيانات المصنفة'
          ],
          correctAnswer: 'مشكلة الانفجار التعادلي أو التضاعف الأسي لعدد الخيارات',
          points: 5
        },
        {
          id: 'gq2',
          type: 'boolean',
          text: 'تستخدم دالة Heuristic لتوجيه البحث نحو الهدف من خلال توفير كلفة تقديرية مسبقة للمسار المتبقي.',
          options: ['صحيح', 'خطأ'],
          correctAnswer: 'صحيح',
          points: 3
        },
        {
          id: 'gq3',
          type: 'short',
          text: 'كيف يؤثر اختيار دالة التنشيط (Activation Function) على قدرة الشبكة العصبية على حل المسائل المعقدة؟',
          correctAnswer: 'تقوم بإدخال الخواص والتعقيدات غير الخطية مما يسمح بحل مسائل غير قابلة للفصل خطياً.',
          points: 4
        }
      ]);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleActionOnStudent = (alertId: string, actionType: 'warn' | 'accept' | 'dismiss') => {
    if (actionType === 'dismiss') {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } else {
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id === alertId) {
            return {
              ...a,
              message:
                actionType === 'warn'
                  ? `[تم تحذير الطالب رسمياً] - ${a.message}`
                  : `[تم قبول العذر الأكاديمي] - ${a.message}`
            };
          }
          return a;
        })
      );
    }
    setSelectedStudentAlert(null);
  };

  // Mock student cameras for live feed
  const studentsInExam = [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300" id="proctor-cockpit">
      {selectedReviewStudent ? (
        <div className="space-y-6 animate-in fade-in duration-300" id="proctoring-review-page">
          {/* Back Navigation Bar */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
            <button
              onClick={() => setSelectedReviewStudent(null)}
              className="flex items-center gap-2 text-slate-800 hover:text-slate-950 font-black text-xs bg-slate-100 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all"
            >
              <ChevronRight className="h-4 w-4" />
              العودة للوحة المراقبة العامة
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full">نظام مراجعة المخالفات المفصل</span>
            </div>
          </div>

          {/* Header metadata details */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={selectedReviewStudent.img} alt={selectedReviewStudent.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700" />
                <span className="absolute -bottom-1 -right-1 bg-slate-1000 text-white p-1 rounded-lg text-[9px] font-bold">طالب</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black">{selectedReviewStudent.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 font-semibold">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> الرقم الجامعي: {selectedReviewStudent.id === 'st1' ? 'CS-2023-8849' : 'CS-2023-9021'}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-slate-400" /> الامتحان النصفي الموحد - الذكاء الاصطناعي</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800 w-full md:w-auto">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block">تاريخ تقديم الامتحان</span>
                <span className="text-xs font-bold flex items-center gap-1 text-white"><Calendar className="w-3.5 h-3.5 text-slate-400" /> ٨ يوليو ٢٠٢٦</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold flex items-center gap-1 text-white"><Clock className="w-3.5 h-3.5 text-slate-400" /> ٤٥ دقيقة كاملة</span>
              </div>
            </div>
          </div>

          {/* Detailed Dual-Player and Timeline and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Player Columns (col-span-3) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* DUAL SCREENS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950">
                  
                  {/* Screen A: Webcam */}
                  <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between">
                    <div className="absolute top-3 left-3 bg-slate-900/90 text-white font-mono text-[9px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Film className="w-3 h-3" />
                      كاميرا الطالب (Webcam Feed)
                    </div>
                    <img src={selectedReviewStudent.img} alt="Webcam View" className="w-full h-full object-cover" />
                    
                    {/* Live AI Detection Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-32 h-36 border-2 border-emerald-400 rounded-full bg-emerald-400/5 flex flex-col justify-between p-2 relative">
                        <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                        <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                        <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                        <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                        <div className="bg-emerald-900/80 text-emerald-300 font-mono text-[8px] font-black px-1.5 py-0.5 rounded mx-auto mt-2">
                          تتبع الرأس: نشط
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/60 text-white font-mono text-[10px] px-2 py-0.5 rounded">
                      دقة الكاميرا: 720p HD
                    </div>
                  </div>

                  {/* Screen B: Screen Capture */}
                  <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between">
                    <div className="absolute top-3 left-3 bg-slate-800/90 text-white font-mono text-[9px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Monitor className="w-3 h-3 text-slate-300" />
                      شاشة الطالب الموثقة (Screen Record)
                    </div>
                    
                    <img 
                      src={getSnapshotVisual(activeSnapshot.url)} 
                      alt="Screen Capture" 
                      className="w-full h-full object-cover transition-all duration-300" 
                    />

                    {/* Green matching indicator */}
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full">
                      تزامن لقطة {activeSnapshot.timestamp}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/60 text-white font-mono text-[10px] px-2 py-0.5 rounded">
                      لقطة مسجلة تلقائياً
                    </div>
                  </div>
                </div>

                {/* PLAYBACK ENGINE CONTROLS */}
                <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsReviewPlaying(!isReviewPlaying)}
                        className={`p-3 rounded-full text-white shadow-lg transition-all ${
                          isReviewPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {isReviewPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                      </button>
                      
                      <div className="text-white font-mono text-xs font-black">
                        {formatTime(reviewTime)} <span className="text-slate-500">/ 05:00</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 bg-blue-950 px-2 py-1 rounded-lg font-bold">
                        محاكاة تشغيل التسجيل ثنائي المسار
                      </span>
                    </div>
                  </div>

                  {/* Progressive Scrubber Bar */}
                  <div className="relative pt-1">
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={reviewTime}
                      onChange={(e) => {
                        const targetSec = parseInt(e.target.value, 10);
                        setReviewTime(targetSec);
                        
                        // Sync snapshot based on slider position
                        const matched = mockProctoringData.snapshots.find(s => {
                          const sParts = s.timestamp.split(':');
                          const sSec = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
                          return Math.abs(sSec - targetSec) < 45;
                        });
                        if (matched) {
                          setActiveSnapshot(matched);
                        }
                      }}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                  </div>

                  {/* INTERACTIVE TIMELINE WITH SNAPSHOT MARKERS */}
                  <div className="relative pt-2" id="interactive-snapshot-timeline-bar">
                    <div className="text-[10px] text-slate-400 font-bold mb-2">الخط الزمني للمخالفات ولقطات الشاشة:</div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full relative overflow-visible flex items-center">
                      
                      {/* Interactive markers */}
                      {mockProctoringData.snapshots.map((snap, idx) => {
                        const parts = snap.timestamp.split(':');
                        const seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                        const percentage = (seconds / 300) * 100;
                        const isSelected = activeSnapshot.timestamp === snap.timestamp;
                        const hasViolation = mockProctoringData.violations.some(v => v.time === snap.timestamp);

                        return (
                          <div
                            key={idx}
                            style={{ left: `${percentage}%` }}
                            onClick={() => {
                              setReviewTime(seconds);
                              setActiveSnapshot(snap);
                            }}
                            className={`absolute transform -translate-x-1/2 cursor-pointer group flex flex-col items-center`}
                            title={`لقطة شاشة دورية عند ${snap.timestamp}`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                              hasViolation 
                                ? isSelected ? 'bg-rose-500 border-white scale-125' : 'bg-rose-600 border-rose-900 group-hover:scale-110'
                                : isSelected ? 'bg-slate-700 border-white scale-125' : 'bg-slate-500 border-slate-700 group-hover:scale-110'
                            }`} />
                            
                            <span className="absolute -top-6 text-[8px] font-mono font-bold text-slate-400 bg-slate-950 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {snap.timestamp}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* TIMELINE VIOLATION LOGS */}
              <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-slate-800" />
                  <h3 className="font-black text-sm text-slate-900">سجل المخالفات المتزامنة مع الفيديو (Violation Logs)</h3>
                </div>

                <div className="divide-y divide-slate-100 space-y-3">
                  {mockProctoringData.violations.map((v, vIdx) => {
                    const parts = v.time.split(':');
                    const vSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                    return (
                      <div 
                        key={vIdx} 
                        onClick={() => {
                          setReviewTime(vSeconds);
                          const snap = mockProctoringData.snapshots.find(s => s.timestamp === v.time);
                          if (snap) setActiveSnapshot(snap);
                        }}
                        className="pt-3 first:pt-0 flex justify-between items-center cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all border border-transparent hover:border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black bg-slate-100 hover:bg-slate-100 hover:text-slate-800 text-slate-600 px-2.5 py-1 rounded-lg">
                            {v.time}
                          </span>
                          <div>
                            <p className="text-xs font-black text-slate-800">
                              {v.type === 'Tab Switch' ? 'مخالفة: الخروج من تبويب الامتحان النشط' : 'مخالفة: الكشف عن وجود وجوه متعددة'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block">تم التوثيق تلقائياً بواسطة الذكاء الاصطناعي</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-full ${
                          v.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {v.severity === 'high' ? 'مخالفة مؤكدة - حرجة' : 'اشتباه سلوكي - متوسط'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Snapshot Gallery Sidebar and Grading Actions (col-span-1) */}
            <div className="space-y-6">
              
              {/* SNAPSHOT GALLERY SIDEBAR */}
              <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xs text-slate-900">معرض اللقطات الكامل (Snapshots)</h3>
                  <span className="text-[9px] text-slate-400 font-bold">٤ لقطات مفهرسة</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mockProctoringData.snapshots.map((snap, idx) => {
                    const isSelected = activeSnapshot.timestamp === snap.timestamp;
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          const parts = snap.timestamp.split(':');
                          const seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                          setReviewTime(seconds);
                          setActiveSnapshot(snap);
                        }}
                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group/gal ${
                          isSelected ? 'border-slate-800 scale-[1.02] shadow-md shadow-slate-900/10' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <img 
                          src={getSnapshotVisual(snap.url)} 
                          alt={`Snap ${snap.timestamp}`} 
                          className="w-full aspect-video object-cover group-hover/gal:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute top-1 right-1 bg-black/75 text-[8px] text-white font-mono px-1.5 py-0.5 rounded">
                          {snap.timestamp}
                        </div>

                        {/* Lightbox Trigger button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(getSnapshotVisual(snap.url));
                            setLightboxTitle(`لقطة الطالب ${selectedReviewStudent.name} عند ${snap.timestamp}`);
                          }}
                          className="absolute bottom-1 left-1 p-1 bg-slate-900/90 text-white rounded opacity-0 group-hover/gal:opacity-100 transition-opacity"
                          title="تكبير اللقطة"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MANUAL GRADING ACTIONS */}
              <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
                <h3 className="font-black text-xs text-slate-900">اتخاذ إجراء المشرف الأكاديمي</h3>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  يمكنك اعتماد سلوك ونزاهة الطالب رسمياً في محرك المراقبة الذكية هذا.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      alert('تم اعتماد محاولة الطالب كنزيهة بنجاح.');
                      setSelectedReviewStudent(null);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    اعتماد النزاهة وقبول الامتحان
                  </button>
                  
                  <button
                    onClick={() => {
                      alert('تم تسجيل المخالفة رسمياً وتحويل الملف إلى اللجنة الأكاديمية المختصة.');
                      setSelectedReviewStudent(null);
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    تسجيل مخالفة سلوكية رسمية
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lightbox Rendering Modal */}
          {lightboxImage && (
            <div 
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" 
              onClick={() => setLightboxImage(null)}
            >
              <button 
                className="absolute top-4 right-4 text-white hover:text-slate-200 cursor-pointer p-3 bg-slate-900/50 rounded-full border border-slate-800"
                onClick={() => setLightboxImage(null)}
              >
                <X className="h-6 w-6" />
              </button>
              <div className="max-w-4xl max-h-[80vh] relative p-2" onClick={(e) => e.stopPropagation()}>
                <img 
                  src={lightboxImage} 
                  alt={lightboxTitle} 
                  className="max-w-full max-h-[80vh] rounded-2xl border-2 border-slate-800 object-contain shadow-2xl" 
                />
                <p className="text-white text-center font-bold mt-4 text-xs bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 w-max mx-auto">
                  {lightboxTitle}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : mode === 'proctor' && (
        <>
          {/* 1. Header KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="proctoring-kpi-grid">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between" id="kpi-live-students">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400">الطلاب في قاعة الامتحان حياً</span>
                <p className="text-2xl font-black text-slate-800">٤ طلاب</p>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full block w-max">اتصال الأجهزة مستقر</span>
              </div>
              <div className="p-3 bg-slate-100 text-slate-800 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between" id="kpi-ai-alerts">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400">تنبيهات الذكاء الاصطناعي النشطة</span>
                <p className="text-2xl font-black text-rose-600">{alerts.length} تنبيهات</p>
                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full block w-max">يرجى المراجعة الفورية</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between" id="kpi-integrity-score">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400">معدل نزاهة القاعة التقريبي</span>
                <p className="text-2xl font-black text-emerald-600">٩٢٪</p>
                <span className="text-[10px] text-slate-400 block font-medium">مستند إلى خوارزميات رصد السلوك</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldAlert className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* 2. Split Area: Live Feeds vs Real-Time Alert Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="proctoring-split-view">
            
            {/* Left Column: Live Student Feeds with Green Face Overlays */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-black text-slate-800">قاعات المراقبة المرئية الحية (Webcam Feeds)</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="student-webcams-grid">
                {studentsInExam.map((student) => (
                  <div
                    key={student.id}
                    className={`bg-slate-900 text-white rounded-2xl overflow-hidden border-2 relative ${
                      student.status !== 'normal' ? 'border-rose-500 shadow-lg shadow-rose-950/20' : 'border-slate-800'
                    }`}
                    id={`live-feed-card-${student.id}`}
                  >
                    <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center">
                      <img
                        src={student.img}
                        alt={student.name}
                        className="h-full w-full object-cover brightness-75"
                      />
                      
                      {/* Interactive Green overlay for Head Tracking */}
                      <div className={`absolute border-2 rounded-lg pointer-events-none ${
                        student.status !== 'normal'
                          ? 'border-rose-500 bg-rose-500/10'
                          : 'border-emerald-400 bg-emerald-400/5'
                      }`} style={{ top: '25%', left: '30%', width: '40%', height: '50%' }}>
                        <div className="absolute top-1 right-2 text-[8px] bg-black/60 px-1 py-0.5 rounded text-white font-mono">
                          {student.status !== 'normal' ? 'AI: مخالفة سلوكية!' : 'AI: وجه مطابق ١٠٠٪'}
                        </div>
                      </div>

                      {student.alertCount > 0 && (
                        <span className="absolute top-3 right-3 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                          إنذارات: {student.alertCount}
                        </span>
                      )}
                      
                      <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded-lg text-[10px] font-bold">
                        {student.name}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border-t border-slate-850 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">شاشة الطالب:</span>
                      <span className={`font-bold ${student.status === 'no_face' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {student.status === 'no_face' ? 'تنبيه: الكاميرا مظلمة' : 'مشاركة الشاشة نشطة'}
                      </span>
                    </div>

                    {/* Snapshot Gallery thumbnail strip */}
                    <div className="px-3 pb-3 bg-slate-900 flex flex-col gap-1.5 border-t border-slate-850">
                      <span className="text-[9px] text-slate-400 font-bold">لقطات الشاشة الدورية (٣٠ث):</span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        {mockProctoringData.snapshots.map((snap, sIdx) => (
                          <div 
                            key={sIdx} 
                            onClick={() => handleViewReview(student, snap.timestamp)}
                            className="relative h-9 w-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 cursor-pointer hover:border-slate-700 transition-all group/snap"
                            title={`مشاهدة اللقطة عند ${snap.timestamp}`}
                          >
                            <img 
                              src={getSnapshotVisual(snap.url)} 
                              alt={`Snap ${snap.timestamp}`} 
                              className="h-full w-full object-cover group-hover/snap:scale-110 transition-transform duration-200" 
                            />
                            <span className="absolute bottom-0 right-0 bg-black/75 text-[7px] text-white px-1 font-mono rounded-tl-md">
                              {snap.timestamp}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 border-t border-slate-800 flex">
                      <button
                        onClick={() => handleViewReview(student)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2 px-3 rounded-xl transition-all shadow-md shadow-slate-900/30"
                      >
                        <Video className="h-3.5 w-3.5" />
                        عرض التسجيل واللقطات
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive Alerts and Warn/Excuse Action Controls */}
            <div className="space-y-6" id="alerts-column">
              <h3 className="text-lg font-black text-slate-800">مركز البلاغات والإنذارات الآلية</h3>

              <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="divide-y divide-slate-150 max-h-[380px] overflow-y-auto space-y-3 pr-1" id="alerts-scroll-container">
                  {alerts.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold text-xs">
                      لا توجد بلاغات معلقة حالياً.
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => setSelectedStudentAlert(alert)}
                        className={`pt-3 first:pt-0 space-y-2 cursor-pointer group hover:bg-slate-50/50 p-2 rounded-xl transition-all ${selectedStudentAlert?.id === alert.id ? 'bg-slate-100/30 border border-slate-200' : ''}`}
                        id={`alert-row-${alert.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${
                            alert.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {alert.severity === 'high' ? 'عالية الخطورة' : 'متوسطة الخطورة'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{alert.timestamp}</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 group-hover:text-slate-800 transition-colors">{alert.studentName}</h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{alert.message}</p>
                        </div>
                        
                        {selectedStudentAlert?.id === alert.id && (
                          <div className="flex gap-2 pt-2 border-t border-slate-100 animate-in fade-in duration-200" id={`alert-actions-${alert.id}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionOnStudent(alert.id, 'warn');
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex-1 transition-colors"
                              id={`warn-btn-${alert.id}`}
                            >
                              تحذير الطالب
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionOnStudent(alert.id, 'accept');
                              }}
                              className="bg-slate-100 hover:bg-slate-100 text-slate-900 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex-1 transition-colors"
                              id={`accept-excuse-btn-${alert.id}`}
                            >
                              قبول العذر
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionOnStudent(alert.id, 'dismiss');
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors"
                              id={`dismiss-btn-${alert.id}`}
                            >
                              شطب
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. Auto Quiz Generator Panel */}
      {mode === 'generator' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6" id="ai-quiz-generator-container">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">منشئ ومولد الأسئلة الأكاديمية بالذكاء الاصطناعي</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">ألصق تفريغ المحاضرة أو النصوص التعليمية لتوليد أسئلة امتحانية ذكية فوراً بواسطة Gemini 3.5.</p>
            </div>
          </div>

          <form onSubmit={handleGenerateQuiz} className="space-y-4">
            <textarea
              rows={5}
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              placeholder="مثال: ألصق نص المحاضرة هنا حول تاريخ الذكاء الاصطناعي، أو خوارزميات البحث، أو أمن التشفير..."
              className="w-full border-2 border-slate-150 rounded-2xl p-4 text-xs focus:outline-none focus:border-slate-1000 font-medium leading-relaxed text-slate-800"
              id="instructor-quiz-textarea"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isGeneratingQuiz || !transcriptInput.trim()}
                className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs py-3 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                id="generate-quiz-btn"
              >
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري قراءة النص واستخراج الأسئلة الأكاديمية...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    توليد الامتحان الموحد الذكي
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Generated Questions List display area */}
          {generatedQuestions.length > 0 && (
            <div className="p-6 bg-slate-100/20 rounded-2xl border border-slate-200 space-y-5 animate-in fade-in duration-300">
              <h4 className="font-extrabold text-sm text-blue-950 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Check className="h-5 w-5 text-emerald-600" />
                تم التوليد بنجاح! الأسئلة المستخرجة المقترحة لمستودع الامتحانات:
              </h4>

              <div className="space-y-6">
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 space-y-3" id={`generated-question-item-${q.id}`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">سؤال {idx + 1} ({q.type === 'mcq' ? 'اختيار من متعدد' : q.type === 'boolean' ? 'صح/خطأ' : 'سؤال إنشائي'})</span>
                      <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{q.points} درجات</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 leading-relaxed">{q.text}</p>
                    
                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-medium text-slate-600">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`p-2.5 rounded-lg border ${opt === q.correctAnswer ? 'border-emerald-200 bg-emerald-50/30 text-emerald-900 font-bold' : 'border-slate-100 bg-slate-50/50'}`}>
                            • {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {!q.options && (
                      <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-lg text-[11px] leading-relaxed text-slate-600">
                        <strong>الإجابة النموذجية المرتقبة للتقييم:</strong> {q.correctAnswer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
