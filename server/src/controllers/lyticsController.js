import axios from "axios";

// not using
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
    console.log("here")
    console.error("Error fetching user profile from Lytics:", error.status);
    if(error.status === 404){
      return res.status(404).json({ error: "Profile not found for the provided email" });
    }
    return res.status(500).json({ 
      error: "Failed to fetch profile from Lytics",
      details: error.message,
      staus: error
    });
  }
};

export { fetchLyticsProfile };
