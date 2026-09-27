const API_URL = 'http://localhost:5000/api/datasets';

export const datasetService = {
  // Upload CSV metadata
  async saveDatasetMetadata(userId, filename, rowCount, columns) {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, filename, rowCount, columns }),
    });
    return response.json();
  },

  // Save a created chart config
  async saveChartConfig(datasetId, chartData) {
    const response = await fetch(`${API_URL}/${datasetId}/charts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chartData),
    });
    return response.json();
  },

  // Save a chat message (User question or AI answer)
  async saveChatMessage(datasetId, sender, text) {
    const response = await fetch(`${API_URL}/${datasetId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, text }),
    });
    return response.json();
  },

  // Fetch all saved datasets for user
  async getUserDatasets(userId) {
    const response = await fetch(`${API_URL}/user/${userId}`);
    return response.json();
  },

  // Fetch single dataset by ID
  async getDatasetById(datasetId) {
    const response = await fetch(`${API_URL}/${datasetId}`);
    return response.json();
  }
};