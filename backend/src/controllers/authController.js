import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '336110271991-cmeqben5o90fo0ff3dh4gd0uajcsv49s.apps.googleusercontent.com');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_seng_31242', {
    expiresIn: '30d'
  });
};

/**
 * Handles Google OAuth login and registration
 * POST /api/auth/google
 */
export async function googleLogin(req, res) {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google credential (ID Token) is required.' });
  }

  try {
    // 1. Verify the Google ID Token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || '336110271991-cmeqben5o90fo0ff3dh4gd0uajcsv49s.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google Credentials ID token.' });
    }
    
    const { sub: googleId, email, name, picture: avatarUrl } = payload;

    // 2. Search for the user using their Google ID or email
    let user = await User.findOne({ 
      $or: [{ googleId }, { email }]
    });
    
    if (user) {
      // If user exists by email but doesn't have googleId linked, link it
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // 3. If user does not exist, create a new user
      user = await User.create({
        googleId,
        email,
        name,
        avatarUrl,
        role: 'student', // Default role
        isActive: true
      });
    }

    // 4. Generate JWT
    const token = generateToken(user._id);

    // 5. Return user details and role
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        department: user.department,
        faculty: user.faculty,
        graduationYear: user.graduationYear,
        title: user.title,
        bio: user.bio,
        company: user.company,
        isAlumni: user.isAlumni,
        followedStudents: user.followedStudents,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Error logging in Google OAuth user:', error);
    return res.status(500).json({ message: 'Server Authentication Error.' });
  }
}

/**
 * Returns current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    return res.status(200).json({
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      department: user.department,
      faculty: user.faculty,
      graduationYear: user.graduationYear,
      title: user.title,
      bio: user.bio,
      company: user.company,
      isAlumni: user.isAlumni,
      followedStudents: user.followedStudents,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}

