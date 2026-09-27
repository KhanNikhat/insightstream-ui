const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// GET /api/projects - Fetch all saved project sessions
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ updatedAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch saved projects from MongoDB' });
  }
});

// GET /api/projects/:userId - Fetch sessions for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ error: 'Failed to fetch user projects from MongoDB' });
  }
});

// POST /api/projects/save - Create or update a project session
router.post('/save', async (req, res) => {
  try {
    const {
      id,
      userId,
      title,
      datasetName,
      rowCount,
      colCount,
      completeness,
      chartConfig,
      rawDataset,
      chatHistory,
      notes
    } = req.body;

    // Update existing session if ID is provided
    if (id) {
      const updatedProject = await Project.findByIdAndUpdate(
        id,
        { title, datasetName, rowCount, colCount, completeness, chartConfig, rawDataset, chatHistory, notes },
        { new: true }
      );
      return res.status(200).json(updatedProject);
    }

    // Create a new session snapshot
    const newProject = new Project({
      userId: userId || 'default_user',
      title,
      datasetName,
      rowCount,
      colCount,
      completeness,
      chartConfig,
      rawDataset,
      chatHistory,
      notes
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error saving project:', error);
    res.status(500).json({ error: 'Failed to save project session to MongoDB' });
  }
});

// DELETE /api/projects/:id - Delete a session by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) {
      return res.status(404).json({ error: 'Project session not found' });
    }
    res.status(200).json({ message: 'Project session deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project session' });
  }
});

module.exports = router;