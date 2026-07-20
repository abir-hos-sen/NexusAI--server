import { Router } from "express";
import { ContactMessage } from "../models";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({ success: true, message: "Message sent successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
