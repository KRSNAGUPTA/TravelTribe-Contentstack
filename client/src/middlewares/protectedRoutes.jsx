import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({children}) => {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  console.log("protectedRoute")

  // console.log("ProtectedRoute -> user:", user?.email, "| isInitializing:", isInitializing);

  // Keep loader visible while token is being restored from httpOnly cookie
  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Authenticating session...</p>
        </div>
      </div>
    );
  }
  console.log("p: user", user)
  return user ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;