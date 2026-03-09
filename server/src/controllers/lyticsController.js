import axios from "axios";
const fetchLyticsProfile = async (req, res) => {
    const {email} = req.params;
    if(!email){
        return res.status(400).json({ error: "Email parameter is required" });
    }
    const baseUrl = process.env.LYTICS_BASE_URL;
    const apiKey = process.env.LYTICS_API_KEY;

    if (!baseUrl || !apiKey) {
      return res.status(500).json({ 
        error: "Lytics base URL or API key is not configured" 
      });
    }
  try {
    const response = await axios.get(`${baseUrl}/identity/user/email/${email}`, {
      headers: {
        Authorization: `${apiKey}`,
      },
    });

    console.log("Lytics Profile Response", response.data);
    return res.status(200).json(response.data.data.entity);
  } catch (error) {
    console.error("Error fetching user profile from Lytics:", error);
    return res.status(500).json({ 
      error: "Failed to fetch profile from Lytics",
      details: error.message 
    });
  }
};

export { fetchLyticsProfile };
