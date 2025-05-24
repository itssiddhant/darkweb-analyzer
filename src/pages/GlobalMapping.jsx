import { useState, useEffect } from 'react';
import { getVisualizationData } from '../services/api';
import { Globe } from 'lucide-react';

const GlobalMapping = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        setLoading(true);
        const data = await getVisualizationData('geolocation');
        if (data.status === 'error') {
          throw new Error(data.message);
        }
        setGeoData(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching geolocation data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchGeoData();
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
        <Globe className="text-blue-500" size={24} />
        <h1 className="text-2xl font-bold">Global Threat Mapping</h1>
      </div>

      {geoData && geoData.points && geoData.points.length > 0 ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="h-[600px] bg-gray-900 rounded-lg flex items-center justify-center">
            {/* In a real implementation, this would be a map component */}
            <div className="text-center">
              <p className="text-gray-400 mb-2">Interactive map visualization would be here</p>
              <p className="text-sm text-gray-500">
                {geoData.points.length} threat locations detected worldwide
              </p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Threat Distribution</h3>
              <p className="text-gray-400">
                Threats are distributed across {new Set(geoData.points.map(p => p.country)).size} countries
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Hotspots</h3>
              <p className="text-gray-400">
                Top 3 threat locations:
                <ul className="list-disc list-inside mt-2">
                  {geoData.points
                    .slice(0, 3)
                    .map((point, index) => (
                      <li key={index} className="text-sm">
                        {point.country || 'Unknown location'}
                      </li>
                    ))}
                </ul>
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Threat Types</h3>
              <p className="text-gray-400">
                Various threat types detected including:
                <ul className="list-disc list-inside mt-2">
                  <li className="text-sm">Malware</li>
                  <li className="text-sm">Phishing</li>
                  <li className="text-sm">Exploits</li>
                </ul>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No geolocation data available
        </div>
      )}
    </div>
  );
};

export default GlobalMapping; 