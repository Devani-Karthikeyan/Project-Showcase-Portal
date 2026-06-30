import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  likeProject,
  unlikeProject,
  addFeedback,
  approveProject,
  rejectProject,
  archiveProject,
  unarchiveProject,
  bookmarkProject,
  unbookmarkProject
} from '../controllers/projectController.js';
import { protect, optionalProtect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public / optional auth routes (supports guest search and private-restricted viewing)
router.get('/', optionalProtect, getProjects);
router.get('/:id', optionalProtect, getProjectById);

// Student CRUD operations
router.post('/', protect, restrictTo('student'), upload.single('thumbnail'), createProject);
router.put('/:id', protect, upload.single('thumbnail'), updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/archive', protect, restrictTo('student'), archiveProject);
router.post('/:id/unarchive', protect, restrictTo('student'), unarchiveProject);

// Actions available to any authenticated user
router.post('/:id/like', protect, likeProject);
router.post('/:id/unlike', protect, unlikeProject);
router.post('/:id/bookmark', protect, bookmarkProject);
router.post('/:id/unbookmark', protect, unbookmarkProject);

// Lecturer actions
router.post('/:id/feedback', protect, restrictTo('lecturer'), addFeedback);
router.post('/:id/approve', protect, restrictTo('lecturer', 'admin'), approveProject);
router.post('/:id/reject', protect, restrictTo('lecturer', 'admin'), rejectProject);

export default router;
