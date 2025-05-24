import { useState, useEffect } from 'react';
import { getMonitorData } from '../../services/api';
import { Clock } from 'lucide-react';

const Timeline = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        const data = await getMonitorData();
        // For now, we'll use the latest threats as timeline data
        // In a real implementation, this would come from a dedicated timeline endpoint
        setTimelineData(data.latest_threats || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching timeline data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500 bg-opacity-20 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Clock className="text-purple-500" size={24} />
        <h1 className="text-2xl font-bold">Threat Timeline</h1>
      </div>

      {timelineData.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No timeline data available
        </div>
      ) : (
        <div className="space-y-4">
          {timelineData.map((event, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{event.url}</h3>
                    <span className="text-sm text-gray-400">
                      {new Date(event.processed_at).toLocaleString()}
                    </span>
                  </div>
                  {event.iocs && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(event.iocs).map(([type, values]) => (
                        <span key={type} className="px-2 py-1 bg-purple-500 bg-opacity-20 text-purple-500 rounded-md text-xs">
                          {type}: {Array.isArray(values) ? values.length : 0}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline; 