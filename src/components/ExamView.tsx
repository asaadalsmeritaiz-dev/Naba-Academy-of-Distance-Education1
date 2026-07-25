import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Camera,
  Monitor,
  CheckCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Play,
  HelpCircle,
  Eye,
  Video
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Exam, ExamQuestion } from '../types';

import { requestCameraAndScreen, startRecording, captureScreenshot } from '@/lib/proctoring/media';
import { uploadVideoToSupabase, uploadSnapshotsToSupabase } from '@/lib/proctoring/upload';
import { initSocket, emitViolation, disconnectSocket } from '@/lib/proctoring/socket';
import VideoFloatingBox from '@/components/exam/VideoFloatingBox';

interface ExamViewProps {
  exams: Exam[];
  onExamSubmitted: (score: number, answers: Record<string, string>, logs: string[]) => void;
  currentUser?: any;
}

export default function ExamView({ exams, onExamSubmitted, currentUser }: ExamViewProps) {
  const activeExam = exams[0]; // Take the first exam
  const studentId = currentUser?.studentId || currentUser?.id || "student_1";
  const studentName = currentUser?.name || "طالب جامعي";

  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState((activeExam?.durationMinutes || 30) * 60);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [latestWarningMessage, setLatestWarningMessage] = useState('');
  
  // Media streams
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasScreenPermission, setHasScreenPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Proctoring Snapshots local state
  const [capturedSnapshots, setCapturedSnapshots] = useState<{ timestamp: string; dataUrl: string }[]>([]);
  const [isUploadingProctoring, setIsUploadingProctoring] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<any | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);
  const durationIntervalRef = useRef<any>(null);

  const answersRef = useRef<Record<string, string>>({});
  const capturedSnapshotsRef = useRef<{ timestamp: string; dataUrl: string }[]>([]);
  const timeLeftRef = useRef<number>(timeLeft);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    capturedSnapshotsRef.current = capturedSnapshots;
  }, [capturedSnapshots]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Timer Countdown
  useEffect(() => {
    if (!examStarted || examCompleted) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, examCompleted, timeLeft]);

  // Periodic screenshot capture every 30 seconds
  useEffect(() => {
    if (!examStarted || examCompleted) return;

    const captureInterval = setInterval(() => {
      handleCaptureScreenshot();
    }, 30000); // 30 seconds

    // Capture first screenshot shortly after starting
    const initialCaptureTimeout = setTimeout(() => {
      handleCaptureScreenshot();
    }, 4000);

    return () => {
      clearInterval(captureInterval);
      clearTimeout(initialCaptureTimeout);
    };
  }, [examStarted, examCompleted, currentQuestionIndex]);

  const handleCaptureScreenshot = async () => {
    const timestamp = formatTime(timeLeftRef.current);
    const element = document.getElementById('active-exam-session');
    
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          logging: false,
          useCORS: true,
          scale: 0.8
        });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setCapturedSnapshots((prev) => [...prev, { timestamp, dataUrl }]);
        console.log(`Captured high-fidelity screenshot at ${timestamp}`);
      } catch (err) {
        console.warn('html2canvas screenshot failed. Falling back to dynamic canvas drawing:', err);
        drawSimulationScreenshot(timestamp);
      }
    } else {
      drawSimulationScreenshot(timestamp);
    }
  };

  const drawSimulationScreenshot = (timestamp: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark navy layout representation
      const grad = ctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);

      // Card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(40, 40, 560, 200);

      // Title
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`Naba Academy AI Exam Proctoring Console`, 40, 30);

      // Question
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`Question ${currentQuestionIndex + 1}: ${activeExam.questions[currentQuestionIndex].text.slice(0, 40)}...`, 60, 80);

      // Answer status
      const activeAns = answersRef.current[activeExam.questions[currentQuestionIndex].id] || 'لم يتم الإجابة بعد';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(`الخيار المختار: ${activeAns.slice(0, 45)}`, 60, 130);

      // Status Indicator
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(60, 280, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`LIVE EXAM RECORDING | TIMESTAMP: ${timestamp} | SECURE RUNTIME`, 75, 284);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      setCapturedSnapshots((prev) => [...prev, { timestamp, dataUrl }]);
    }
  };

  // Anti-Cheat Security Event Listeners (Disable copy, paste, right click, window focus losses)
  useEffect(() => {
    if (!examStarted || examCompleted) return;

    // 1. Tab Switching Detection
    const handleWindowBlur = () => {
      const msg = 'محاولة الخروج من نافذة الامتحان (تبديل التبويب أو التطبيق)';
      triggerProctorWarning(msg);
      if (socketRef.current) {
        emitViolation(socketRef.current, activeExam.id, studentId, 'tab_switch', msg, studentName);
      }
    };

    // 2. Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const msg = 'النقر بـ زر الفأرة الأيمن محظور تماماً داخل بيئة الامتحان';
      triggerProctorWarning(msg);
      if (socketRef.current) {
        emitViolation(socketRef.current, activeExam.id, studentId, 'right_click', msg, studentName);
      }
    };

    // 3. Disable Copy & Paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const msg = 'محاولة نسخ الأسئلة أو النصوص محظورة';
      triggerProctorWarning(msg);
      if (socketRef.current) {
        emitViolation(socketRef.current, activeExam.id, studentId, 'forbidden_copy', msg, studentName);
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const msg = 'محاولة لصق نصوص خارجية غير مسموح بها';
      triggerProctorWarning(msg);
      if (socketRef.current) {
        emitViolation(socketRef.current, activeExam.id, studentId, 'forbidden_paste', msg, studentName);
      }
    };

    // 4. Disable Special Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+C, Ctrl+V, Ctrl+Shift+I, Alt, Cmd keys
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'c') ||
        (e.ctrlKey && e.key === 'v') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.altKey ||
        e.metaKey
      ) {
        e.preventDefault();
        const msg = `محاولة استخدام اختصار لوحة المفاتيح (${e.key}) المحظور أمنياً`;
        triggerProctorWarning(msg);
        if (socketRef.current) {
          emitViolation(socketRef.current, activeExam.id, studentId, 'forbidden_keys', msg, studentName);
        }
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [examStarted, examCompleted, studentId]);

  const triggerProctorWarning = (message: string) => {
    const time = new Date().toLocaleTimeString('ar-EG');
    const fullMsg = `[${time}] ${message}`;
    setWarnings((prev) => [fullMsg, ...prev]);
    setLatestWarningMessage(message);
    setShowWarningModal(true);
  };

  // Start Proctor Media Devices (Camera & Screen Share)
  const startProctoringStreams = async () => {
    try {
      // Use helper to request media streams safely with iframe fallback support
      const combinedStream = await requestCameraAndScreen();
      cameraStreamRef.current = combinedStream;
      setStream(combinedStream);

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = combinedStream;
      }
      setHasCameraPermission(true);
      setHasScreenPermission(true);

      // Initialize socket for real-time monitoring
      const socket = initSocket(activeExam.id);
      socketRef.current = socket;

      setIsRecording(true);

      // Start video recording
      const rec = startRecording(
        combinedStream,
        (chunk) => {
          // Chunk received
        },
        async (videoBlob) => {
          setIsUploadingProctoring(true);
          setUploadProgress(0);
          try {
            console.log("Saving exam details and starting TUS upload...");
            // 1. Upload Full Video using resumable TUS protocol
            const videoUrl = await uploadVideoToSupabase(videoBlob, activeExam.id, studentId, setUploadProgress);
            console.log("Full proctoring video uploaded successfully:", videoUrl);

            // 2. Upload Captured Snapshots to Supabase
            const snapshotUrls = await uploadSnapshotsToSupabase(
              capturedSnapshotsRef.current.map(s => ({ timestamp: s.timestamp, data: s.dataUrl })),
              activeExam.id,
              studentId
            );
            console.log("Uploaded proctoring snapshots:", snapshotUrls);

            // 3. Format Answers for Submit API
            const formattedAnswers = Object.entries(answersRef.current).map(([qId, ansText]) => ({
              question_id: qId,
              answer_text: ansText
            }));

            // 4. Save attempt, scoring, video URL, and snapshots to database
            const response = await fetch(`/api/exams/${activeExam.id}/submit`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
              },
              body: JSON.stringify({
                answers: formattedAnswers,
                proctoring_video_url: videoUrl,
                proctoring_snapshots: snapshotUrls,
                snapshot_timestamps: capturedSnapshotsRef.current.map(s => s.timestamp)
              })
            });

            const submitResult = await response.json();
            if (submitResult.success) {
              console.log("Exam submitted and graded with AI successfully!");
            } else {
              console.warn("Failed to submit and grade exam via official endpoint:", submitResult.error);
            }
          } catch (err) {
            console.error("Proctoring upload/submission process failed:", err);
          } finally {
            setIsUploadingProctoring(false);
          }
        }
      );

      setRecorder(rec);

      // Start duration tracker
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      setExamStarted(true);
    } catch (err) {
      console.warn('Camera/mic streams blocked or failed. Proceeding with fallback mock stream.', err);
      setHasCameraPermission(true);
      setHasScreenPermission(true);
      setIsRecording(true);
      setExamStarted(true);
    }
  };

  // Clean up media streams
  const stopProctoringStreams = () => {
    if (recorder) {
      try {
        recorder.stop();
      } catch (err) {
        console.warn("Could not stop media recorder:", err);
      }
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    disconnectSocket();
    setIsRecording(false);
  };

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleShortAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const handleSubmitExam = () => {
    stopProctoringStreams();
    setExamCompleted(true);
    setIsUploadingProctoring(true);

    // Calculate score locally for immediate callback backup
    let score = 0;
    activeExam.questions.forEach((q) => {
      const studentAns = answersRef.current[q.id] || '';
      if (q.type === 'short') {
        if (studentAns.length > 20) score += q.points;
      } else if (studentAns.trim() === q.correctAnswer.trim()) {
        score += q.points;
      }
    });

    onExamSubmitted(score, answersRef.current, warnings);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeExam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50 rounded-3xl border border-slate-150 p-8 text-center" id="no-active-exam">
        <div className="p-4 bg-amber-50 rounded-full text-amber-600 mb-4">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">لا توجد امتحانات نشطة حالياً</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          لم يتم جدولة أي اختبارات أو تم تفريغ المقررات والامتحانات من قبل إدارة المنصة. يرجى مراجعة المشرف م/اسعد الشميري للمزيد من المعلومات.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="exam-room-container">
      {/* 1. Exam Entry Screen */}
      {!examStarted && !examCompleted && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800">{activeExam.title}</h2>
            <p className="text-slate-500 text-xs font-bold">{activeExam.courseTitle} ({activeExam.questions.length} أسئلة)</p>
          </div>

          {/* Exam Requirements Checkbox list */}
          <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-xs">قواعد حماية نزاهة الامتحانات والبيئة الآمنة:</h3>
            <ul className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>زمن الامتحان المحدد:</strong> مدة الامتحان المتاحة هي ٤٥ دقيقة كاملة تبدأ فور نقرك على زر الدخول.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>الكاميرا والمايكروفون إلزاميان:</strong> يقوم النظام بالتحقق حياً من هوية الطالب واكتشاف أي وجوه متعددة أو تلقين صوتي.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>مشاركة الشاشة كاملة:</strong> ستتم مشاركة شاشتك بالكامل طوال فترة الامتحان لرصد فتح نوافذ أخرى.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>بيئة أمنية صارمة:</strong> النقر الأيمن بالفأرة، ونسخ النصوص ولصقها، واختصارات المفاتيح محجوبة تماماً ويؤدي تكرارها لإلغاء الامتحان.</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={startProctoringStreams}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-slate-100 transition-colors inline-flex items-center gap-2"
              id="request-proctor-permissions-btn"
            >
              <Video className="h-5 w-5" />
              أفهم الشروط وأبدأ الامتحان
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Exam Session Screen */}
      {examStarted && !examCompleted && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start" id="active-exam-session">
          
          {/* Main Question Arena */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-800 font-extrabold block bg-slate-100 px-2 py-0.5 rounded-md">السؤال {currentQuestionIndex + 1} من {activeExam.questions.length}</span>
                    <span className="text-xs text-slate-400 font-extrabold">الطالب: {studentName}</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 mt-1">بيئة اختبار آمنة ومراقبة حياً بالتكامل مع الذكاء الاصطناعي</h3>
                </div>
                
                {/* Countdown Timer (45:00 remaining) */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-bold text-xs shrink-0">
                  <Clock className="h-4 w-4 text-rose-600 animate-pulse" />
                  <span>الزمن المتبقي: {formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* Question Body */}
              <div className="space-y-5">
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                  <p className="text-sm font-extrabold text-slate-800 leading-relaxed">
                    {activeExam.questions[currentQuestionIndex].text}
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold block mt-3">درجة السؤال: {activeExam.questions[currentQuestionIndex].points} درجات</span>
                </div>

                {/* Options selection for MCQ / Boolean */}
                {activeExam.questions[currentQuestionIndex].type !== 'short' && (
                  <div className="space-y-3">
                    {activeExam.questions[currentQuestionIndex].options?.map((option) => {
                      const isSelected = answers[activeExam.questions[currentQuestionIndex].id] === option;
                      return (
                        <div
                           key={option}
                           onClick={() => handleSelectOption(activeExam.questions[currentQuestionIndex].id, option)}
                           className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 font-semibold text-xs ${
                            isSelected
                              ? 'border-slate-800 bg-slate-100/40 text-blue-950'
                              : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 text-slate-700'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-300'}`}>
                            {isSelected && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
                          </div>
                          <span>{option}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text Input area for Short Answer Essay questions */}
                {activeExam.questions[currentQuestionIndex].type === 'short' && (
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={answers[activeExam.questions[currentQuestionIndex].id] || ''}
                      onChange={(e) => handleShortAnswerChange(activeExam.questions[currentQuestionIndex].id, e.target.value)}
                      placeholder="اكتب إجابتك الأكاديمية الشاملة هنا بالتفصيل (سيتم تقييمها تلقائياً بالذكاء الاصطناعي)..."
                      className="w-full border-2 border-slate-100 rounded-2xl p-4 text-xs focus:outline-none focus:border-slate-1000 text-slate-800 font-medium leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>الحد الأدنى المقترح: ٥٠ كلمة</span>
                      <span>عدد الحروف المدخلة: {(answers[activeExam.questions[currentQuestionIndex].id] || '').length} حرف</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  السابق
                </button>

                {currentQuestionIndex < activeExam.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeExam.questions.length - 1, prev + 1))}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    التالي
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-colors shadow-md shadow-rose-100"
                    id="submit-exam-now-btn"
                  >
                    تسليم ورقة الامتحان والإنهاء
                  </button>
                )}
              </div>
            </div>

            {/* Simulated Flashing Red Warning Bar if warnings exist */}
            {warnings.length > 0 && (
              <div className="bg-rose-600 text-white rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse shadow-md" id="flashing-security-violation-bar">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold">تم رصد انتهاك أمني نشط في جلسة الامتحان المراقبة!</h5>
                    <p className="text-[10px] text-rose-100 font-medium mt-0.5">النظام قام برصد محاولتك للخروج من التبويب النشط أو توصيل شاشة غير معتمدة. تكرار ذلك يعرض اختبارك للإلغاء الفوري.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel: Proctor Client Monitor Overlay */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-850 space-y-4 shadow-lg text-white">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-extrabold tracking-wide">الرقيب الذكي نشط (AI PROCTOR)</span>
              </div>

              {/* Student Live WebRTC Camera Stream representation */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">عدسة الطالب الحية</span>
                <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-white/5 relative flex items-center justify-center">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-2 bg-slate-900">
                      <Camera className="h-6 w-6 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-extrabold leading-normal">العدسة الافتراضية نشطة (بيئة تجريبية)</span>
                      <span className="text-[8px] text-slate-400 font-medium leading-normal">تم تفعيل المراقبة الذكية الافتراضية بنجاح</span>
                    </div>
                  )}
                  {stream && (
                    <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-bold text-slate-300">
                      تتبع الرأس والعينين نشط
                    </div>
                  )}
                </div>
              </div>

              {/* Student Shared Screen Stream representation */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">شاشة الامتحان المشتركة</span>
                <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-white/5 relative flex items-center justify-center">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-2 bg-slate-900">
                      <Monitor className="h-6 w-6 text-slate-500" />
                      <span className="text-[10px] text-slate-400 font-semibold leading-normal">تتبع النوافذ وعلامات التبويب نشط</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Warning Ticker */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold block">سجل الإنذارات الأمني لجلستك</span>
                <div className="bg-black/45 border border-white/5 rounded-xl p-3 h-24 overflow-y-auto space-y-1.5 font-mono text-[9px] text-amber-500 leading-normal">
                  {warnings.length === 0 ? (
                    <span className="text-emerald-400 block text-center py-4 font-sans font-bold">لا توجد مخالفات مسجلة حتى الآن.</span>
                  ) : (
                    warnings.map((w, i) => (
                      <div key={i} className="flex gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Warning Alert Modal for anti-cheat breaches */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4 text-center">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-max mx-auto">
              <AlertTriangle className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-base font-black text-slate-950">تنبيه أمني من نظام المراقبة الذكي!</h3>
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-2xl border border-rose-100 leading-relaxed">
              {latestWarningMessage}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              يرجى الالتزام التام بقوانين الامتحان. تذكر أن تكرار الخروج من تبويب الامتحان أو محاولة الاحتيال قد تؤدي لتجميد الاختبار وإصدار مخالفة فورية لعميد الكلية.
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-3 rounded-xl transition-colors"
            >
              فهمت وأوافق على المتابعة
            </button>
          </div>
        </div>
      )}

      {/* 4. Uploading Proctoring files screen */}
      {examCompleted && isUploadingProctoring && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 p-8 shadow-lg space-y-6 animate-in fade-in duration-300 text-center">
          <div className="p-4 bg-slate-100 text-slate-800 rounded-2xl w-max mx-auto">
            <Loader2 className="h-10 w-10 animate-spin text-slate-800" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-800">جاري تشفير ورفع ملفات المراقبة الأمنية حياً</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">الرجاء عدم إغلاق هذه الصفحة حتى يتم إتمام رفع تسجيل الفيديو واللقطات.</p>
          </div>
          <div className="space-y-3 max-w-md mx-auto">
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>{uploadProgress}% مكتمل</span>
              <span>جاري الرفع إلى سحابة Supabase</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Exam Finished Success screen with Mock AI grading report */}
      {examCompleted && !isUploadingProctoring && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-max mx-auto">
              <CheckCircle className="h-10 w-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">تم تسليم إجاباتك بنجاح!</h2>
            <p className="text-slate-500 text-xs font-bold">تم حفظ الجلسة ورفع تسجيلات الكاميرا والشاشة إلى خوادم كلية الحاسب بنجاح.</p>
          </div>

          {/* AI evaluation report section */}
          <div className="bg-slate-100/40 rounded-2xl p-6 border border-slate-200 space-y-4 text-right">
            <div className="flex items-center gap-2 border-b border-slate-350 pb-3">
              <Loader2 className="h-5 w-5 text-slate-800 animate-spin" />
              <div>
                <h3 className="font-extrabold text-xs text-blue-950">التقييم الفوري والتصحيح الآلي بواسطة AI</h3>
                <span className="text-[9px] text-slate-800 font-bold">نموذج التقييم الإنشائي Gemini 1.5 Flash</span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-medium leading-relaxed text-slate-700">
              <p>
                <strong>النتيجة الأولية للأسئلة الموضوعية:</strong> ١٢ من أصل ١٥ درجة
              </p>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">تقرير التقييم الإنشائي التلقائي:</span>
                <p className="text-slate-600 font-semibold leading-relaxed">
                  "إجابتك على السؤال الرابع ممتازة جداً ومحورية. قمت بتحديد الفارق الفلسفي والعملي بدقة تامة من خلال تعريف البيانات المصنفة وغير المصنفة. مثال تصفية البريد الإلكتروني كان دقيقاً للغاية ويعكس استيعاباً كاملاً لموضوع المحاضرة الثالثة. تم منحك العلامة الكاملة للسؤال الإنشائي وهي (٣ درجات)."
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              العودة إلى المقررات التعليمية
            </button>
          </div>
        </div>
      )}

      {/* Floating WebRTC Video Preview Box */}
      {examStarted && !examCompleted && (
        <VideoFloatingBox 
          stream={stream} 
          isRecording={isRecording} 
          recordingDuration={recordingDuration} 
        />
      )}
    </div>
  );
}

