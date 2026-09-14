import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import mongoose from "mongoose";
import User from "../model/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendNotification } from "../discordBot/NotificationBot.js";
import { OAuth2Client } from "google-auth-library";
import { sendOtpEmail } from "../services/emailService.js";

const client = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role, expireIn) => {
  try {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
      expiresIn: expireIn,
    });
  } catch (error) {
    console.error("Failed to generate JWT Token:", error);
    throw error;
  }
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
};


export const refreshToken = async (req, res) => {
  try {
    console.log("cookies",req.cookies)
    const refreshT = req.cookies?.refreshToken;
    if (!refreshT) {
      return res.status(401).json({ message: "Refresh token not provided" });
    }

    const decoded = jwt.verify(refreshT, process.env.JWT_SECRET);
    const token = generateToken(decoded.id, decoded.role, "15m");

    return res.status(200).json({
      message: "Access token refreshed",
      accessToken: token,
    });
  } catch (error) {
    console.error("Failed to refresh token:", error.message);
    return res.status(403).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export const handleGoogleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    const googleClient = client();
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub } = ticket.getPayload();
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name,
        password: sub,
        avatar: picture,
        isGoogleUser: true,
      });
      await sendNotification("register", user);
    }

    const refreshToken = generateToken(user._id, user.role, "30d");
    const accessToken = generateToken(user._id, user.role, "15m");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/user/refresh",
    });

    return res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      message: "Google login successful!",
    });
  } catch (error) {
    console.error("Error in Google Login:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Details missing" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone?.trim(),
    });

    await newUser.save();
    await sendNotification("register", newUser);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        name: newUser.name,
        email: newUser.email,
        id: newUser._id,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const refreshToken = generateToken(user._id, user.role, "30d");
    const accessToken = generateToken(user._id, user.role, "15m");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/user/refresh",
    });

    await sendNotification("login", user);

    return res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user?.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server error", error: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "lax",
    path: "/api/user/refresh",
  });
  return res.json({ message: "Logged out successfully" });
};

// --- USER MANAGEMENT CONTROLLERS ---

export const searchUser = async (req, res) => {
  try {
    const { query, role } = req.query;
    let filter = {};

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ];
    }

    if (role) filter.role = role;

    const users = await User.find(filter).select("-password");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({ message: "Users found", users });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const makeAdmin = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "admin";
    await user.save();

    return res.status(200).json({ message: "User promoted to admin", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeAdmin = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "user";
    await user.save();

    return res.status(200).json({ message: "Admin demoted to user", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req?.user;
    if (!user?._id) return res.status(401).json({ message: "Unauthorized" });

    const userData = await User.findById(user._id).select("-password");
    return res.status(200).json({ message: "Fetched Profile", userData });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { email, name, phone, password } = req.body;
  try {
    const user = req?.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userData = await User.findById(user._id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const emailUsed = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (emailUsed) {
        return res
          .status(409)
          .json({ message: "An account already exists with this email" });
      }
      userData.email = normalizedEmail;
    }

    if (phone) userData.phone = phone.trim();
    if (name) userData.name = name.trim();
    if (password) userData.password = password; 
    await userData.save();

    return res.status(200).json({ message: "User data updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (user.isGoogleUser) {
      return res.status(400).json({
        message: "This account uses Google Sign-In. Please sign in with Google.",
      });
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.resetPasswordOtp = hashOtp(rawOtp);
    user.resetPasswordOtpExpires = otpExpires;
    await user.save();

    await sendOtpEmail(user.email, rawOtp);

    return res.status(200).json({
      message: "6-digit OTP has been sent to your email address",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedInputOtp = hashOtp(otp);

    if (
      !user.resetPasswordOtp ||
      user.resetPasswordOtp !== hashedInputOtp ||
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedInputOtp = hashOtp(otp);

    if (
      !user.resetPasswordOtp ||
      user.resetPasswordOtp !== hashedInputOtp ||
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};