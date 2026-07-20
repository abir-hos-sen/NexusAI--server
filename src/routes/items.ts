import { Router } from "express";
import { itemController } from "../controllers/itemController";
import { authenticate, optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/", itemController.getAll);
router.get("/my-items", authenticate, itemController.getMyItems);
router.get("/:id", itemController.getById);
router.get("/slug/:slug", itemController.getBySlug);
router.post("/", authenticate, itemController.create);
router.put("/:id", authenticate, itemController.update);
router.delete("/:id", authenticate, itemController.delete);
router.post("/:id/reviews", authenticate, itemController.addReview);

export default router;
