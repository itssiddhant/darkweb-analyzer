import { useState, useEffect } from 'react';
import { getVisualizationData } from '../../services/api';
import { MapPin } from 'lucide-react';

const Geolocation = () => {
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
        <MapPin className="text-green-500" size={24} />
        <h1 className="text-2xl font-bold">Geolocation Analysis</h1>
      </div>

      {geoData && geoData.points && geoData.points.length > 0 ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Threat Distribution</h2>
          <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center">
            {/* In a real implementation, this would be a map component */}
            <div className="text-center">
              <p className="text-gray-400 mb-2">Map visualization would be here</p>
              <p className="text-sm text-gray-500">
                {geoData.points.length} locations detected
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

export default Geolocation; 