import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Project from '../models/Project.js';
import Like from '../models/Like.js';
import Bookmark from '../models/Bookmark.js';
import eventBus, { EVENTS } from '../config/eventBus.js';

/**
 * Follow a user
 * POST /api/users/:id/follow
 */
export async function followStudent(req, res) {
  try {
    const studentId = req.params.id;
    
    // Check if following self
    if (studentId === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const existingFollow = await Follow.findOne({ followerId: req.user.id, followedId: studentId });
    if (existingFollow) {
      return res.status(400).json({ message: 'You are already following this student.' });
    }

    // Create follow
    await Follow.create({ followerId: req.user.id, followedId: studentId });

    // Update user's followedStudents array
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { followedStudents: studentId }
    });

    // Trigger followed event
    eventBus.emit(EVENTS.USER_FOLLOWED, { follower: req.user, followed: student });

    return res.status(200).json({ message: `Successfully followed ${student.name}.` });
  } catch (error) {
    console.error('Error following student:', error);
    return res.status(500).json({ message: 'Server error following student.' });
  }
}

/**
 * Unfollow a user
 * POST /api/users/:id/unfollow
 */
export async function unfollowStudent(req, res) {
  try {
    const studentId = req.params.id;

    const follow = await Follow.findOneAndDelete({ followerId: req.user.id, followedId: studentId });
    if (!follow) {
      return res.status(400).json({ message: 'You are not following this student.' });
    }

    // Update user's followedStudents array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { followedStudents: studentId }
    });

    return res.status(200).json({ message: 'Successfully unfollowed student.' });
  } catch (error) {
    console.error('Error unfollowing student:', error);
    return res.status(500).json({ message: 'Server error unfollowing student.' });
  }
}

/**
 * Get user public profile and their projects
 * GET /api/users/:id/profile
 */
export async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Access control for project list:
    // Only approved projects are shown unless the requester is the owner student, department lecturer, or admin
    const requesterId = req.user ? req.user.id : null;
    const requesterRole = req.user ? req.user.role : 'public';
    
    const query = { studentId: user._id };

    if (requesterId !== user._id.toString() && requesterRole !== 'admin') {
      query.status = 'approved';
      
      // If requester is public or recruiter, also filter out restricted projects
      if (requesterRole === 'public' || requesterRole === 'recruiter') {
        query.restricted = false;
      }
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });

    // Fetch follow stats
    const followersCount = await Follow.countDocuments({ followedId: user._id });
    const followingCount = await Follow.countDocuments({ followerId: user._id });
    
    // Check if requester is following this user
    let isFollowing = false;
    if (requesterId) {
      const follow = await Follow.findOne({ followerId: requesterId, followedId: user._id });
      isFollowing = !!follow;
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        title: user.title,
        bio: user.bio,
        company: user.company,
        graduationYear: user.graduationYear,
        department: user.department,
        faculty: user.faculty,
        university: user.university,
        isAlumni: user.isAlumni,
        followersCount,
        followingCount,
        isFollowing
      },
      projects
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Server error fetching user profile.' });
  }
}

/**
 * Get users that the current user follows
 * GET /api/users/following
 */
export async function getFollowing(req, res) {
  try {
    const follows = await Follow.find({ followerId: req.user.id })
      .populate('followedId', 'name email avatarUrl role title department university isAlumni')
      .sort({ createdAt: -1 });
    
    const users = [];
    for (const f of follows) {
      if (!f.followedId) continue;
      const u = f.followedId;
      const projectsCount = await Project.countDocuments({ studentId: u._id, status: 'approved' });
      const followersCount = await Follow.countDocuments({ followedId: u._id });
      
      users.push({
        ...u.toObject(),
        projectsCount,
        followersCount,
        isFollowing: true
      });
    }
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching following:', error);
    return res.status(500).json({ message: 'Server error fetching following users.' });
  }
}

/**
 * Get feed of projects from followed users
 * GET /api/users/following/feed
 */
export async function getFeed(req, res) {
  try {
    const follows = await Follow.find({ followerId: req.user.id });
    const followedIds = follows.map(f => f.followedId);
    
    const projects = await Project.find({ studentId: { $in: followedIds }, status: 'approved' })
      .populate('studentId', 'name avatarUrl role title department')
      .sort({ createdAt: -1 })
      .limit(20);

    let finalProjects = projects;
    if (req.user) {
      const userLikes = await Like.find({ userId: req.user.id });
      const userBookmarks = await Bookmark.find({ userId: req.user.id });
      
      const likedProjectIds = new Set(userLikes.map(l => l.projectId.toString()));
      const bookmarkedProjectIds = new Set(userBookmarks.map(b => b.projectId.toString()));
      
      finalProjects = projects.map(p => {
        const obj = p.toObject();
        obj.userLiked = likedProjectIds.has(obj._id.toString());
        obj.userBookmarked = bookmarkedProjectIds.has(obj._id.toString());
        return obj;
      });
    }
      
    return res.status(200).json(finalProjects);
  } catch (error) {
    console.error('Error fetching feed:', error);
    return res.status(500).json({ message: 'Server error fetching feed.' });
  }
}

/**
 * Get recommended users to follow
 * GET /api/users/recommended
 */
export async function getRecommendedUsers(req, res) {
  try {
    const follows = await Follow.find({ followerId: req.user.id });
    const followedIds = follows.map(f => f.followedId);
    followedIds.push(req.user.id); // exclude self
    
    const users = await User.find({ _id: { $nin: followedIds } })
      .select('name avatarUrl role title department university isAlumni')
      .limit(5);
      
    const recommended = [];
    for (const u of users) {
      const followersCount = await Follow.countDocuments({ followedId: u._id });
      recommended.push({
        ...u.toObject(),
        followersCount
      });
    }
    return res.status(200).json(recommended);
  } catch (error) {
    console.error('Error fetching recommended users:', error);
    return res.status(500).json({ message: 'Server error fetching recommended users.' });
  }
}

/**
 * Update user profile
 * PUT /api/users/profile
 */
export async function updateProfile(req, res) {
  try {
    const { name, title, bio, github, linkedin, portfolio, university, department, graduationYear, company } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, title, bio, github, linkedin, portfolio, university, department, graduationYear, company },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    return res.status(200).json({
      message: 'Profile updated successfully',
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
        followedStudents: user.followedStudents
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
}

/**
 * Update user settings
 * PUT /api/users/settings
 */
export async function updateSettings(req, res) {
  try {
    const { notifications, appearance } = req.body;
    
    const updateData = {};
    if (notifications) updateData['settings.notifications'] = notifications;
    if (appearance) updateData['settings.appearance'] = appearance;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    return res.status(200).json({ message: 'Settings updated successfully', settings: user.settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ message: 'Server error updating settings.' });
  }
}

/**
 * Delete user account
 * DELETE /api/users/account
 */
export async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;
    
    // Cascading deletes (simplified for demo purposes)
    await Project.deleteMany({ studentId: userId });
    await Follow.deleteMany({ $or: [{ followerId: userId }, { followedId: userId }] });
    // Note: Collections and Bookmarks should ideally be deleted as well
    
    await User.findByIdAndDelete(userId);
    
    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ message: 'Server error deleting account.' });
  }
}

/**
 * Get all students for the directory with filtering
 * GET /api/users/students
 */
export async function getStudents(req, res) {
  try {
    const query = { role: 'student' };
    const students = await User.find(query)
      .select('name email avatarUrl role title bio department faculty university graduationYear isAlumni followedStudents')
      .sort({ name: 1 });

    const studentList = [];
    for (const student of students) {
      const projectsCount = await Project.countDocuments({ studentId: student._id, status: 'approved' });
      const followersCount = await Follow.countDocuments({ followedId: student._id });
      
      const isFollowing = await Follow.findOne({ followerId: req.user.id, followedId: student._id });

      studentList.push({
        ...student.toObject(),
        projectsCount,
        followersCount,
        isFollowing: !!isFollowing
      });
    }

    return res.status(200).json(studentList);
  } catch (error) {
    console.error('Error fetching students list:', error);
    return res.status(500).json({ message: 'Server error fetching student profiles.' });
  }
}

/**
 * Upload and update user avatar photo
 * PUT /api/users/avatar
 */
export async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'Profile picture updated successfully.',
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
        followedStudents: user.followedStudents
      }
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({ message: 'Server error uploading profile picture.' });
  }
}
