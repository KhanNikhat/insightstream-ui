const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default_user' },
    title: { type: String, required: true },
    datasetName: { type: String, required: true },
    rowCount: { type: Number, default: 0 },
    colCount: { type: Number, default: 0 },
    completeness: { type: String, default: '100%' },
    chartConfig: {
      type: { type: String, default: 'bar' },
      xAxis: { type: String, default: '' },
      yAxis: { type: String, default: '' }
    },
    rawDataset: { type: Array, required: true },  // Full parsed CSV dataset
    chatHistory: { type: Array, default: [] },    // AI prompt/response threads
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);