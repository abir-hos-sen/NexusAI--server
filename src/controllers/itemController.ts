import { Request, Response } from "express";
import { Item, Review, User } from "../models";
import { AuthRequest } from "../middleware/auth";

export const itemController = {
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "12",
        category,
        minPrice,
        maxPrice,
        rating,
        sort = "createdAt",
        order = "desc",
        search,
        featured,
      } = req.query;

      const filter: any = { status: "active" };

      if (category) filter.category = category;
      if (featured === "true") filter.featured = true;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      if (rating) filter.rating = { $gte: Number(rating) };
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ];
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const sortObj: any = {};
      sortObj[sort as string] = order === "desc" ? -1 : 1;

      const [items, total] = await Promise.all([
        Item.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
        Item.countDocuments(filter),
      ]);

      res.json({
        success: true,
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const item = await Item.findById(req.params.id).populate("seller", "name avatar").lean();
      if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }

      const reviews = await Review.find({ itemId: item._id })
        .populate("userId", "name avatar")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const relatedItems = await Item.find({
        category: item.category,
        _id: { $ne: item._id },
        status: "active",
      })
        .limit(4)
        .lean();

      res.json({ success: true, item, reviews, relatedItems });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getBySlug(req: Request, res: Response) {
    try {
      const item = await Item.findOne({ slug: req.params.slug, status: "active" })
        .populate("seller", "name avatar")
        .lean();
      if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }

      const reviews = await Review.find({ itemId: item._id })
        .populate("userId", "name avatar")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      res.json({ success: true, item, reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { title, description, fullDescription, price, originalPrice, category, tags, images, thumbnail, metaInfo, specifications } = req.body;

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

      const item = await Item.create({
        title,
        slug,
        description,
        fullDescription: fullDescription || description,
        price,
        originalPrice,
        category,
        tags: tags || [],
        images: images || [],
        thumbnail: thumbnail || images?.[0] || "",
        seller: req.user?._id,
        metaInfo: metaInfo || {},
        specifications: specifications || [],
      });

      res.status(201).json({ success: true, item });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }

      if (item.seller.toString() !== req.user?._id && req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
      res.json({ success: true, item: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }

      if (item.seller.toString() !== req.user?._id && req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      await Item.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Item deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getMyItems(req: AuthRequest, res: Response) {
    try {
      const items = await Item.find({ seller: req.user?._id }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, items });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async addReview(req: AuthRequest, res: Response) {
    try {
      const { rating, comment } = req.body;
      const { id } = req.params;

      const existingReview = await Review.findOne({ userId: req.user?._id, itemId: id });
      if (existingReview) {
        return res.status(400).json({ success: false, message: "You already reviewed this item" });
      }

      const review = await Review.create({
        userId: req.user?._id,
        itemId: id,
        rating,
        comment,
      });

      // Update item rating
      const reviews = await Review.find({ itemId: id });
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await Item.findByIdAndUpdate(id, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      });

      res.status(201).json({ success: true, review });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
