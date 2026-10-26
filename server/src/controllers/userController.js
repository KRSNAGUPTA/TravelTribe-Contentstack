import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { sendNotification } from "../discordBot/NotificationBot.js";
import { OAuth2Client } from "google-auth-library";
import { enqueueOtp } from "../queues/emailQueue.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";

const client = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

const generateToken = (id, role, isRefresh, expireIn) => {
  try {
    return jwt.sign({ id, role, isRefresh }, process.env.JWT_SECRET, {
      expiresIn: expireIn,
    });
  } catch (error) {
    logger.error({ err: error.message }, "failed to generate JWT token");
    throw error;
  }
};

const generateAccessToken = (id, role) =>
  generateToken(id, role, false, ACCESS_TOKEN_TTL);

const generateRefreshToken = (id, role) =>
  generateToken(id, role, true, REFRESH_TOKEN_TTL);

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const hashOtp = (otp) => bcrypt.hash(String(otp).trim(), 10);

const verifyOtpHash = (otp, hash) => bcrypt.compare(String(otp).trim(), hash);

const isProd = process.env.NODE_ENV === "production";

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd, 
    sameSite: isProd ? "None" : "Lax", // "Lax: allow in every request, None: Only with secure"
    path: "/api/user/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    expires: new Date(0),
    path: "/api/user/refresh",
  });
};

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
};

export const refreshToken = async (req, res) => {
  try {
    const refreshT = req.cookies?.refreshToken;
    if (!refreshT) {
      return res.status(401).json({ message: "Refresh token not provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshT, process.env.JWT_SECRET);
    } catch (err) {
      clearRefreshCookie(res);
      return res
        .status(403)
        .json({ message: "Unauthorized: Invalid or expired token" });
    }

    if (decoded.isRefresh !== true) {
      clearRefreshCookie(res);
      return res
        .status(403)
        .json({ message: "Unauthorized: Invalid token type" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      clearRefreshCookie(res);
      return res
        .status(403)
        .json({ message: "Unauthorized: Invalid or expired token" });
    }

    const incomingHash = hashToken(refreshT);
    if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
      user.refreshTokenHash = null;
      await user.save();
      clearRefreshCookie(res);
      return res.status(403).json({
        message:
          "Refresh token has been revoked or already used. Please log in again.",
      });
    }

    const { accessToken, refreshToken: newRefresh } = await issueTokens(user);
    setRefreshCookie(res, newRefresh);

    return res.status(200).json({
      message: "Access token refreshed",
      accessToken,
    });
  } catch (error) {
    logger.error({ err: error.message }, "failed to refresh token");
    clearRefreshCookie(res);
    return res
      .status(403)
      .json({ message: "Unauthorized: Invalid or expired token" });
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
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name,
        password: sub,
        avatar: picture,
        isGoogleUser: true,
      });
      isNewUser = true;
    }

    const { accessToken, refreshToken: refreshTok } = await issueTokens(user);
    setRefreshCookie(res, refreshTok);

    if (isNewUser) {
      setImmediate(() => {
        sendNotification("register", user).catch((err) =>
          logger.error({ err: err.message }, "discord notify failed"),
        );
      });
    }

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
    logger.error({ err: error.message }, "google login failed");
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Details missing" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
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

    setImmediate(() => {
      sendNotification("register", newUser).catch((err) =>
        logger.error({ err: err.message }, "discord notify failed"),
      );
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        name: newUser.name,
        email: newUser.email,
        id: newUser._id,
      },
    });
  } catch (error) {
    logger.error({ err: error.message }, "register user failed");
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
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

    const { accessToken, refreshToken: refreshTok } = await issueTokens(user);
    setRefreshCookie(res, refreshTok);

    setImmediate(() => {
      sendNotification("login", user).catch((err) =>
        logger.error({ err: err.message }, "discord notify failed"),
      );
    });

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
    logger.error({ err: error.message }, "login user failed");
    return res
      .status(500)
      .json({ message: "Internal Server error", error: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const refreshT = req.cookies?.refreshToken;

    if (refreshT) {
      try {
        const decoded = jwt.verify(refreshT, process.env.JWT_SECRET);
        if (decoded.isRefresh === true) {
          const user = await User.findById(decoded.id);
          if (user) {
            user.refreshTokenHash = null;
            await user.save();
          }
        }
      } catch (err) {
        // token invalid or expired — nothing to revoke
      }
    }

    clearRefreshCookie(res);
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    clearRefreshCookie(res);
    return res.json({ message: "Logged out successfully" });
  }
};

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

    const users = await User.find(filter).select("-password -refreshTokenHash");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({ message: "Users found", users });
  } catch (error) {
    logger.error({ err: error.message }, "search user failed");
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password -refreshTokenHash");
    return res.status(200).json(users);
  } catch (error) {
    logger.error({ err: error.message }, "get all users failed");
    return res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const user = await User.findById(req.params.id).select(
      "-password -refreshTokenHash",
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (error) {
    logger.error({ err: error.message }, "get user by id failed");
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

    return res.status(200).json({
      message: "User promoted to admin",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error({ err: error.message }, "make admin failed");
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

    return res.status(200).json({
      message: "Admin demoted to user",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error({ err: error.message }, "remove admin failed");
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
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error({ err: error.message }, "delete user failed");
    return res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req?.user;
    if (!user?._id) return res.status(401).json({ message: "Unauthorized" });

    const userData = await User.findById(user._id).select(
      "-password -refreshTokenHash",
    );
    return res.status(200).json({ message: "Fetched Profile", userData });
  } catch (error) {
    logger.error({ err: error.message }, "get profile failed");
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

    if (password) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });
      }
      userData.password = password;
    }

    await userData.save();

    return res.status(200).json({ message: "User data updated successfully" });
  } catch (error) {
    logger.error({ err: error.message }, "update user failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.isGoogleUser) {
      await new Promise((r) => setTimeout(r, 200));
      return res.status(200).json({
        message: "If an account exists, an OTP has been sent.",
      });
    }

    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = await hashOtp(rawOtp);
    user.resetPasswordOtpExpires = otpExpires;
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    const job = await enqueueOtp(user.email, rawOtp);

    if (!job) {
      logger.error(
        { email: user.email },
        "OTP enqueue failed — user will not receive OTP",
      );
      return res.status(500).json({
        message: "Failed to send OTP. Please try again in a moment.",
      });
    }

    return res.status(200).json({
      message: "If an account exists, an OTP has been sent.",
    });
  } catch (error) {
    logger.error({ err: error.message }, "forgot password failed");
    return res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again." });
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

    // Attempt limit — 5 wrong guesses kills the OTP
    if ((user.resetPasswordOtpAttempts || 0) >= 5) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      user.resetPasswordOtpAttempts = 0;
      await user.save();
      return res.status(429).json({
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    if (
      !user.resetPasswordOtp ||
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const valid = await verifyOtpHash(otp, user.resetPasswordOtp);

    if (!valid) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    logger.error({ err: error.message }, "verify OTP failed");
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
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (
      !user.resetPasswordOtp || // undefined → true, short-circuit
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if ((user.resetPasswordOtpAttempts || 0) >= 5) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      user.resetPasswordOtpAttempts = 0;
      await user.save();
      return res.status(429).json({
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    if (
      !user.resetPasswordOtp ||
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const valid = await verifyOtpHash(otp, user.resetPasswordOtp);

    if (!valid) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordOtpAttempts = 0;
    user.refreshTokenHash = null;
    await user.save();

    return res.status(200).json({
      message: "Password reset successful! You can now log in.",
    });
  } catch (error) {
    logger.error({ err: error.message }, "reset password failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};
