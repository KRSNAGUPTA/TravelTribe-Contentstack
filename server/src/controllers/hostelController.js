import Hostel from "../model/HostelModel.js";
import cmsClient from "../contentstackClient.js";

export const getAllHostels = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const { q, college, location, price } = req.query;

    // Fetch entries from Contentstack CMS
    const env = process.env.CS_DEV_ENV || "dev";
    let cmsHostels = [];
    try {
      const response = await cmsClient.get(
        `/content_types/hostel/entries?environment=${env}`
      );
      cmsHostels = response.data.entries || [];
    } catch (cmsErr) {
      console.error("Error fetching hostels from Contentstack:", cmsErr.message);
    }

    // Fetch MongoDB records for availability status
    // let mongoHostels = [];
    // try {
    //   mongoHostels = await Hostel.find();
    // } catch (dbErr) {
    //   console.error("Error fetching hostels from MongoDB:", dbErr.message);
    // }

    // const mongoMap = new Map();
    // mongoHostels.forEach((h) => mongoMap.set(h.hostelId, h));

    // Combine CMS data with MongoDB availability
    // let processed = cmsHostels.map((cmsItem) => {
    //   const mongoItem = mongoMap.get(cmsItem.uid);
    //   const backendRooms = mongoItem?.room_types || [];
    //   const hasAvailableRooms = mongoItem
    //     ? backendRooms.some((r) => r.available_beds > 0)
    //     : true;

    //   return {
    //     ...cmsItem,
    //     isAvailable: hasAvailableRooms,
    //     mongoData: mongoItem || null,
    //   };
    // });
  let processed = cmsHostels;
    // 1. Search Query filter (title & address)
    if (q && q.trim()) {
      const queryStr = q.trim().toLowerCase();
      processed = processed.filter(
        (item) =>
          item.title?.toLowerCase().includes(queryStr) ||
          item.address?.toLowerCase().includes(queryStr)
      );
    }

    // 2. College filter
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

    // 3. Location filter
    if (location && location !== "all") {
      const targetLoc = location.toLowerCase();
      processed = processed.filter((item) =>
        item.address?.toLowerCase().includes(targetLoc)
      );
    }

    // 4. Max Price filter
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

    // 5. Server-side Pagination
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
      return res.status(400).json({
        message: "Id not provided",
      });
    }
    let hostel = await Hostel.findOne({
      hostelId: id,
    });
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
      return res.status(400).json({
        message: "Id not provided",
      });
    }

    await Hostel.findOneAndDelete({
      hostelId: id,
    });
    res.status(200).json({ message: "Hostel deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

