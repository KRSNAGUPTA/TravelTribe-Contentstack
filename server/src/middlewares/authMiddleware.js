import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, please log in" });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({ message: "Not authorized, please log in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.isRefresh === true) {
      return res.status(401).json({ message: "Invalid token type" });
    }

    req.user = await User.findById(decoded.id).select(
      "-password -refreshTokenHash"
    );

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please log in again" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token, please log in" });
    }
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Invalid token, please log in" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only" });
};