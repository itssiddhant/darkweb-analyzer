// src/utils/dataAdapters.js

/**
 * Transforms API response data for charts to the format expected by Recharts
 * @param {Object} apiResponse - The response from the visualization API endpoint
 * @returns {Array} - Formatted data ready for chart components
 */
export const transformIOCsData = (apiResponse) => {
    // Check if we have valid data
    if (!apiResponse || !apiResponse.data || !apiResponse.status === 'success') {
      console.warn('Invalid API response for IOCs chart', apiResponse);
      return [];
    }
  
    // The response has datasets array with a single dataset containing 'data' array
    const { labels, datasets } = apiResponse.data;
    
    // If no labels or no datasets, return empty array
    if (!labels || !labels.length || !datasets || !datasets.length || !datasets[0].data) {
      console.warn('Missing expected data structure in IOCs response', apiResponse);
      return [];
    }
  
    // Transform to Recharts format
    return labels.map((label, index) => ({
      name: label,
      value: datasets[0].data[index]
    }));
  };
  
  /**
   * Transforms sentiment analysis data for pie chart
   * @param {Object} apiResponse - The response from the visualization API endpoint
   * @returns {Array} - Formatted data ready for PieChart component
   */
  export const transformSentimentData = (apiResponse) => {
    if (!apiResponse || !apiResponse.data || !apiResponse.status === 'success') {
      console.warn('Invalid API response for sentiment chart', apiResponse);
      return [];
    }
  
    const { labels, datasets } = apiResponse.data;
    
    if (!labels || !labels.length || !datasets || !datasets.length || !datasets[0].data) {
      console.warn('Missing expected data structure in sentiment response', apiResponse);
      return [];
    }
  
    // Add colors for the pie chart
    const colors = {
      'negative': '#ef4444',  // red
      'neutral': '#f59e0b',   // amber
      'positive': '#10b981',  // emerald
      'unknown': '#6b7280'    // gray
    };
  
    return labels.map((label, index) => ({
      name: label,
      value: datasets[0].data[index],
      color: colors[label.toLowerCase()] || colors.unknown
    }));
  };
  
  /**
   * Transforms geolocation data for map visualization
   * @param {Object} apiResponse - The response from the visualization API endpoint
   * @returns {Array} - Formatted data ready for map component
   */
  export const transformGeoData = (apiResponse) => {
    if (!apiResponse || !apiResponse.data || !apiResponse.status === 'success') {
      console.warn('Invalid API response for geo chart', apiResponse);
      return [];
    }
  
    // For geolocation, the data structure is slightly different
    const { points } = apiResponse.data;
    
    if (!points || !Array.isArray(points)) {
      console.warn('Missing expected points array in geo response', apiResponse);
      return [];
    }
  
    // Transform to the format expected by our map component
    return points.map((point, index) => ({
      id: index,
      latitude: point.lat,
      longitude: point.lng,
      size: 5  // Default size for markers
    }));
  };
  
  /**
   * Checks if the API response contains actual data values
   * @param {Object} apiResponse - The response from any visualization API endpoint
   * @returns {Boolean} - True if there is actual data, false if empty or error
   */
  export const hasVisualizationData = (apiResponse) => {
    if (!apiResponse || apiResponse.status !== 'success') {
      return false;
    }
  
    // For standard charts (bar, pie)
    if (apiResponse.data.datasets && apiResponse.data.datasets.length > 0) {
      const dataValues = apiResponse.data.datasets[0].data;
      return dataValues && dataValues.length > 0 && dataValues.some(val => val > 0);
    }
    
    // For geo charts
    if (apiResponse.data.points) {
      return apiResponse.data.points && apiResponse.data.points.length > 0;
    }
    
    return false;
  };