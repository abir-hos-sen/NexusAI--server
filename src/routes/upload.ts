import { Router, Response } from "express";
import multer from "multer";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Use memory storage (works on Vercel serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, GIF, WebP) are allowed"));
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Upload single image (returns base64 data URI)
router.post("/image", authenticate, upload.single("image"), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    res.json({
      success: true,
      imageUrl: dataUri,
      filename: req.file.originalname,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload multiple images (returns base64 data URIs)
router.post("/images", authenticate, upload.array("images", 10), (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const imageUrls = files.map((file) => ({
      url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      filename: file.originalname,
      originalName: file.originalname,
      size: file.size,
    }));

    res.json({
      success: true,
      images: imageUrls,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
