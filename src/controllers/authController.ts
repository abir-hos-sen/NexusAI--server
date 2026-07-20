import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models";
import { config } from "../config";
import { AuthRequest } from "../middleware/auth";

const googleClient = new OAuth2Client(config.googleClientId);

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, config.jwtSecret as any, { expiresIn: config.jwtExpiresIn } as any);
};

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id.toString());

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: "Registration successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
      }

      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const token = generateToken(user._id.toString());

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async googleLogin(req: Request, res: Response) {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ success: false, message: "Google credential is required" });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ success: false, message: "Invalid Google token" });
      }

      const { sub: googleId, email, name, picture } = payload;

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: name || "Google User",
          email,
          avatar: picture || "",
          password: googleId,
        });
      } else if (picture && !user.avatar) {
        user.avatar = picture;
        await user.save();
      }

      const token = generateToken(user._id.toString());

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: "Google login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async logout(req: Request, res: Response) {
    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
    res.json({ success: true, message: "Logged out successfully" });
  },

  async getMe(req: AuthRequest, res: Response) {
    try {
      const user = await User.findById(req.user?._id).select("-password").populate("savedItems");
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { name, bio, location, website, avatar, preferences } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        { name, bio, location, website, avatar, preferences },
        { new: true }
      ).select("-password");

      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async toggleSaveItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const user = await User.findById(req.user?._id);

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const index = user.savedItems.findIndex((id) => id.toString() === itemId);
      if (index > -1) {
        user.savedItems.splice(index, 1);
      } else {
        user.savedItems.push(new (require("mongoose").Types.ObjectId)(itemId));
      }

      await user.save();
      res.json({ success: true, savedItems: user.savedItems });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
