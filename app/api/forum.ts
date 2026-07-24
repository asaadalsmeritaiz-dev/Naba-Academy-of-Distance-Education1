import { Router, Request, Response } from "express";
import { createClient } from "../../lib/supabase/server";
import { authenticate } from "../../lib/middleware";

const router = Router();

/**
 * 3.4.1 GET /api/courses/:id/forum/posts
 * Retrieve all posts for a course with all nested replies and user profiles.
 */
router.get("/courses/:id/posts", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: courseId } = req.params;
    const supabase = await createClient(req);

    // Fetch posts, nested replies, and creator profiles in one query
    const { data: posts, error } = await supabase
      .from("forum_posts")
      .select(`
        *,
        student:users!student_id (id, full_name, email, avatar_url, role),
        replies:forum_replies (
          *,
          student:users!student_id (id, full_name, email, avatar_url, role)
        )
      `)
      .eq("course_id", courseId)
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
      data: posts,
      message: "Forum posts and replies retrieved successfully"
    });
  } catch (error: any) {
    console.error("GET forum posts error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while retrieving forum posts",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.4.2 POST /api/courses/:id/forum/posts
 * Create a new post in the course forum.
 */
router.post("/courses/:id/posts", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: courseId } = req.params;
    const { title, content } = req.body;
    const studentId = req.user?.id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, content",
        code: "INVALID_INPUT"
      });
    }

    const supabase = await createClient(req);

    const { data: post, error } = await supabase
      .from("forum_posts")
      .insert({
        course_id: courseId,
        student_id: studentId,
        title,
        content
      })
      .select(`
        *,
        student:users!student_id (id, full_name, email, avatar_url, role)
      `)
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "CREATE_POST_FAILED"
      });
    }

    return res.status(201).json({
      success: true,
      data: post,
      message: "Forum post created successfully"
    });
  } catch (error: any) {
    console.error("POST forum post error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while creating forum post",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * 3.4.3 POST /api/forum/posts/:id/replies
 * Reply to an existing forum post.
 */
router.post("/posts/:id/replies", authenticate, async (req: Request, res: Response) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;
    const studentId = req.user?.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Reply content is required",
        code: "INVALID_INPUT"
      });
    }

    const supabase = await createClient(req);

    const { data: reply, error } = await supabase
      .from("forum_replies")
      .insert({
        post_id: postId,
        student_id: studentId,
        content
      })
      .select(`
        *,
        student:users!student_id (id, full_name, email, avatar_url, role)
      `)
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "CREATE_REPLY_FAILED"
      });
    }

    return res.status(201).json({
      success: true,
      data: reply,
      message: "Reply posted successfully"
    });
  } catch (error: any) {
    console.error("POST forum reply error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while posting reply",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router;
