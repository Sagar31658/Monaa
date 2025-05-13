import express from 'express';
import { registerUser, loginUser, logoutUser, refreshAccessToken, forgotPassword, resetPassword, getCurrentUser } from '../controllers/auth.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Register a new user
router.post('/register', upload.single('profilePhoto'), registerUser);

// Login user
router.post('/login', loginUser);

// Logout user
router.post('/logout', verifyJWT, logoutUser);

// Refresh access token
router.post('/refresh-token', refreshAccessToken);

// Forgot - Reset Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Get current user profile
router.get('/me', verifyJWT, getCurrentUser);

export default router;
