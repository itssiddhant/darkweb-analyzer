import { useState, useEffect } from 'react';
import { getVisualizationData } from '../../services/api';
import { Shield } from 'lucide-react';

const IOCs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iocData, setIocData] = useState(null);

  useEffect(() => {
    const fetchIOCs = async () => {
      try {
        setLoading(true);
        const data = await getVisualizationData('iocs');
        if (data.status === 'error') {
          throw new Error(data.message);
        }
        setIocData(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching IOCs:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchIOCs();
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
        <Shield className="text-blue-500" size={24} />
        <h1 className="text-2xl font-bold">Indicators of Compromise (IOCs)</h1>
      </div>

      {iocData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">IP Addresses</h2>
            <div className="text-3xl font-bold text-blue-500">
              {iocData.datasets[0].data[0]}
            </div>
            <p className="text-gray-400 mt-2">Total IP addresses detected</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Domains</h2>
            <div className="text-3xl font-bold text-green-500">
              {iocData.datasets[0].data[1]}
            </div>
            <p className="text-gray-400 mt-2">Total domains detected</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No IOCs data available
        </div>
      )}
    </div>
  );
};

export default IOCs; 