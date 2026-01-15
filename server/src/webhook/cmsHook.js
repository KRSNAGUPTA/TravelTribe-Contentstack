import cmsClient from "../contentstackClient.js";
import Hostel from "../model/HostelModel.js";

const hostelDataHook = async (req, res) => {
  try {
    const hostelEntryId = req.body?.data?.entry?.uid;

    if (!hostelEntryId) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    // Check if hostel already exists
    const existingHostel = await Hostel.findOne({
      hostelId: hostelEntryId,
    });

    if (existingHostel) {
      return res.status(200).json({
        message: "Hostel already initialized",
      });
    }

    // Fetch full entry from CMS
    const hostelData = (
      await cmsClient.get(
        `/content_types/hostel/entries/${hostelEntryId}`
      )
    ).data.entry;

    const roomTypes = hostelData.room_types.map((room) => ({
      room_key: room.room_key,           // from CMS Select
      room_name: room.room_name,         // display name
      total_beds: room.total_beds,
      available_beds: room.total_beds,  // initialize 
    }));

    // Create hostel document
    await Hostel.create({
      hostelId: hostelEntryId,
      reviews: [],
      room_types: roomTypes,
    });

    console.log("Hostel initialized:", hostelEntryId);

    return res.status(200).json({
      message: "Hostel created successfully",
    });
  } catch (error) {
    console.error("Hostel webhook error:", error);
    return res.status(500).json({
      message: "Hostel webhook error: Internal server error",
    });
  }
};

export { hostelDataHook };
