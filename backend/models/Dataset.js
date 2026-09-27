const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: { 
    type: String, 
    required: true 
  },
  rowCount: { 
    type: Number, 
    default: 0 
  },
  columns: [{ 
    type: String 
  }],

  // 1. Array to store generated/saved charts
  chartConfigs: [
    {
      chartType: { 
        type: String, 
        enum: ['bar', 'line', 'pie', 'scatter', 'area'], 
        required: true 
      },
      xAxis: { type: String, required: true },
      yAxis: { type: String, required: true },
      title: { type: String, default: 'Custom Chart' },
      description: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // 2. Array to store Gemini AI chat conversations
  chatHistory: [
    {
      sender: { 
        type: String, 
        enum: ['user', 'ai'], 
        required: true 
      },
      text: { 
        type: String, 
        required: true 
      },
      timestamp: { 
        type: Date, 
        default: Date.now 
      }
    }
  ],

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Dataset', datasetSchema);