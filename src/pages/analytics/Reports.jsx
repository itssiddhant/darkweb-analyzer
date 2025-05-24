import { useState, useEffect } from 'react';
import { getMonitorData, getVisualizationData } from '../../services/api';
import { FileText } from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    threats: [],
    iocs: null,
    sentiment: null
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Fetch all necessary data
        const [monitorData, iocData, sentimentData] = await Promise.all([
          getMonitorData(),
          getVisualizationData('iocs'),
          getVisualizationData('sentiment')
        ]);

        setReportData({
          threats: monitorData.latest_threats || [],
          iocs: iocData.status === 'error' ? null : iocData.data,
          sentiment: sentimentData.status === 'error' ? null : sentimentData.data
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchReportData();
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
        <FileText className="text-orange-500" size={24} />
        <h1 className="text-2xl font-bold">Threat Intelligence Report</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IOCs Summary */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">IOCs Summary</h2>
          {reportData.iocs ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg text-blue-500">IP Addresses</h3>
                <p className="text-3xl font-bold">{reportData.iocs.datasets[0].data[0]}</p>
              </div>
              <div>
                <h3 className="text-lg text-green-500">Domains</h3>
                <p className="text-3xl font-bold">{reportData.iocs.datasets[0].data[1]}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No IOCs data available</p>
          )}
        </div>

        {/* Sentiment Summary */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sentiment Analysis</h2>
          {reportData.sentiment ? (
            <div className="space-y-4">
              {reportData.sentiment.labels.map((label, index) => (
                <div key={label}>
                  <h3 className="text-lg" style={{ color: reportData.sentiment.datasets[0].backgroundColor[index] }}>
                    {label}
                  </h3>
                  <p className="text-3xl font-bold">
                    {reportData.sentiment.datasets[0].data[index]}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No sentiment data available</p>
          )}
        </div>
      </div>

      {/* Latest Threats */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Threats</h2>
        {reportData.threats.length > 0 ? (
          <div className="space-y-4">
            {reportData.threats.map((threat, index) => (
              <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{threat.url}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(threat.processed_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {threat.iocs && Object.entries(threat.iocs).map(([type, values]) => (
                      <span key={type} className="px-2 py-1 bg-orange-500 bg-opacity-20 text-orange-500 rounded-md text-xs">
                        {type}: {Array.isArray(values) ? values.length : 0}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No recent threats detected</p>
        )}
      </div>
    </div>
  );
};

export default Reports; 