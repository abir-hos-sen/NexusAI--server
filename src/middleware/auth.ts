import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { User } from "../models";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      const user = await User.findById(decoded.userId).select("-password");

      if (user) {
        req.user = {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }
  } catch {
    // Continue without auth
  }
  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};
