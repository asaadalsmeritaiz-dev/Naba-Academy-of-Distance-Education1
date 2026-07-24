import { Router, Request, Response } from "express";
import { createClient } from "../../lib/supabase/server";
import { authenticate, requireRole } from "../../lib/middleware";

const router = Router();

/**
 * 3.2.1 GET /api/courses
 * List all courses (filter by term, instructor). Include enrollment status.
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { term_id, instructor_id } = req.query;
    const studentId = req.user?.id;

    const supabase = await createClient(req);

    // Build the query
    let query = supabase
      .from("courses")
      .select(`
        *,
        instructor:users!instructor_id (id, full_name, email, avatar_url, major)
      `);

    if (term_id) {
      query = query.eq("term_id", term_id as string);
    }
    if (instructor_id) {
      query = query.eq("instructor_id", instructor_id as string);
    }

    const { data: courses, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "DATABASE_ERROR"
      });
    }

    // Include enrollment status for the current student
    let enrolledCourseIds: Set<string> = new Set();
    if (studentId) {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", studentId);
      
      if (enrollments) {
        enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
      }
    }

    const coursesWithEnrollment = courses.map((course) => ({
      ...course,
      isEnrolled: enrolledCourseIds.has(course.id)
    }));

    return res.json({
      success: true,
      data: coursesWithEnrollment,
      message: "Courses retrieved successfully"
    });
  } catch (error: any) {
    console.error("GET courses error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while retrieving courses",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.2.2 GET /api/courses/:id
 * Get course details with instructor info.
 */
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = await createClient(req);

    const { data: course, error } = await supabase
      .from("courses")
      .select(`
        *,
        instructor:users!instructor_id (id, full_name, email, avatar_url, major)
      `)
      .eq("id", id)
      .single();

    if (error || !course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
        code: "COURSE_NOT_FOUND"
      });
    }

    return res.json({
      success: true,
      data: course,
      message: "Course details retrieved successfully"
    });
  } catch (error: any) {
    console.error("GET course details error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while retrieving course details",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.2.3 POST /api/courses/:id/enroll
 * Enroll current student in course.
 */
router.post("/:id/enroll", authenticate, requireRole(["student"]), async (req: Request, res: Response) => {
  try {
    const { id: courseId } = req.params;
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED"
      });
    }

    const supabase = await createClient(req);

    // Verify course exists
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (courseErr || !course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
        code: "COURSE_NOT_FOUND"
      });
    }

    // Insert enrollment
    const { data: enrollment, error: enrollErr } = await supabase
      .from("enrollments")
      .insert({
        student_id: studentId,
        course_id: courseId,
        progress: 0
      })
      .select("*")
      .single();

    if (enrollErr) {
      if (enrollErr.code === "23505") { // Unique violation
        return res.status(400).json({
          success: false,
          error: "You are already enrolled in this course",
          code: "ALREADY_ENROLLED"
        });
      }
      return res.status(400).json({
        success: false,
        error: enrollErr.message,
        code: "ENROLL_ERROR"
      });
    }

    return res.status(201).json({
      success: true,
      data: enrollment,
      message: "Successfully enrolled in the course"
    });
  } catch (error: any) {
    console.error("Course enrollment error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during course enrollment",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.2.4 GET /api/courses/:id/lectures
 * Fetch all lectures for a course.
 */
router.get("/:id/lectures", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: courseId } = req.params;
    const supabase = await createClient(req);

    const { data: lectures, error } = await supabase
      .from("lectures")
      .select("*")
      .eq("course_id", courseId)
      .order("order", { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "DATABASE_ERROR"
      });
    }

    return res.json({
      success: true,
      data: lectures,
      message: "Lectures retrieved successfully"
    });
  } catch (error: any) {
    console.error("GET course lectures error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while retrieving lectures",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router;
