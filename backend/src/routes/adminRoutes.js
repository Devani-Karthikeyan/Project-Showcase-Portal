import express from 'express';
import { getAllUsers, updateUserRole, getPlatformStats, toggleUserActive, deleteUser } from '../controllers/adminController.js';
import { createUniversity, deleteUniversity, createDegreeProgram, deleteDegreeProgram, updateUniversity, updateDegreeProgram } from '../controllers/metadataController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce admin-only access to all sub-routes
router.use(protect);
router.use(restrictTo('admin'));

// Fetch all registered profiles
router.get('/users', getAllUsers);

// Change user roles
router.put('/users/:id/role', updateUserRole);

// Toggle account activation status
router.put('/users/:id/active', toggleUserActive);

// Delete user account
router.delete('/users/:id', deleteUser);

// Fetch admin statistics
router.get('/stats', getPlatformStats);

// Manage universities
router.post('/universities', createUniversity);
router.put('/universities/:id', updateUniversity);
router.delete('/universities/:id', deleteUniversity);

// Manage degree programs
router.post('/degree-programs', createDegreeProgram);
router.put('/degree-programs/:id', updateDegreeProgram);
router.delete('/degree-programs/:id', deleteDegreeProgram);

export default router;
