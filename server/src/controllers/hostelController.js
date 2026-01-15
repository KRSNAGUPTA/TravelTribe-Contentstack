import Hostel from "../model/HostelModel.js";

export const getAllHostels = async (req, res) => {
  // console.log("req here")
  try {
    const hostels = await Hostel.find();
    return res.status(200).json(hostels);
  } catch (error) {
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
    const hostel = await Hostel.findOne({
      hostelId: id,
    });
    if (!hostel) return res.status(404).json({ message: "Hostel not found" });
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
