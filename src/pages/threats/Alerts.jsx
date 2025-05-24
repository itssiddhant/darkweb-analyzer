import { useState, useEffect } from 'react';
import { getMonitorData } from '../../services/api';
import { Bell } from 'lucide-react';

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await getMonitorData();
        // For now, we'll use the latest threats as alerts
        // In a real implementation, this would come from a dedicated alerts endpoint
        setAlerts(data.latest_threats || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAlerts();
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
        <Bell className="text-red-500" size={24} />
        <h1 className="text-2xl font-bold">Alerts</h1>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No active alerts
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{alert.url}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(alert.processed_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {alert.iocs && Object.entries(alert.iocs).map(([type, values]) => (
                    <span key={type} className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-500 rounded-md text-xs">
                      {type}: {Array.isArray(values) ? values.length : 0}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts; 