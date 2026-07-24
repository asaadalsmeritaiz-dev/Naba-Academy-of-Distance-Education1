import { Router, Request, Response } from "express";
import { createClient } from "../../lib/supabase/server";
import { authenticate, requireRole } from "../../lib/middleware";

const router = Router();

/**
 * 3.2.5 GET /api/lectures/:id/watch
 * Get signed video URL from Supabase Storage + track progress.
 */
router.get("/:id/watch", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: lectureId } = req.params;
    const studentId = req.user?.id;

    const supabase = await createClient(req);

    // 1. Fetch lecture details
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .single();

    if (lectureError || !lecture) {
      return res.status(404).json({
        success: false,
        error: "Lecture not found",
        code: "LECTURE_NOT_FOUND"
      });
    }

    // 2. Generate signed URL for the video if it is stored in Supabase Storage
    let signedVideoUrl = lecture.video_url;
    
    // Check if video_url is a relative path or inside lecture-videos bucket
    if (lecture.video_url && !lecture.video_url.startsWith("http")) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from("lecture-videos")
        .createSignedUrl(lecture.video_url, 3600); // 1 hour expiry

      if (!signedError && signedData) {
        signedVideoUrl = signedData.signedUrl;
      }
    }

    // 3. Get student progress for this course
    let progress = 0;
    if (studentId) {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("progress")
        .eq("student_id", studentId)
        .eq("course_id", lecture.course_id)
        .single();
      
      if (enrollment) {
        progress = enrollment.progress;
      }
    }

    return res.json({
      success: true,
      data: {
        lecture,
        signedVideoUrl,
        progress
      },
      message: "Lecture loaded successfully"
    });
  } catch (error: any) {
    console.error("Lecture watch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while accessing lecture watch video",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.2.6 POST /api/lectures/:id/progress
 * Update student's progress percentage.
 */
router.post("/:id/progress", authenticate, requireRole(["student"]), async (req: Request, res: Response) => {
  try {
    const { id: lectureId } = req.params;
    const { progress } = req.body; // expected: number between 0 and 100
    const studentId = req.user?.id;

    if (progress === undefined || typeof progress !== "number" || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: "Invalid progress: must be a number between 0 and 100",
        code: "INVALID_INPUT"
      });
    }

    const supabase = await createClient(req);

    // Find the course ID for this lecture
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("course_id")
      .eq("id", lectureId)
      .single();

    if (lectureError || !lecture) {
      return res.status(404).json({
        success: false,
        error: "Lecture not found",
        code: "LECTURE_NOT_FOUND"
      });
    }

    // Update progress in enrollments
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .update({ progress })
      .eq("student_id", studentId)
      .eq("course_id", lecture.course_id)
      .select("*")
      .single();

    if (enrollError) {
      return res.status(400).json({
        success: false,
        error: enrollError.message,
        code: "UPDATE_ERROR"
      });
    }

    return res.json({
      success: true,
      data: enrollment,
      message: "Progress updated successfully"
    });
  } catch (error: any) {
    console.error("Progress update error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while updating progress",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router;
