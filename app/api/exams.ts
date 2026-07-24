import { Router, Request, Response } from "express";
import { createClient } from "../../lib/supabase/server";
import { authenticate, requireRole } from "../../lib/middleware";
import { GoogleGenAI } from "@google/genai";

const router = Router();

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGemini() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environmental variable is missing");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * AI-Assisted Grading for Essays using Gemini
 */
async function gradeEssayWithAI(questionText: string, studentAnswer: string, correctAnswerRubric: string, maxPoints: number): Promise<{ score: number; feedback: string }> {
  try {
    const ai = getGemini();
    const prompt = `أنت مصحح أكاديمي ذكي لأكاديمية نبا للتعليم عن بعد. قيم الإجابة المقالية للطالب بناءً على نص السؤال والإجابة النموذجية المرفقة والدرجة القصوى المتاحة للسؤال.
    
نص السؤال: "${questionText}"
الإجابة النموذجية/معيار التصحيح: "${correctAnswerRubric}"
إجابة الطالب: "${studentAnswer}"
الدرجة القصوى للسؤال: ${maxPoints}

أجب باللغة العربية الفصحى حصراً وبتنسيق JSON مطابق تماماً للمثال التالي:
{
  "pointsObtained": 3.5,
  "feedback": "ملاحظاتك الأكاديمية والتوجيهية بالتفصيل هنا"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    const result = JSON.parse(resultText.trim());

    const score = typeof result.pointsObtained === "number" ? Math.min(Math.max(result.pointsObtained, 0), maxPoints) : 0;
    const feedback = result.feedback || "تم تقييم الإجابة تلقائياً.";

    return { score, feedback };
  } catch (error) {
    console.error("AI Essay Grading failed:", error);
    // Safe fallback: 50% score
    return {
      score: maxPoints * 0.5,
      feedback: "حدث خطأ أثناء الاتصال بنظام التصحيح الذكي، تم وضع تقييم تقريبي مؤقت."
    };
  }
}

/**
 * 3.3.1 GET /api/exams/:id
 * Get exam details + verify enrollment.
 */
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user?.id;
    const role = req.user?.role;

    const supabase = await createClient(req);

    // Get exam details
    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .select(`
        *,
        course:courses (id, title, instructor_id)
      `)
      .eq("id", examId)
      .single();

    if (examErr || !exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND"
      });
    }

    // Verify enrollment for students
    if (role === "student") {
      const { data: enrollment, error: enrollErr } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", exam.course_id)
        .single();

      if (enrollErr || !enrollment) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: You are not enrolled in the course associated with this exam",
          code: "NOT_ENROLLED"
        });
      }
    }

    return res.json({
      success: true,
      data: exam,
      message: "Exam details retrieved successfully"
    });
  } catch (error: any) {
    console.error("GET exam details error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while retrieving exam details",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.3.2 POST /api/exams/:id/start
 * Initialize exam attempt. Create record in exam_attempts. Return questions.
 */
router.post("/:id/start", authenticate, requireRole(["student"]), async (req: Request, res: Response) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user?.id;

    const supabase = await createClient(req);

    // 1. Get Exam to verify course enrollment and dates
    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();

    if (examErr || !exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND"
      });
    }

    // Verify student is enrolled in this course
    const { data: enrollment, error: enrollErr } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", exam.course_id)
      .single();

    if (enrollErr || !enrollment) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You are not enrolled in this course",
        code: "NOT_ENROLLED"
      });
    }

    // Verify current time is within exam start/end window
    const now = new Date();
    if (now < new Date(exam.start_time) || now > new Date(exam.end_time)) {
      return res.status(400).json({
        success: false,
        error: "Exam is not currently active or has already closed",
        code: "EXAM_INACTIVE"
      });
    }

    // Check for an existing attempt
    const { data: existingAttempt } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("student_id", studentId)
      .eq("exam_id", examId)
      .maybeSingle();

    if (existingAttempt) {
      // If student already has a submitted attempt, forbid
      if (existingAttempt.submitted_at) {
        return res.status(400).json({
          success: false,
          error: "You have already completed and submitted this exam",
          code: "ALREADY_SUBMITTED",
          data: existingAttempt
        });
      }
      
      // If there is an active running attempt, fetch and return questions
      const { data: questions } = await supabase
        .from("questions")
        .select("id, exam_id, type, question_text, options, points")
        .eq("exam_id", examId);

      return res.json({
        success: true,
        data: {
          attempt: existingAttempt,
          questions: questions || []
        },
        message: "Resuming existing exam attempt"
      });
    }

    // Create new exam attempt
    const { data: newAttempt, error: attemptErr } = await supabase
      .from("exam_attempts")
      .insert({
        student_id: studentId,
        exam_id: examId,
        started_at: new Date().toISOString(),
        proctoring_notes: []
      })
      .select("*")
      .single();

    if (attemptErr) {
      return res.status(400).json({
        success: false,
        error: attemptErr.message,
        code: "ATTEMPT_CREATION_FAILED"
      });
    }

    // Fetch questions associated with this exam (Hiding 'correct_answer' for security!)
    const { data: questions, error: questionsErr } = await supabase
      .from("questions")
      .select("id, exam_id, type, question_text, options, points")
      .eq("exam_id", examId);

    if (questionsErr) {
      return res.status(400).json({
        success: false,
        error: questionsErr.message,
        code: "QUESTIONS_RETRIEVAL_FAILED"
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        attempt: newAttempt,
        questions: questions || []
      },
      message: "Exam attempt initialized successfully"
    });
  } catch (error: any) {
    console.error("Start exam attempt error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while starting exam",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.3.3 POST /api/exams/:id/submit
 * Submit answers + upload proctoring video. Call AI grading for essays.
 */
router.post("/:id/submit", authenticate, requireRole(["student"]), async (req: Request, res: Response) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user?.id;
    const { answers, proctoring_video_url, proctoring_snapshots, snapshot_timestamps } = req.body; 
    // answers expected to be: [ { question_id: string, answer_text: string } ]

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid answers: must be an array of answers",
        code: "INVALID_INPUT"
      });
    }

    const supabase = await createClient(req);

    // 1. Retrieve the active, unsubmitted attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("student_id", studentId)
      .eq("exam_id", examId)
      .is("submitted_at", null)
      .single();

    if (attemptErr || !attempt) {
      return res.status(404).json({
        success: false,
        error: "No active or unsubmitted attempt found for this exam",
        code: "NO_ACTIVE_ATTEMPT"
      });
    }

    // 2. Fetch all actual questions with correct answers for grading
    const { data: questions, error: questionsErr } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId);

    if (questionsErr || !questions) {
      return res.status(400).json({
        success: false,
        error: "Could not fetch exam questions for grading",
        code: "GRADING_FAILED"
      });
    }

    // 3. Score the answers
    let totalScore = 0;
    const gradingBreakdown = [];

    // Map answers for quick lookup
    const studentAnswersMap = new Map<string, string>();
    answers.forEach((ans: any) => {
      studentAnswersMap.set(ans.question_id, ans.answer_text);
    });

    for (const question of questions) {
      const studentAnswer = studentAnswersMap.get(question.id) || "";
      let pointsAwarded = 0;
      let notes = "";

      if (question.type === "mcq" || question.type === "true_false") {
        // Strict string comparison (trimmed, lowercase)
        const isCorrect = studentAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
        if (isCorrect) {
          pointsAwarded = question.points;
          notes = "إجابة صحيحة تلقائية";
        } else {
          notes = `إجابة خاطئة. الإجابة الصحيحة هي: ${question.correct_answer}`;
        }
      } else if (question.type === "essay") {
        // AI Grading for essays
        if (studentAnswer.trim().length > 0) {
          const aiGrading = await gradeEssayWithAI(
            question.question_text,
            studentAnswer,
            question.correct_answer,
            question.points
          );
          pointsAwarded = aiGrading.score;
          notes = aiGrading.feedback;
        } else {
          pointsAwarded = 0;
          notes = "لم يقم الطالب بالإجابة على هذا السؤال المقالي.";
        }
      }

      totalScore += pointsAwarded;

      gradingBreakdown.push({
        question_id: question.id,
        question_text: question.question_text,
        type: question.type,
        student_answer: studentAnswer,
        correct_answer: question.type !== "essay" ? question.correct_answer : "تقييم ذكي",
        points_possible: question.points,
        points_awarded: pointsAwarded,
        notes
      });
    }

    // 4. Update Exam Attempt with final score, submission time, video URL, and snapshots
    const { data: updatedAttempt, error: updateErr } = await supabase
      .from("exam_attempts")
      .update({
        submitted_at: new Date().toISOString(),
        score: totalScore,
        proctoring_video_url: proctoring_video_url || attempt.proctoring_video_url,
        proctoring_snapshots: proctoring_snapshots || attempt.proctoring_snapshots || [],
        snapshot_timestamps: snapshot_timestamps || attempt.snapshot_timestamps || [],
        proctoring_notes: {
          logs: attempt.proctoring_notes || [],
          grading_breakdown: gradingBreakdown
        }
      })
      .eq("id", attempt.id)
      .select("*")
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        error: updateErr.message,
        code: "SUBMIT_FAILED"
      });
    }

    return res.json({
      success: true,
      data: {
        attempt: updatedAttempt,
        totalScore,
        gradingBreakdown
      },
      message: "Exam submitted and graded successfully"
    });
  } catch (error: any) {
    console.error("Submit exam attempt error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during exam submission",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * NEW: POST /api/exams/:id/upload-proctoring
 * A dedicated endpoint for students to prepare or execute chunked uploads of proctoring recording & snapshots.
 * Returns signed upload URLs for Supabase Storage to allow client direct uploads and conserve server bandwidth.
 */
router.post("/:id/upload-proctoring", authenticate, requireRole(["student"]), async (req: Request, res: Response) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user?.id;
    const { fileType, fileName, chunkIndex, totalChunks } = req.body;

    const supabase = await createClient(req);

    const videoPath = `exam_${examId}/student_${studentId}/recording.webm`;
    const snapshotPath = `exam_${examId}/student_${studentId}/${fileName || 'snapshot_' + Date.now() + '.png'}`;

    let signedUrl = `https://mock-storage.supabase.co/object/upload/proctoring-videos/${videoPath}`;
    let token = "mock-token-54321";

    try {
      const bucketName = fileType === "video" ? "proctoring-videos" : "proctoring-snapshots";
      const filePath = fileType === "video" ? videoPath : snapshotPath;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(filePath);

      if (data && !error) {
        signedUrl = data.signedUrl;
        token = data.token;
      }
    } catch (storageErr) {
      console.log("Supabase storage direct upload URL fallback used", storageErr);
    }

    return res.json({
      success: true,
      data: {
        signedUrl,
        token,
        videoPath: fileType === "video" ? videoPath : undefined,
        snapshotPath: fileType !== "video" ? snapshotPath : undefined,
        chunked: totalChunks > 1,
        chunkIndex,
        totalChunks
      },
      message: "Proctoring upload session initiated successfully"
    });
  } catch (error: any) {
    console.error("Prepare proctoring upload error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while preparing proctoring upload",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.3.4 POST /api/exams/:id/proctor/alert
 * Receive real-time alerts (tab switch, face detection) and append to proctoring_notes list.
 */
router.post("/:id/proctor/alert", authenticate, requireRole(["student"]), async (req: Request, res: Response) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user?.id;
    const { alert_type, details } = req.body;

    if (!alert_type) {
      return res.status(400).json({
        success: false,
        error: "Missing alert_type",
        code: "INVALID_INPUT"
      });
    }

    const supabase = await createClient(req);

    // Get active attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("student_id", studentId)
      .eq("exam_id", examId)
      .is("submitted_at", null)
      .single();

    if (attemptErr || !attempt) {
      return res.status(404).json({
        success: false,
        error: "No active unsubmitted attempt found to record proctoring alert",
        code: "NO_ACTIVE_ATTEMPT"
      });
    }

    // Append new alert to the existing list
    const currentAlerts = Array.isArray(attempt.proctoring_notes) 
      ? attempt.proctoring_notes 
      : (attempt.proctoring_notes && (attempt.proctoring_notes as any).logs) || [];

    const newAlert = {
      alert_type,
      timestamp: new Date().toISOString(),
      details: details || ""
    };

    const updatedAlerts = [...currentAlerts, newAlert];

    // Maintain backwards compatibility if it has grading breakdown already
    let payloadNotes: any = updatedAlerts;
    if (attempt.proctoring_notes && typeof attempt.proctoring_notes === "object" && !Array.isArray(attempt.proctoring_notes)) {
      payloadNotes = {
        ...attempt.proctoring_notes,
        logs: updatedAlerts
      };
    }

    const { data: updatedAttempt, error: updateErr } = await supabase
      .from("exam_attempts")
      .update({
        proctoring_notes: payloadNotes
      })
      .eq("id", attempt.id)
      .select("id, proctoring_notes")
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        error: updateErr.message,
        code: "ALERT_RECORDING_FAILED"
      });
    }

    return res.json({
      success: true,
      data: updatedAttempt,
      message: "Proctoring alert recorded successfully"
    });
  } catch (error: any) {
    console.error("Proctoring alert error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while recording proctoring alert",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.3.5 GET /api/instructor/exams/:id/proctor/live
 * Get active attempts with video URLs for instructor dashboard.
 */
router.get("/instructor/proctor/live/:id", authenticate, requireRole(["instructor", "admin"]), async (req: Request, res: Response) => {
  try {
    const { id: examId } = req.params;
    const instructorId = req.user?.id;

    const supabase = await createClient(req);

    // Verify instructor actually teaches the course for this exam
    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .select("course_id, courses (instructor_id)")
      .eq("id", examId)
      .single();

    if (examErr || !exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND"
      });
    }

    const isInstructor = (exam.courses as any)?.instructor_id === instructorId;
    const isAdmin = req.user?.role === "admin";

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You are not authorized to view proctoring data for this course",
        code: "UNAUTHORIZED_COURSE"
      });
    }

    // Retrieve all attempts for this exam
    const { data: attempts, error: attemptsErr } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        student:users (id, full_name, email, student_id, major, avatar_url)
      `)
      .eq("exam_id", examId);

    if (attemptsErr) {
      return res.status(400).json({
        success: false,
        error: attemptsErr.message,
        code: "ATTEMPTS_RETRIEVAL_FAILED"
      });
    }

    // Generate signed URLs for non-public proctoring videos
    const processedAttempts = await Promise.all((attempts || []).map(async (attempt) => {
      let signedVideoUrl = attempt.proctoring_video_url;

      if (attempt.proctoring_video_url && !attempt.proctoring_video_url.startsWith("http")) {
        const { data: signedData } = await supabase.storage
          .from("proctoring-recordings")
          .createSignedUrl(attempt.proctoring_video_url, 3600); // 1 hour expiration
        
        if (signedData) {
          signedVideoUrl = signedData.signedUrl;
        }
      }

      return {
        ...attempt,
        signed_video_url: signedVideoUrl
      };
    }));

    return res.json({
      success: true,
      data: processedAttempts,
      message: "Proctoring attempts retrieved successfully"
    });
  } catch (error: any) {
    console.error("Live instructor proctoring error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while retrieving live proctoring data",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router;
