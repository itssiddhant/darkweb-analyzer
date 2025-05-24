import { useState, useEffect } from 'react';
import { getMonitorData } from '../../services/api';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import OTXDetails from '../../components/threats/OTXDetails';

const LatestThreats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [threats, setThreats] = useState([]);

  const fetchThreats = async () => {
    try {
      setLoading(true);
      const data = await getMonitorData();
      setThreats(data.threats || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center text-red-500">
          <AlertCircle className="mr-2" size={24} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Latest Threats</h2>
        <button
          onClick={fetchThreats}
          className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
        >
          <RefreshCw className="mr-2" size={16} />
          Refresh
        </button>
      </div>
      
      {threats.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No threats found. Please check back later.
        </div>
      ) : (
        <div className="grid gap-6">
          {threats.map((threat, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{threat.url}</h3>
                <span className="text-sm text-gray-400">
                  {new Date(threat.timestamp).toLocaleString()}
                </span>
              </div>
              
              {threat.iocs && Object.keys(threat.iocs).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Indicators of Compromise:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(threat.iocs).map(([type, values]) => (
                      <span key={type} className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-500 rounded-md text-xs">
                        {type}: {Array.isArray(values) ? values.length : 0}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {threat.otx_data && <OTXDetails data={threat.otx_data} />}
              
              {threat.sentiment && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Sentiment Analysis:</h4>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-md text-xs ${
                      threat.sentiment.label === 'positive' ? 'bg-green-500 bg-opacity-20 text-green-500' :
                      threat.sentiment.label === 'negative' ? 'bg-red-500 bg-opacity-20 text-red-500' :
                      'bg-yellow-500 bg-opacity-20 text-yellow-500'
                    }`}>
                      {threat.sentiment.label}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">
                      Score: {threat.sentiment.score}
                    </span>
                  </div>
                </div>
              )}
              
              {/* {threat.topics && threat.topics.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Related Topics:</h4>
                  <div className="flex flex-wrap gap-2">
                    {threat.topics.map((topic, topicIndex) => (
                      <span key={topicIndex} className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-500 rounded-md text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestThreats; 