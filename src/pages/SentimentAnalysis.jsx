import React, { useState, useEffect } from 'react';
import { getVisualizationData } from '../services/api';
import IOCsBarChart from '../components/charts/BarChart';
import SentimentPieChart from '../components/charts/PieChart';

const SentimentAnalysis = () => {
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        console.log('Fetching sentiment data...');
        const data = await getVisualizationData('sentiment');
        console.log('Received sentiment data:', data);
        setSentimentData(data);
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        setError('Failed to fetch sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-6">
        {error}
      </div>
    );
  }

  if (!sentimentData || !sentimentData.data) {
    return (
      <div className="text-center text-gray-400 p-6">
        No sentiment data available
      </div>
    );
  }

  // Calculate percentages for the key insights
  const total = sentimentData.data.datasets[0].data.reduce((a, b) => a + b, 0);
  const percentages = sentimentData.data.datasets[0].data.map(value => 
    total > 0 ? Math.round((value / total) * 100) : 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sentiment Analysis</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sentiment Distribution</h2>
          <div className="h-80">
            <IOCsBarChart data={sentimentData} />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sentiment Overview</h2>
          <div className="h-80">
            <SentimentPieChart data={sentimentData} />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium">Positive Sentiment</h3>
            <p className="text-2xl font-bold text-green-400">{percentages[0]}%</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium">Neutral Sentiment</h3>
            <p className="text-2xl font-bold text-yellow-400">{percentages[1]}%</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium">Negative Sentiment</h3>
            <p className="text-2xl font-bold text-red-400">{percentages[2]}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis; 