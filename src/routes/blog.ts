import { Router } from "express";
import { BlogPost } from "../models";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, posts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug }).lean();
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
