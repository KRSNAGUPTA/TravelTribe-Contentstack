import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./middlewares/protectedRoutes";
import Loading from "./pages/Loading";
import { GoogleOAuthProvider } from "@react-oauth/google";

const HomePage = lazy(() => import("./pages/HomePage"));
const HostelPage = lazy(() => import("./pages/HostelsPage"));
const HostelDetails = lazy(() => import("./pages/HostelDetails"));
const HostelBooking = lazy(() => import("./pages/BookHostel"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contact = lazy(() => import("./pages/Contact"));


function App() {
  return (
    <Router>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/hostel" element={<HostelPage />} />
              <Route path="/hostel/:id" element={<HostelDetails />} />
              <Route
                path="/hostel/:id/book"
                element={
                  <ProtectedRoute>
                    <HostelBooking />
                  </ProtectedRoute>
                }
              />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  );
}

export default App;
