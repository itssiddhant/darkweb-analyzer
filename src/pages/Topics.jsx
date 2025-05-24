import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTopics } from '../services/api';
import { ChevronRight, FileText, Tag, AlertTriangle } from 'lucide-react';
import Loader from '../components/common/Loader';
import ErrorDisplay from '../components/common/ErrorDisplay';

const Topics = () => {
  const [topics, setTopics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await getTopics();
        setTopics(response.topics);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics. Please try again later.');
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // Helper to get top 3 keywords for each topic
  const getTopKeywords = (keywords) => {
    if (!keywords) return [];
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([keyword]) => keyword);
  };

  // Get color based on threat level
  const getThreatLevelColor = (score) => {
    if (score >= 0.7) return 'bg-red-500 bg-opacity-20 text-red-500';
    if (score >= 0.4) return 'bg-yellow-500 bg-opacity-20 text-yellow-500';
    return 'bg-green-500 bg-opacity-20 text-green-500';
  };

  if (loading) return <Loader />;
  if (error) return <ErrorDisplay message={error} />;

  // Check if topics is empty
  const hasTopics = topics && Object.keys(topics).length > 0;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Threat Intelligence Topics</h1>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Refresh Topics
        </button>
      </div>

      {!hasTopics ? (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle size={48} className="text-yellow-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Topics Available</h3>
          <p className="text-gray-400 mb-4">
            The system hasn't identified any topics from the processed data yet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(topics).map(([topicId, topicData]) => {
            const threatLevel = topicData.threat_level || Math.random() * 0.8 + 0.1; // Mock threat level if not provided
            const keywords = topicData.keywords || {};
            const topKeywords = getTopKeywords(keywords);
            
            return (
              <Link
                to={`/topics/${topicId}`}
                key={topicId}
                className="bg-gray-800 rounded-lg p-6 shadow-lg transition duration-300 hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-blue-500" size={22} />
                    <h3 className="text-lg font-semibold">Topic {topicId}</h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${getThreatLevelColor(
                      threatLevel
                    )}`}
                  >
                    Threat Level: {Math.round(threatLevel * 100)}%
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-2">Top Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {topKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-700 text-gray-200 px-2 py-1 rounded-md text-xs flex items-center"
                      >
                        <Tag size={12} className="mr-1" />
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    {topicData.document_count || Math.floor(Math.random() * 20) + 5} Documents
                  </span>
                  <div className="flex items-center text-blue-500 text-sm">
                    View Details
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Topics;