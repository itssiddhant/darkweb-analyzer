// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { getMonitorData, getVisualizationData } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';
import IOCsBarChart from '../components/charts/BarChart';
import SentimentPieChart from '../components/charts/PieChart';
import GeoMap from '../components/charts/GeoMap';
import { AlertTriangle, Database, Server, Globe } from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monitorData, setMonitorData] = useState({
    total_docs: 0,
    processed_docs: 0,
    pending_docs: 0
  });
  const [iocData, setIocData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [latestThreats, setLatestThreats] = useState([]);
  
  // For debugging
  const [debugInfo, setDebugInfo] = useState({
    showDebug: false,
    apiResponses: {}
  });
  
  const websocketUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:5000/ws/processor`;
  const { isConnected, data: wsData } = useWebSocket(websocketUrl);
  
  // Toggle debug information
  const toggleDebug = () => {
    setDebugInfo(prev => ({
      ...prev,
      showDebug: !prev.showDebug
    }));
  };
  
  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get monitor data
        const monitor = await getMonitorData();
        setMonitorData(monitor);
        
        // Get IOCs data
        const iocs = await getVisualizationData('iocs');
        if (iocs.status === 'error') {
          throw new Error(iocs.message);
        }
        setIocData(iocs);
        setDebugInfo(prev => ({
          ...prev,
          apiResponses: {
            ...prev.apiResponses,
            iocs
          }
        }));
        
        // Get sentiment data
        const sentiment = await getVisualizationData('sentiment');
        if (sentiment.status === 'error') {
          throw new Error(sentiment.message);
        }
        setSentimentData(sentiment);
        setDebugInfo(prev => ({
          ...prev,
          apiResponses: {
            ...prev.apiResponses,
            sentiment
          }
        }));
        
        // Get geolocation data
        const geo = await getVisualizationData('geolocation');
        if (geo.status === 'error') {
          throw new Error(geo.message);
        }
        setGeoData(geo);
        setDebugInfo(prev => ({
          ...prev,
          apiResponses: {
            ...prev.apiResponses,
            geo
          }
        }));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Update data from WebSocket
  useEffect(() => {
    if (wsData && wsData.type === 'status_update') {
      setMonitorData(prevData => ({
        ...prevData,
        processed_docs: wsData.data.processed,
        pending_docs: wsData.data.pending
      }));
      
      if (wsData.data.latest_threats) {
        setLatestThreats(wsData.data.latest_threats);
      }
    }
  }, [wsData]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-yellow-500" size={24} />
            <h1 className="text-xl font-bold">DarkWeb Intelligence Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1 rounded" 
              onClick={toggleDebug}
            >
              {debugInfo.showDebug ? 'Hide Debug' : 'Debug'}
            </button>
            <div className={`rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500 bg-opacity-20 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Total Documents</h3>
                    <p className="text-3xl font-bold">{monitorData.total_docs}</p>
                  </div>
                  <div className="bg-blue-500 bg-opacity-20 p-3 rounded-lg">
                    <Database size={24} className="text-blue-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Processed Documents</h3>
                    <p className="text-3xl font-bold">{monitorData.processed_docs}</p>
                  </div>
                  <div className="bg-green-500 bg-opacity-20 p-3 rounded-lg">
                    <Server size={24} className="text-green-500" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${monitorData.total_docs ? (monitorData.processed_docs / monitorData.total_docs * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Pending Documents</h3>
                    <p className="text-3xl font-bold">{monitorData.pending_docs}</p>
                  </div>
                  <div className="bg-yellow-500 bg-opacity-20 p-3 rounded-lg">
                    <AlertTriangle size={24} className="text-yellow-500" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${monitorData.total_docs ? (monitorData.pending_docs / monitorData.total_docs * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Debug Information */}
            {debugInfo.showDebug && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 overflow-auto max-h-96">
                <h3 className="text-gray-300 font-semibold mb-2">API Response Debug</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-blue-400 text-sm mb-1">IOCs Response:</h4>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.apiResponses.iocs, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-blue-400 text-sm mb-1">Sentiment Response:</h4>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.apiResponses.sentiment, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-blue-400 text-sm mb-1">Geo Response:</h4>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.apiResponses.geo, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">IOCs Distribution</h2>
                <IOCsBarChart data={iocData} />
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Sentiment Analysis</h2>
                <SentimentPieChart data={sentimentData} />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Geolocation Distribution</h2>
              <GeoMap data={geoData} />
            </div>
            
            {/* Latest Threats */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Latest Threats</h2>
              {latestThreats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">URL</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Processed At</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IOCs</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestThreats.map((threat, index) => (
                        <tr key={index} className="border-b border-gray-700">
                          <td className="py-4 px-4 text-sm">{threat.url}</td>
                          <td className="py-4 px-4 text-sm">{new Date(threat.timestamp).toLocaleString()}</td>
                          <td className="py-4 px-4 text-sm">
                            {threat.iocs && Object.entries(threat.iocs).map(([type, values]) => (
                              <span key={type} className="mr-2 px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-500 rounded-md">
                                {type}: {Array.isArray(values) ? values.length : 0}
                              </span>
                            ))}
                          </td>
                          <td className="py-4 px-4">
                            <button className="text-blue-500 hover:text-blue-400 text-sm">View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  No recent threats detected
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;