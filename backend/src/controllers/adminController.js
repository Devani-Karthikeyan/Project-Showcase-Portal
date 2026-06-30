import User from '../models/User.js';
import Project from '../models/Project.js';
import University from '../models/University.js';
import DegreeProgram from '../models/DegreeProgram.js';

/**
 * Get all users registered in the system (Admin only)
 * GET /api/admin/users
 */
export async function getAllUsers(req, res) {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    return res.status(500).json({ message: 'Server error fetching user list.' });
  }
}

/**
 * Modify a user's role in the system (Admin only)
 * PUT /api/admin/users/:id/role
 */
export async function updateUserRole(req, res) {
  try {
    const { role } = req.body;
    if (!role || !['student', 'recruiter', 'lecturer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selection.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Protect against self-demotion
    if (user._id.toString() === req.user.id && role !== 'admin') {
      return res.status(400).json({ message: 'Admin cannot demote themselves.' });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({ message: `Successfully updated user role to ${role}.`, user });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ message: 'Server error updating user role.' });
  }
}

/**
 * Get platform metrics (total users, projects, likes, and approval breakdown)
 * GET /api/admin/stats
 */
export async function getPlatformStats(req, res) {
  try {
    const totalUsers = await User.countDocuments({});
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalLecturers = await User.countDocuments({ role: 'lecturer' });
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' });

    const totalProjects = await Project.countDocuments({});
    const approvedProjects = await Project.countDocuments({ status: 'approved' });
    const pendingProjects = await Project.countDocuments({ status: 'pending_approval' });
    const rejectedProjects = await Project.countDocuments({ status: 'rejected' });
    
    const totalUniversities = await University.countDocuments({});
    const totalDegreePrograms = await DegreeProgram.countDocuments({});

    // Calculate total likes from all projects
    const projects = await Project.find({}, 'likesCount');
    const totalLikes = projects.reduce((sum, p) => sum + (p.likesCount || 0), 0);

    return res.status(200).json({
      totalUsers,
      totalStudents,
      totalLecturers,
      totalRecruiters,
      totalProjects,
      approvedProjects,
      pendingProjects,
      rejectedProjects,
      totalUniversities,
      totalDegreePrograms,
      totalLikes
    });
  } catch (error) {
    console.error('Error calculating system statistics:', error);
    return res.status(500).json({ message: 'Server error fetching statistics.' });
  }
}

/**
 * Activate or deactivate a user account (Admin only)
 * PUT /api/admin/users/:id/active
 */
export async function toggleUserActive(req, res) {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive status must be boolean.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent deactivating oneself
    if (user._id.toString() === req.user.id && !isActive) {
      return res.status(400).json({ message: 'Admin cannot deactivate their own account.' });
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({ message: `Successfully updated user status to ${isActive ? 'active' : 'inactive'}.`, user });
  } catch (error) {
    console.error('Error toggling user active status:', error);
    return res.status(500).json({ message: 'Server error toggling account status.' });
  }
}

/**
 * Delete a user and optionally all their submissions (Admin only)
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent deleting oneself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Admin cannot delete their own account.' });
    }

    // Delete all projects associated with this user if they are a student
    if (user.role === 'student') {
      await Project.deleteMany({ studentId: user._id });
    }

    await User.findByIdAndDelete(user._id);

    return res.status(200).json({ message: 'User account and associated submissions successfully deleted.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error deleting user.' });
  }
}
