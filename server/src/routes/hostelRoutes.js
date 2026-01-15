import express from "express";
import {
  getAllHostels,
  getHostelById,
  deleteHostel,
} from "../controllers/hostelController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", getAllHostels);
router.get("/:id", getHostelById);
router.delete("/:id", protect, adminOnly, deleteHostel);

export default router;
