import User from '../models/user.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken'
import crypto from 'crypto';

// Register
export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, voice } = req.body;

  if ([firstName, lastName, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  let profilePhotoPath = req.file?.path;
  let uploadedProfilePhoto = null;
  console.log(profilePhotoPath)

  if (profilePhotoPath) {
    uploadedProfilePhoto = await uploadOnCloudinary(profilePhotoPath);
  }

  const newUser = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    voicePreference: voice || "neutral",
    profilePhoto: uploadedProfilePhoto
      ? {
          public_id: uploadedProfilePhoto.public_id,
          url: uploadedProfilePhoto.secure_url
        }
      : undefined
  });

  // Generate Access and Refresh Tokens
  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);

  // Save refreshToken to User
  newUser.refreshToken = refreshToken;
  newUser.accessToken = accessToken;
  await newUser.save({ validateBeforeSave: false });

  // Send tokens via cookies
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict"
  };

  res
    .cookie("accessToken", accessToken, { ...options, maxAge: 24 * 60 * 60 * 1000 }) // 15 minutes
    .cookie("refreshToken", refreshToken, { ...options, maxAge: 10 * 24 * 60 * 60 * 1000 }) // 7 days
    .status(201)
    .json(new ApiResponse(201, {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      profilePhoto: newUser.profilePhoto,
      voicePreference: newUser.voicePreference,
      createdAt: newUser.createdAt,
      accessToken
    }, "User registered and logged in successfully"));
});

//Login
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }
  
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }
  
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
  
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
  
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict"
    };
  
    res
      .cookie("accessToken", accessToken, { ...options, maxAge: 24 * 60 * 60 * 1000 }) // 1 day
      .cookie("refreshToken", refreshToken, { ...options, maxAge: 10 * 24 * 60 * 60 * 1000 }) // 10 days
      .status(200)
      .json(new ApiResponse(200, {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        voicePreference: user.voicePreference,
        createdAt: user.createdAt,
        accessToken
      }, "User logged in successfully"));
  });
  

// Logout
export const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
  
    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }
  
    await User.findByIdAndUpdate(userId, { refreshToken: "" }, { new: true });
  
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict"
    };
  
    res
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  });

  
// Refresh Access Token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = 
    req.cookies?.refreshToken || 
    req.body?.refreshToken || 
    req.headers['x-refresh-token'];
  
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }
  
    const user = await User.findOne({ refreshToken: incomingRefreshToken });
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
    try {
      const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_SECRET);
  
      const accessToken = generateAccessToken(user);
  
      const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
      };
  
      res
        .cookie("accessToken", accessToken, { ...options, maxAge: 24 * 60 * 60 * 1000 }) // 1 day
        .status(200)
        .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"));
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
  });

// Forgot Password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }

  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

  // In production, you would send resetUrl via email
  // For now, we just return it in response

  return res.status(200).json(
    new ApiResponse(200, { resetUrl }, "Password reset link generated successfully")
  );
});

// Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!resetToken) {
    throw new ApiError(400, "Reset token is required");
  }

  if (!password) {
    throw new ApiError(400, "New password is required");
  }

  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json(
    new ApiResponse(200, null, "Password reset successfully")
  );
});