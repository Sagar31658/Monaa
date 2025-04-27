import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/AsyncHandler.js';

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw new ApiError(401, "Not authorized, user not found");
  }

  req.user = user;
  next();
});
