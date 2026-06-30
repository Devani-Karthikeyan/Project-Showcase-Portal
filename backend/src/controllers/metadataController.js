import University from '../models/University.js';
import DegreeProgram from '../models/DegreeProgram.js';

// --- PUBLIC METADATA CONTROLLERS ---

/**
 * Get all universities
 * GET /api/universities
 */
export async function getUniversities(req, res) {
  try {
    const universities = await University.find().sort({ name: 1 });
    return res.status(200).json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    return res.status(500).json({ message: 'Server error fetching universities.' });
  }
}

/**
 * Get all degree programs
 * GET /api/degree-programs
 */
export async function getDegreePrograms(req, res) {
  try {
    const programs = await DegreeProgram.find().populate('universities').sort({ name: 1 });
    return res.status(200).json(programs);
  } catch (error) {
    console.error('Error fetching degree programs:', error);
    return res.status(500).json({ message: 'Server error fetching degree programs.' });
  }
}

// --- ADMIN METADATA CONTROLLERS ---

/**
 * Create a new university
 * POST /api/admin/universities
 */
export async function createUniversity(req, res) {
  try {
    const { name, location } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'University name is required.' });
    }

    const existing = await University.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'University already exists.' });
    }

    const university = await University.create({ name, location });
    return res.status(201).json({ message: 'University created successfully.', university });
  } catch (error) {
    console.error('Error creating university:', error);
    return res.status(500).json({ message: 'Server error creating university.' });
  }
}

/**
 * Delete a university
 * DELETE /api/admin/universities/:id
 */
export async function deleteUniversity(req, res) {
  try {
    const university = await University.findByIdAndDelete(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found.' });
    }
    return res.status(200).json({ message: 'University deleted successfully.' });
  } catch (error) {
    console.error('Error deleting university:', error);
    return res.status(500).json({ message: 'Server error deleting university.' });
  }
}

/**
 * Create a new degree program
 * POST /api/admin/degree-programs
 */
export async function createDegreeProgram(req, res) {
  try {
    const { name, code } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Degree program name is required.' });
    }

    const existing = await DegreeProgram.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Degree program already exists.' });
    }

    const program = await DegreeProgram.create({ name, code });
    return res.status(201).json({ message: 'Degree program created successfully.', program });
  } catch (error) {
    console.error('Error creating degree program:', error);
    return res.status(500).json({ message: 'Server error creating degree program.' });
  }
}

/**
 * Delete a degree program
 * DELETE /api/admin/degree-programs/:id
 */
export async function deleteDegreeProgram(req, res) {
  try {
    const program = await DegreeProgram.findByIdAndDelete(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Degree program not found.' });
    }
    return res.status(200).json({ message: 'Degree program deleted successfully.' });
  } catch (error) {
    console.error('Error deleting degree program:', error);
    return res.status(500).json({ message: 'Server error deleting degree program.' });
  }
}

/**
 * Update university details (Admin only)
 * PUT /api/admin/universities/:id
 */
export async function updateUniversity(req, res) {
  try {
    const { name, location } = req.body;
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found.' });
    }

    if (name) university.name = name;
    if (location !== undefined) university.location = location;

    await university.save();
    return res.status(200).json({ message: 'University updated successfully.', university });
  } catch (error) {
    console.error('Error updating university:', error);
    return res.status(500).json({ message: 'Server error updating university.' });
  }
}

/**
 * Update degree program details and assign to universities (Admin only)
 * PUT /api/admin/degree-programs/:id
 */
export async function updateDegreeProgram(req, res) {
  try {
    const { name, code, universities } = req.body;
    const program = await DegreeProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Degree program not found.' });
    }

    if (name) program.name = name;
    if (code !== undefined) program.code = code;
    if (universities && Array.isArray(universities)) {
      program.universities = universities;
    }

    await program.save();
    const updated = await DegreeProgram.findById(program._id).populate('universities');
    return res.status(200).json({ message: 'Degree program updated successfully.', program: updated });
  } catch (error) {
    console.error('Error updating degree program:', error);
    return res.status(500).json({ message: 'Server error updating degree program.' });
  }
}
