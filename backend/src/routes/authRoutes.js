import express from 'express';
import { googleLogin, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public login endpoint (supports both production token verification and mock demo simulation)
router.post('/google', googleLogin);

// Fetch public OAuth configurations
router.get('/config', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

// Protected profile validation
router.get('/me', protect, getMe);

export default router;
