import { Router, Request, Response } from "express";
import { createClient } from "../../lib/supabase/server";
import { authenticate, requireRole } from "../../lib/middleware";

const router = Router();

// Apply auth + instructor role protection to all routes in this router
router.use(authenticate, requireRole(["instructor", "admin"]));

/**
 * 3.6.1 GET /api/instructor/courses
 * Get courses taught by the logged-in instructor.
 */
router.get("/courses", async (req: Request, res: Response) => {
  try {
    const instructorId = req.user?.id;
    const supabase = await createClient(req);

    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        *,
        term:terms (id, name, is_active)
      `)
      .eq("instructor_id", instructorId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "DATABASE_ERROR"
      });
    }

    return res.json({
      success: true,
      data: courses,
      message: "Instructor courses retrieved successfully"
    });
  } catch (error: any) {
    console.error("GET instructor courses error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while retrieving instructor courses",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.6.2 POST /api/instructor/courses
 * Create a new course.
 */
router.post("/courses", async (req: Request, res: Response) => {
  try {
    const { term_id, title, description, credit_hours, thumbnail_url } = req.body;
    const instructorId = req.user?.id;

    if (!term_id || !title || !description || credit_hours === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: term_id, title, description, credit_hours",
        code: "INVALID_INPUT"
      });
    }

    const supabase = await createClient(req);

    const { data: course, error } = await supabase
      .from("courses")
      .insert({
        term_id,
        instructor_id: instructorId,
        title,
        description,
        credit_hours: parseInt(credit_hours, 10),
        thumbnail_url: thumbnail_url || null
      })
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "CREATE_COURSE_FAILED"
      });
    }

    return res.status(201).json({
      success: true,
      data: course,
      message: "Course created successfully"
    });
  } catch (error: any) {
    console.error("POST instructor course error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while creating course",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.6.3 PUT /api/instructor/courses/:id
 * Update course details.
 */
router.put("/courses/:id", async (req: Request, res: Response) => {
  try {
    const { id: courseId } = req.params;
    const { term_id, title, description, credit_hours, thumbnail_url } = req.body;
    const instructorId = req.user?.id;

    const supabase = await createClient(req);

    // Verify course belongs to this instructor (skip if admin)
    if (req.user?.role !== "admin") {
      const { data: courseCheck } = await supabase
        .from("courses")
        .select("instructor_id")
        .eq("id", courseId)
        .single();
      
      if (!courseCheck || courseCheck.instructor_id !== instructorId) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: You are not the instructor of this course",
          code: "UNAUTHORIZED_COURSE"
        });
      }
    }

    // Build update object
    const updatePayload: any = {};
    if (term_id !== undefined) updatePayload.term_id = term_id;
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (credit_hours !== undefined) updatePayload.credit_hours = parseInt(credit_hours, 10);
    if (thumbnail_url !== undefined) updatePayload.thumbnail_url = thumbnail_url;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields provided to update",
        code: "INVALID_INPUT"
      });
    }

    const { data: updatedCourse, error } = await supabase
      .from("courses")
      .update(updatePayload)
      .eq("id", courseId)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "UPDATE_COURSE_FAILED"
      });
    }

    return res.json({
      success: true,
      data: updatedCourse,
      message: "Course updated successfully"
    });
  } catch (error: any) {
    console.error("PUT instructor course error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while updating course",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.6.4 POST /api/instructor/courses/:id/lectures
 * Add/Upload a lecture (creates a DB record linking the video URL).
 */
router.post("/courses/:id/lectures", async (req: Request, res: Response) => {
  try {
    const { id: courseId } = req.params;
    const { title, video_url, transcript, duration, order } = req.body;
    const instructorId = req.user?.id;

    if (!title || !video_url || duration === undefined || order === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, video_url, duration, order",
        code: "INVALID_INPUT"
      });
    }

    const supabase = await createClient(req);

    // Verify course belongs to this instructor (skip if admin)
    if (req.user?.role !== "admin") {
      const { data: courseCheck } = await supabase
        .from("courses")
        .select("instructor_id")
        .eq("id", courseId)
        .single();
      
      if (!courseCheck || courseCheck.instructor_id !== instructorId) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: You are not authorized to add lectures to this course",
          code: "UNAUTHORIZED_COURSE"
        });
      }
    }

    const { data: lecture, error } = await supabase
      .from("lectures")
      .insert({
        course_id: courseId,
        title,
        video_url,
        transcript: transcript || null,
        duration: parseInt(duration, 10),
        order: parseInt(order, 10)
      })
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "CREATE_LECTURE_FAILED"
      });
    }

    return res.status(201).json({
      success: true,
      data: lecture,
      message: "Lecture added successfully"
    });
  } catch (error: any) {
    console.error("POST lecture error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while creating lecture",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.6.5 PUT /api/instructor/exams/:id/questions
 * Bulk insert/update exam questions.
 */
router.put("/exams/:id/questions", async (req: Request, res: Response) => {
  try {
    const { id: examId } = req.params;
    const { questions } = req.body; 
    // Expects questions: Array of { type, question_text, options, correct_answer, points }
    const instructorId = req.user?.id;

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: "questions must be an array of questions",
        code: "INVALID_INPUT"
      });
    }

    const supabase = await createClient(req);

    // Verify instructor owns the exam
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
        error: "Forbidden: You are not the instructor of the course associated with this exam",
        code: "UNAUTHORIZED_COURSE"
      });
    }

    // 1. Delete all existing questions for this exam
    const { error: deleteErr } = await supabase
      .from("questions")
      .delete()
      .eq("exam_id", examId);

    if (deleteErr) {
      return res.status(400).json({
        success: false,
        error: deleteErr.message,
        code: "DELETE_QUESTIONS_FAILED"
      });
    }

    // 2. Prepare questions with correct exam_id
    const preparedQuestions = questions.map((q: any) => ({
      exam_id: examId,
      type: q.type,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer,
      points: parseInt(q.points, 10) || 5
    }));

    if (preparedQuestions.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "All exam questions cleared successfully"
      });
    }

    // 3. Bulk insert the questions
    const { data: insertedQuestions, error: insertErr } = await supabase
      .from("questions")
      .insert(preparedQuestions)
      .select("*");

    if (insertErr) {
      return res.status(400).json({
        success: false,
        error: insertErr.message,
        code: "BULK_INSERT_FAILED"
      });
    }

    return res.json({
      success: true,
      data: insertedQuestions,
      message: "Exam questions updated in bulk successfully"
    });
  } catch (error: any) {
    console.error("Bulk questions update error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while bulk updating questions",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router;
