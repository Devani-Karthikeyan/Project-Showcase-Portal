import Collection from '../models/Collection.js';
import Project from '../models/Project.js';
import Bookmark from '../models/Bookmark.js';

/**
 * Helper to ensure projects in a collection are also bookmarked
 */
async function ensureBookmarked(userId, projectIds) {
  if (!projectIds || projectIds.length === 0) return;
  
  const existingBookmarks = await Bookmark.find({ 
    userId, 
    projectId: { $in: projectIds } 
  });
  
  const existingIds = existingBookmarks.map(b => b.projectId.toString());
  const newProjectIds = projectIds.filter(id => !existingIds.includes(id.toString()));
  
  if (newProjectIds.length > 0) {
    const bookmarksToCreate = newProjectIds.map(projectId => ({
      userId,
      projectId
    }));
    await Bookmark.insertMany(bookmarksToCreate);
    
    // Increment bookmarksCount for newly bookmarked projects
    await Project.updateMany(
      { _id: { $in: newProjectIds } },
      { $inc: { bookmarksCount: 1 } }
    );
  }
}

/**
 * Get all collections for the logged-in user
 * GET /api/collections
 */
export async function getCollections(req, res) {
  try {
    const collections = await Collection.find({ userId: req.user.id })
      .populate('projects', 'title thumbnail')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return res.status(500).json({ message: 'Server error fetching collections.' });
  }
}

/**
 * Create a new collection
 * POST /api/collections
 */
export async function createCollection(req, res) {
  try {
    const { name, description, visibility, colorTheme, icon, tags, projects } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Collection name is required.' });
    }

    const newCollection = await Collection.create({
      userId: req.user.id,
      name,
      description: description || '',
      visibility: visibility || 'private',
      colorTheme: colorTheme || 'indigo',
      icon: icon || 'Folder',
      tags: tags || [],
      projects: projects || []
    });

    if (projects && projects.length > 0) {
      await ensureBookmarked(req.user.id, projects);
    }

    return res.status(201).json(newCollection);
  } catch (error) {
    console.error('Error creating collection:', error);
    return res.status(500).json({ message: 'Server error creating collection.' });
  }
}

/**
 * Update a collection
 * PUT /api/collections/:id
 */
export async function updateCollection(req, res) {
  try {
    const { name, description, visibility, colorTheme, icon, tags, projects } = req.body;
    const collection = await Collection.findOne({ _id: req.params.id, userId: req.user.id });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found or unauthorized.' });
    }

    if (name) collection.name = name;
    if (description !== undefined) collection.description = description;
    if (visibility) collection.visibility = visibility;
    if (colorTheme) collection.colorTheme = colorTheme;
    if (icon) collection.icon = icon;
    if (tags) collection.tags = tags;
    if (projects) {
      collection.projects = projects;
      await ensureBookmarked(req.user.id, projects);
    }

    await collection.save();

    return res.status(200).json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    return res.status(500).json({ message: 'Server error updating collection.' });
  }
}

/**
 * Delete a collection
 * DELETE /api/collections/:id
 */
export async function deleteCollection(req, res) {
  try {
    const collection = await Collection.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found or unauthorized.' });
    }

    return res.status(200).json({ message: 'Collection deleted successfully.' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return res.status(500).json({ message: 'Server error deleting collection.' });
  }
}
