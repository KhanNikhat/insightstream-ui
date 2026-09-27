const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Node.js to use Google Public DNS
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Import Route Handlers
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const datasetRoutes = require('./routes/datasets');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Diagnostic Check for Gemini API Key
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
console.log("Diagnostic Check - API Key:", apiKey ? "Key successfully loaded!" : "DANGER: KEY IS MISSING!");

// 2. Core Middleware (50mb limit to handle saving full raw CSV datasets to MongoDB)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Mount Authentication & Project History APIs
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/datasets', datasetRoutes);

// 4. Initialize Gemini AI Model
const genAI = new GoogleGenerativeAI(apiKey);
const aiModel = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

// Configure Multer for File Uploads
const upload = multer({ dest: 'uploads/' });

// Fallback in-memory dataset storage
let currentDataset = [];

// --- DATA PIPELINE (CSV File Upload) ---
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results = [];
  const filePath = path.join(__dirname, req.file.path);

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      currentDataset = results;
      console.log(`Successfully parsed ${results.length} rows.`);
      
      // Clean up temp file safely
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });

      res.json({
        message: 'File parsed successfully!',
        filename: req.file.originalname,
        data: results 
      });
    })
    .on('error', (err) => res.status(500).json({ error: 'Failed to parse file.' }));
});

// --- AI PIPELINE (Gemini Analytics & Chart Assistant) ---
app.post('/api/chat', async (req, res) => {
  try {
    const { question, dataset } = req.body;

    // Use dataset provided in request payload (from active session/MongoDB), fallback to uploaded CSV
    const activeDataset = (dataset && dataset.length > 0) ? dataset : currentDataset;

    if (!activeDataset || !activeDataset.length) {
      return res.status(400).json({ error: 'Please upload a CSV file or select a project session first.' });
    }

    console.log(`Sending question to AI: "${question}"`);

    // Convert dataset array into CSV string context for AI (slice first 100 rows if dataset is massive)
    const datasetSample = activeDataset.slice(0, 150);
    const csvHeaders = Object.keys(datasetSample[0]).join(',');
    const csvRows = datasetSample.map(row => Object.values(row).join(',')).join('\n');
    const cleanCsvDataContext = `${csvHeaders}\n${csvRows}`;

    // Master AI Prompt
    const prompt = `
      You are an expert AI data analyst controlling a React dashboard UI.
      
      Here is the dataset context in CSV format:
      ${cleanCsvDataContext}
      
      User Question: "${question}"
      
      RULE 1: TEXT ANSWERS
      If the user asks for insights, summaries, or general questions, respond with concise, accurate text formatted nicely in Markdown.
      
      RULE 2: CHART GENERATION
      If the user explicitly asks for a graph, chart, or visualization, respond with ONLY a valid raw JSON object.
      
      AVAILABLE CHART TYPES: "bar", "line", "area", "scatter", "pie".
      
      JSON SCHEMA FORMAT:
      {
        "intent": "chart",
        "chartType": "bar", 
        "title": "A descriptive title",
        "data": [
          {"name": "Item Name", "value": 123},
          {"name": "Item Name 2", "value": 456}
        ]
      }
    `;

    console.time("Gemini-API-Time");
    const result = await aiModel.generateContent(prompt);
    console.timeEnd("Gemini-API-Time");

    const response = await result.response;
    let aiAnswer = response.text().trim();

    // Clean up markdown code block wrappers if present (e.g. ```json ... ```)
    if (aiAnswer.startsWith("```")) {
      aiAnswer = aiAnswer.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    console.log("AI Answered Successfully!");
    res.json({ answer: aiAnswer });

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: 'The AI failed to process the request.' });
  }
});

// --- DATABASE CONNECTION & SERVER START ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
  });