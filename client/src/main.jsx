import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import ChatBot from "./components/ChatBot";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Analytics />
    <SpeedInsights />
    <App />
    <ChatBot/>
  </StrictMode>
);
