import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add retry logic
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If the error is due to network issues and we haven't retried yet
    if (!originalRequest._retry && error.code === 'ECONNABORTED') {
      originalRequest._retry = true;
      return apiClient(originalRequest);
    }
    
    throw error;
  }
);

export const searchThreatData = async (query) => {
  try {
    const response = await apiClient.get(`/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching threat data:', error);
    throw new Error(error.response?.data?.message || 'Failed to search threat data');
  }
};

export const getVisualizationData = async (type = 'iocs') => {
  try {
    const response = await apiClient.get(`/visualize?type=${type}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting ${type} visualization:`, error);
    throw new Error(error.response?.data?.message || `Failed to get ${type} visualization`);
  }
};

export const getMonitorData = async () => {
  try {
    const response = await apiClient.get('/monitor');
    return response.data;
  } catch (error) {
    console.error('Error getting monitor data:', error);
    throw new Error(error.response?.data?.message || 'Failed to get monitor data');
  }
};

export const getTopics = async () => {
  try {
    const response = await apiClient.get('/topics');
    return response.data;
  } catch (error) {
    console.error('Error getting topics:', error);
    throw new Error(error.response?.data?.message || 'Failed to get topics');
  }
};

export const getTopicDocuments = async (topicId) => {
  try {
    const response = await apiClient.get(`/topics/${topicId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting documents for topic ${topicId}:`, error);
    throw new Error(error.response?.data?.message || `Failed to get documents for topic ${topicId}`);
  }
};