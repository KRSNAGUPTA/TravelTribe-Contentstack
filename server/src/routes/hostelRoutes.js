import express from "express";
import {
  getAllHostels,
  getHostelById,
  deleteHostel,
} from "../controllers/hostelController.js";
import {
  getReviews,
  addReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/", getAllHostels);
router.get("/:id", getHostelById);
router.delete("/:id", protect, adminOnly, deleteHostel);

// Reviews
router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", protect, addReview);
router.delete("/:id/reviews/:reviewId", protect, deleteReview);

export default router;

