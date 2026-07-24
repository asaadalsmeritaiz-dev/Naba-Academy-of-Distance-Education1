import { Router, Request, Response } from "express";
import { createClient } from "../../lib/supabase/server";
import { authenticate } from "../../lib/middleware";

const router = Router();

// Require authenticated user for any storage upload operations
router.use(authenticate);

/**
 * 3.7.1 POST /api/upload/signed-url
 * Requests a signed upload URL for a specific bucket and file path.
 * This lets the client upload directly to Supabase Storage, offloading server bandwidth.
 */
router.post("/signed-url", async (req: Request, res: Response) => {
  try {
    const { bucketName, fileName } = req.body;

    if (!bucketName || !fileName) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: bucketName, fileName",
        code: "INVALID_INPUT"
      });
    }

    const allowedBuckets = ["lecture-videos", "proctoring-recordings", "assignments"];
    if (!allowedBuckets.includes(bucketName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid bucket: must be one of ${allowedBuckets.join(", ")}`,
        code: "INVALID_BUCKET"
      });
    }

    const supabase = await createClient(req);

    // Generate signed upload URL for the path
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(fileName);

    if (error || !data) {
      return res.status(400).json({
        success: false,
        error: error?.message || "Failed to create signed upload URL",
        code: "STORAGE_ERROR"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        token: (data as any).token, // Supabase signed upload token (if returned)
        path: data.path,
        bucket: bucketName
      },
      message: "Signed upload URL generated successfully"
    });
  } catch (error: any) {
    console.error("Signed upload URL generation error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while generating upload URL",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router;
