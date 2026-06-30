import Project from '../models/Project.js';
import Like from '../models/Like.js';
import Bookmark from '../models/Bookmark.js';
import Collection from '../models/Collection.js';
import User from '../models/User.js';
import eventBus, { EVENTS } from '../config/eventBus.js';

/**
 * Get all projects with filtering and search
 * GET /api/projects
 */
export async function getProjects(req, res) {
  try {
    const { department, module, search, studentId, featured, status, categories } = req.query;
    
    // Build query filters
    const query = {};

    // 1. Check user roles and enforce visibility rules
    // Public/Recruiters can only view approved, non-restricted projects.
    // University logged-in users (Student, Lecturer, Admin) can view restricted projects.
    const userRole = req.user ? req.user.role : 'public';

    if (userRole === 'public') {
      query.status = 'approved';
      query.restricted = false;
    } else if (userRole === 'recruiter') {
      query.status = 'approved';
      // Recruiters are external, so they should not view university-restricted projects
      query.restricted = false;
    } else {
      // University staff (Lecturer, Admin) or Students
      // By default they see approved projects
      query.status = 'approved';
      
      // Let lecturers see projects within their department
      if (userRole === 'lecturer') {
        if (status) {
          query.status = status;
          if (status !== 'approved') {
            query.department = req.user.department;
          }
        } else if (department === req.user.department) {
          // If querying their own department, let them see all project statuses
          delete query.status;
        }
      }
      
      // Let students see their own projects regardless of status
      if (userRole === 'student' && studentId === req.user.id) {
        delete query.status; // Override status to fetch all of their own
        query.studentId = req.user.id;
      }
      
      // Admins can filter by any status
      if (userRole === 'admin' && status) {
        query.status = status;
      }
    }

    // Apply specific query filters if provided
    if (department) {
      query.department = department;
    }

    if (module) {
      query.modules = module; // Mongo matches single item in array
    }

    if (studentId && userRole !== 'student') {
      query.studentId = studentId;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    const andConditions = [];

    // Full text search fallback
    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { modules: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (categories) {
      const catArray = categories.split(',');
      const catOrCondition = [];
      catArray.forEach(cat => {
        catOrCondition.push({ title: { $regex: cat, $options: 'i' } });
        catOrCondition.push({ description: { $regex: cat, $options: 'i' } });
        catOrCondition.push({ modules: { $regex: cat, $options: 'i' } });
      });
      andConditions.push({ $or: catOrCondition });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const projects = await Project.find(query)
      .populate('studentId', 'name email avatarUrl role graduationYear department faculty')
      .sort({ featured: -1, createdAt: -1 });

    let finalProjects = projects;
    
    if (req.user) {
      // Find all likes and bookmarks for this user
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
    } else {
      finalProjects = projects.map(p => {
        const obj = p.toObject();
        obj.userLiked = false;
        obj.userBookmarked = false;
        return obj;
      });
    }

    return res.status(200).json(finalProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ message: 'Server error while fetching projects.' });
  }
}

/**
 * Get single project by ID
 * GET /api/projects/:id
 */
export async function getProjectById(req, res) {
  try {
    const project = await Project.findById(req.params.id)
      .populate('studentId', 'name email avatarUrl role graduationYear department faculty bio')
      .populate('feedback.lecturerId', 'name avatarUrl department title');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userRole = req.user ? req.user.role : 'public';

    // Access control:
    // If pending approval, only owner student, lecturer of the department, or admin can view
    if (project.status === 'pending_approval') {
      const isOwner = req.user && req.user.id === project.studentId._id.toString();
      const isLecturerOfDept = req.user && req.user.role === 'lecturer' && req.user.department === project.department;
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isLecturerOfDept && !isAdmin) {
        return res.status(403).json({ message: 'Unauthorized: Project is pending approval.' });
      }
    }

    // If restricted, only authenticated university users (not public, not recruiters) can view
    if (project.restricted) {
      const isUnivUser = req.user && ['student', 'lecturer', 'admin'].includes(req.user.role);
      if (!isUnivUser) {
        return res.status(403).json({ message: 'Access denied: This project is restricted to university staff and students.' });
      }
    }

    // Increment view count asynchronously
    project.viewsCount += 1;
    await project.save();

    // Check if the current user liked or bookmarked it
    let userLiked = false;
    let userBookmarked = false;
    if (req.user) {
      const like = await Like.findOne({ userId: req.user.id, projectId: project._id });
      userLiked = !!like;
      const bookmark = await Bookmark.findOne({ userId: req.user.id, projectId: project._id });
      userBookmarked = !!bookmark;
    }

    const projectObj = project.toObject();
    projectObj.userLiked = userLiked;
    projectObj.userBookmarked = userBookmarked;

    return res.status(200).json({ project: projectObj, userLiked, userBookmarked });
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ message: 'Server error fetching project details.' });
  }
}

/**
 * Create a new project (Student only)
 * POST /api/projects
 */
export async function createProject(req, res) {
  try {
    const { title, description, demoUrl, githubUrl, modules, restricted, extraImages } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    if (!req.user.department || !req.user.university || !req.user.graduationYear) {
      return res.status(400).json({ message: 'You must complete your profile (Department, University, and Graduation Year) before publishing a project.' });
    }

    // Handle thumbnail path (check if file uploaded via multer or base64 was sent)
    let thumbnail = '';
    if (req.file) {
      // Multer path
      thumbnail = `/uploads/${req.file.filename}`;
    } else if (req.body.thumbnail) {
      // Base64 fallback
      thumbnail = req.body.thumbnail;
    }

    // Build project object
    const project = new Project({
      title,
      description,
      thumbnail,
      extraImages: Array.isArray(extraImages) ? extraImages : JSON.parse(extraImages || '[]'),
      demoUrl,
      githubUrl,
      studentId: req.user.id,
      modules: Array.isArray(modules) ? modules : JSON.parse(modules || '[]'),
      restricted: restricted === 'true' || restricted === true,
      department: req.user.department || 'Unassigned',
      faculty: req.user.faculty || 'Unassigned',
      university: req.user.university || 'Unassigned'
    });

    await project.save();

    // Emit event asynchronously
    eventBus.emit(EVENTS.PROJECT_CREATED, { project, student: req.user });

    return res.status(201).json({ message: 'Project submitted successfully for approval.', project });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ message: 'Server error creating project.' });
  }
}

/**
 * Update an existing project (Owner Student or Admin)
 * PUT /api/projects/:id
 */
export async function updateProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const isOwner = project.studentId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized modification attempt.' });
    }

    const { title, description, demoUrl, githubUrl, modules, restricted, featured, extraImages } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (demoUrl !== undefined) project.demoUrl = demoUrl;
    if (githubUrl !== undefined) project.githubUrl = githubUrl;
    if (modules) project.modules = Array.isArray(modules) ? modules : JSON.parse(modules || '[]');
    if (restricted !== undefined) project.restricted = restricted === 'true' || restricted === true;
    if (extraImages !== undefined) project.extraImages = Array.isArray(extraImages) ? extraImages : JSON.parse(extraImages || '[]');
    
    // Only Admin can modify featured status
    if (featured !== undefined && isAdmin) {
      project.featured = featured === 'true' || featured === true;
    }

    // Handle thumbnail replacement
    if (req.file) {
      project.thumbnail = `/uploads/${req.file.filename}`;
    } else if (req.body.thumbnail) {
      project.thumbnail = req.body.thumbnail;
    }

    // Critical Rule: If student edits project, reset status to pending_approval for review
    if (isOwner && !isAdmin) {
      project.status = 'pending_approval';
    }

    await project.save();

    return res.status(200).json({ message: 'Project updated successfully.', project });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ message: 'Server error updating project.' });
  }
}

/**
 * Delete a project (Owner Student or Admin)
 * DELETE /api/projects/:id
 */
export async function deleteProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const isOwner = project.studentId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized deletion attempt.' });
    }

    await Project.findByIdAndDelete(req.params.id);
    // Cleanup related likes
    await Like.deleteMany({ projectId: req.params.id });

    return res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ message: 'Server error deleting project.' });
  }
}

/**
 * Like a project (Recruiters only)
 * POST /api/projects/:id/like
 */
export async function likeProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const existingLike = await Like.findOne({ userId: req.user.id, projectId: project._id });
    if (existingLike) {
      return res.status(400).json({ message: 'You already liked this project.' });
    }

    await Like.create({ userId: req.user.id, projectId: project._id });
    
    project.likesCount += 1;
    await project.save();

    // Trigger liked event
    eventBus.emit(EVENTS.PROJECT_LIKED, { project, liker: req.user });

    return res.status(200).json({ message: 'Project liked successfully.', likesCount: project.likesCount });
  } catch (error) {
    console.error('Error liking project:', error);
    return res.status(500).json({ message: 'Server error liking project.' });
  }
}

/**
 * Unlike a project (Recruiters only)
 * POST /api/projects/:id/unlike
 */
export async function unlikeProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const like = await Like.findOneAndDelete({ userId: req.user.id, projectId: project._id });
    if (!like) {
      return res.status(400).json({ message: 'You have not liked this project.' });
    }

    if (project.likesCount > 0) {
      project.likesCount -= 1;
      await project.save();
    }

    return res.status(200).json({ message: 'Project unliked successfully.', likesCount: project.likesCount });
  } catch (error) {
    console.error('Error unliking project:', error);
    return res.status(500).json({ message: 'Server error unliking project.' });
  }
}

/**
 * Add feedback/comments to a project (Lecturers only)
 * POST /api/projects/:id/feedback
 */
export async function addFeedback(req, res) {
  try {
    const { comment, rating } = req.body;
    if (!comment) {
      return res.status(400).json({ message: 'Feedback comment is required.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Build feedback object
    const feedbackItem = {
      lecturerId: req.user.id,
      comment,
      rating: rating ? parseInt(rating) : undefined
    };

    project.feedback.push(feedbackItem);
    await project.save();

    // Trigger feedback event
    eventBus.emit(EVENTS.FEEDBACK_ADDED, { project, lecturer: req.user, feedback: feedbackItem });

    return res.status(200).json({ message: 'Feedback review submitted successfully.', feedback: project.feedback });
  } catch (error) {
    console.error('Error adding feedback:', error);
    return res.status(500).json({ message: 'Server error adding feedback.' });
  }
}

/**
 * Approve project (Lecturers or Admins only)
 * POST /api/projects/:id/approve
 */
export async function approveProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Verify lecturer is of the same department (or is Admin)
    const isLecturerOfDept = req.user.role === 'lecturer' && req.user.department === project.department;
    const isAdmin = req.user.role === 'admin';

    if (!isLecturerOfDept && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only approve projects within your department.' });
    }

    project.status = 'approved';
    await project.save();

    // Trigger approval event
    eventBus.emit(EVENTS.PROJECT_APPROVED, { project, reviewer: req.user });

    return res.status(200).json({ message: 'Project approved and published.', project });
  } catch (error) {
    console.error('Error approving project:', error);
    return res.status(500).json({ message: 'Server error approving project.' });
  }
}

/**
 * Reject project (Lecturers or Admins only)
 * POST /api/projects/:id/reject
 */
export async function rejectProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const isLecturerOfDept = req.user.role === 'lecturer' && req.user.department === project.department;
    const isAdmin = req.user.role === 'admin';

    if (!isLecturerOfDept && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only reject projects within your department.' });
    }

    project.status = 'rejected';
    await project.save();

    return res.status(200).json({ message: 'Project rejected.', project });
  } catch (error) {
    console.error('Error rejecting project:', error);
    return res.status(500).json({ message: 'Server error rejecting project.' });
  }
}

/**
 * Archive a project (Student only)
 * POST /api/projects/:id/archive
 */
export async function archiveProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const isOwner = project.studentId.toString() === req.user.id;

    if (!isOwner) {
      return res.status(403).json({ message: 'Forbidden: You can only archive your own projects.' });
    }

    // Maps to Archived status in UI
    project.previousStatus = project.status;
    project.status = 'rejected';
    await project.save();

    return res.status(200).json({ message: 'Project archived.', project });
  } catch (error) {
    console.error('Error archiving project:', error);
    return res.status(500).json({ message: 'Server error archiving project.' });
  }
}

/**
 * Unarchive a project (Student only)
 * POST /api/projects/:id/unarchive
 */
export async function unarchiveProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const isOwner = project.studentId.toString() === req.user.id;

    if (!isOwner) {
      return res.status(403).json({ message: 'Forbidden: You can only unarchive your own projects.' });
    }

    // Restore from previous status, default to draft if missing
    project.status = project.previousStatus || 'pending_approval';
    await project.save();

    return res.status(200).json({ message: 'Project unarchived.', project });
  } catch (error) {
    console.error('Error unarchiving project:', error);
    return res.status(500).json({ message: 'Server error unarchiving project.' });
  }
}

/**
 * Bookmark a project (Any authenticated user)
 * POST /api/projects/:id/bookmark
 */
export async function bookmarkProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const existingBookmark = await Bookmark.findOne({ userId: req.user.id, projectId: project._id });
    if (existingBookmark) {
      return res.status(400).json({ message: 'You already bookmarked this project.' });
    }

    await Bookmark.create({ userId: req.user.id, projectId: project._id });
    
    project.bookmarksCount = (project.bookmarksCount || 0) + 1;
    await project.save();

    return res.status(200).json({ message: 'Project bookmarked successfully.', bookmarksCount: project.bookmarksCount });
  } catch (error) {
    console.error('Error bookmarking project:', error);
    return res.status(500).json({ message: 'Server error bookmarking project.' });
  }
}

/**
 * Unbookmark a project (Any authenticated user)
 * POST /api/projects/:id/unbookmark
 */
export async function unbookmarkProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const bookmark = await Bookmark.findOneAndDelete({ userId: req.user.id, projectId: project._id });
    if (!bookmark) {
      return res.status(400).json({ message: 'You have not bookmarked this project.' });
    }

    if (project.bookmarksCount > 0) {
      project.bookmarksCount -= 1;
      await project.save();
    }

    // Since collections are a subset of bookmarks, remove this project from all user collections
    await Collection.updateMany(
      { userId: req.user.id },
      { $pull: { projects: project._id } }
    );

    return res.status(200).json({ message: 'Project unbookmarked successfully.', bookmarksCount: project.bookmarksCount });
  } catch (error) {
    console.error('Error unbookmarking project:', error);
    return res.status(500).json({ message: 'Server error unbookmarking project.' });
  }
}
