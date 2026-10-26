import Hostel from "../models/HostelModel.js";
import Booking from "../models/BookingModel.js";
import cmsClient from "../contentstackClient.js";

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"];

export const getAllHostels = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const { q, college, location, price } = req.query;

    let processed = [];
    try {
      const response = await cmsClient.get("/content_types/hostel/entries", {
        params: { environment: process.env.CS_DEV_ENV || "dev" },
      });
      processed = response.data.entries || [];
    } catch (cmsErr) {
      console.error(
        "Error fetching hostels from Contentstack:",
        cmsErr.response?.status,
        cmsErr.response?.data || cmsErr.message
      );
      return res
        .status(502)
        .json({ message: "Failed to fetch hostels from Contentstack" });
    }

    if (q && q.trim()) {
      const queryStr = q.trim().toLowerCase();
      processed = processed.filter(
        (item) =>
          item.title?.toLowerCase().includes(queryStr) ||
          item.address?.toLowerCase().includes(queryStr)
      );
    }

    if (college && college !== "all") {
      const targetCollege = college.toLowerCase();
      processed = processed.filter(
        (item) =>
          Array.isArray(item.nearby_college) &&
          item.nearby_college.some(
            (c) =>
              c.toLowerCase().includes(targetCollege) ||
              targetCollege.includes(c.toLowerCase())
          )
      );
    }

    if (location && location !== "all") {
      const targetLoc = location.toLowerCase();
      processed = processed.filter((item) =>
        item.address?.toLowerCase().includes(targetLoc)
      );
    }

    if (price && price !== "none") {
      const maxPriceLimit = Number(price);
      if (Number.isFinite(maxPriceLimit)) {
        processed = processed.filter((item) => {
          const roomPrices = Array.isArray(item.room_types)
            ? item.room_types
                .map((r) => Number(r.base_price))
                .filter((p) => Number.isFinite(p) && p > 0)
            : [];
          const minPrice =
            roomPrices.length > 0
              ? Math.min(...roomPrices)
              : Number(item.base_price) || 0;
          return minPrice <= maxPriceLimit;
        });
      }
    }

    const total = processed.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * limit;
    const paginatedData = processed.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      data: paginatedData,
      pagination: {
        total,
        page: currentPage,
        limit,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Error in getAllHostels controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getHostelById = async (req, res) => {
  try {
    const id = req?.params?.id;
    if (!id) {
      return res.status(400).json({ message: "Id not provided" });
    }
    const hostel = await Hostel.findOne({ hostelId: id });
    if (!hostel) {
      return res.status(200).json({
        hostelId: id,
        reviews: [],
        room_types: [],
      });
    }
    res.status(200).json(hostel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHostel = async (req, res) => {
  try {
    const id = req?.params?.id;
    if (!id) {
      return res.status(400).json({ message: "Id not provided" });
    }

    const activeBookings = await Booking.countDocuments({
      hostelId: id,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    });

    if (activeBookings > 0) {
      return res.status(409).json({
        message: `Cannot delete: ${activeBookings} active booking${
          activeBookings === 1 ? "" : "s"
        } exist for this hostel`,
      });
    }

    const result = await Hostel.findOneAndDelete({ hostelId: id });
    if (!result) {
      return res.status(404).json({
        message: "Hostel not initialized in Mongo (nothing to delete)",
      });
    }

    return res.status(200).json({ message: "Hostel deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};