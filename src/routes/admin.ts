import { Router, Response } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { User, Item, Order, Review, Category } from "../models";

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// Dashboard stats
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalItems, totalOrders, totalRevenue, recentOrders, categoryStats] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate("userId", "name email").lean(),
      Item.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const activeItems = await Item.countDocuments({ status: "active" });
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const completedOrders = await Order.countDocuments({ status: "completed" });
    const avgOrderValue = totalOrders > 0 ? (totalRevenue[0]?.total || 0) / completedOrders : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalItems,
        activeItems,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        recentOrders,
        categoryStats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Users management
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const { page = "1", limit = "20", search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/users/:id/role", async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/users/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.id === req.user?._id) {
      return res.status(400).json({ success: false, message: "Cannot delete yourself" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Items management
router.get("/items", async (req: AuthRequest, res: Response) => {
  try {
    const { page = "1", limit = "20", search, status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const filter: any = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Item.find(filter).populate("seller", "name email").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Item.countDocuments(filter),
    ]);

    res.json({
      success: true,
      items,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/items/:id/status", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["active", "draft", "archived"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const item = await Item.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/items/:id", async (req: AuthRequest, res: Response) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Item deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Orders management
router.get("/orders", async (req: AuthRequest, res: Response) => {
  try {
    const { page = "1", limit = "20", status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const filter: any = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate("userId", "name email").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/orders/:id/status", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["pending", "completed", "failed", "refunded"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
