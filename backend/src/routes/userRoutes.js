import express from 'express';
import { followStudent, unfollowStudent, getUserProfile, getFollowing, getFeed, getRecommendedUsers, updateProfile, updateSettings, deleteAccount, getStudents, uploadAvatar } from '../controllers/userController.js';
import { protect, optionalProtect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get list of all students (directory search)
router.get('/students', protect, getStudents);

// Retrieve a user public profile (optional auth to show private details/own project versions)
router.get('/:id/profile', optionalProtect, getUserProfile);

// Get feed of followed users (projects)
router.get('/following/feed', protect, getFeed);

// Get list of followed users
router.get('/following', protect, getFollowing);

// Get recommended users to follow
router.get('/recommended', protect, getRecommendedUsers);

// Settings & Profile Update Endpoints
router.put('/profile', protect, updateProfile);
router.put('/settings', protect, updateSettings);
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/account', protect, deleteAccount);

// Endpoints to follow/unfollow a user (formerly restricted to recruiter)
router.post('/:id/follow', protect, followStudent);
router.post('/:id/unfollow', protect, unfollowStudent);

export default router;
