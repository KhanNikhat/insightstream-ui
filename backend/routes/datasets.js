const express = require('express');
const router = express.Router();
const Dataset = require('../models/Dataset');

// 1. Upload dataset metadata
router.post('/upload', async (req, res) => {
  try {
    const { userId, filename, rowCount, columns } = req.body;

    if (!userId || !filename) {
      return res.status(400).json({ message: 'User ID and filename are required' });
    }

    const newDataset = await Dataset.create({
      user: userId,
      filename,
      rowCount,
      columns,
      chartConfigs: [],
      chatHistory: []
    });

    res.status(201).json(newDataset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Save a new chart to a dataset
router.post('/:id/charts', async (req, res) => {
  try {
    const { chartType, xAxis, yAxis, title, description } = req.body;
    const dataset = await Dataset.findById(req.params.id);

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    dataset.chartConfigs.push({ chartType, xAxis, yAxis, title, description });
    await dataset.save();

    res.status(200).json(dataset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Save a new chat message (User prompt or Gemini response)
router.post('/:id/chat', async (req, res) => {
  try {
    const { sender, text } = req.body; // sender: 'user' or 'ai'
    const dataset = await Dataset.findById(req.params.id);

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    dataset.chatHistory.push({ sender, text });
    await dataset.save();

    res.status(200).json(dataset.chatHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Fetch all datasets (including charts and chat history) for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const datasets = await Dataset.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Fetch a single dataset by ID with its charts and chat history
router.get('/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    res.status(200).json(dataset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;