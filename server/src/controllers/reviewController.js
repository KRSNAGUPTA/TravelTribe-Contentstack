import Hostel from "../model/HostelModel.js";
import Booking from "../model/BookingModel.js";

// ─── GET /api/hostel/:id/reviews ─────────────────────────────────────────────

export const getReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const hostel = await Hostel.findOne({ hostelId: id });
    if (!hostel) {
      return res.status(200).json({ reviews: [], avgRating: 0, count: 0 });
    }

    const reviews = [...hostel.reviews].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const avgRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) *
              10
          ) / 10
        : 0;

    return res.status(200).json({
      reviews,
      avgRating,
      count: reviews.length,
    });
  } catch (err) {
    console.error("getReviews error:", err);
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// ─── POST /api/hostel/:id/reviews ────────────────────────────────────────────

export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // ── Validate input ────────────────────────────────────────────────────
    const rating = Number(req.body.rating);
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res
        .status(400)
        .json({ message: "Rating must be a whole number between 1 and 5" });
    }

    const comment = (req.body.comment || "").toString().trim();
    if (!comment || comment.length < 5) {
      return res
        .status(400)
        .json({ message: "Comment must be at least 5 characters" });
    }
    if (comment.length > 1000) {
      return res
        .status(400)
        .json({ message: "Comment must be 1000 characters or fewer" });
    }

    // ── Must have a confirmed booking ─────────────────────────────────────
    const confirmedBooking = await Booking.findOne({
      user: userId,
      hostelId: id,
      status: "confirmed",
    });

    if (!confirmedBooking) {
      return res.status(403).json({
        message:
          "You can only review a hostel after completing a confirmed booking",
      });
    }

    // ── Find hostel doc ───────────────────────────────────────────────────
    const hostel = await Hostel.findOne({ hostelId: id });
    if (!hostel) {
      return res
        .status(404)
        .json({ message: "Hostel not found in the database" });
    }

    // ── One review per user ───────────────────────────────────────────────
    const alreadyReviewed = hostel.reviews.some(
      (r) => r.user.toString() === userId.toString()
    );
    if (alreadyReviewed) {
      return res
        .status(409)
        .json({ message: "You have already reviewed this hostel" });
    }

    // ── Push review ───────────────────────────────────────────────────────
    hostel.reviews.push({
      user: userId,
      name: req.user.name || "Anonymous",
      img: req.user.avatar || null,
      rating,
      comment,
      createdAt: new Date(),
    });

    await hostel.save();

    const saved = hostel.reviews[hostel.reviews.length - 1];
    return res.status(201).json({ message: "Review added", review: saved });
  } catch (err) {
    console.error("addReview error:", err);
    return res.status(500).json({ message: "Failed to add review" });
  }
};

// ─── DELETE /api/hostel/:id/reviews/:reviewId ────────────────────────────────

export const deleteReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    const hostel = await Hostel.findOne({ hostelId: id });
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const review = hostel.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Only author or admin can delete
    if (!isAdmin && review.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorised to delete this review" });
    }

    review.deleteOne();
    await hostel.save();

    return res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    console.error("deleteReview error:", err);
    return res.status(500).json({ message: "Failed to delete review" });
  }
};
