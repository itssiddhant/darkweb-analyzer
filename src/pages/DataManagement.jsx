import { useState, useEffect } from 'react';
import { getMonitorData } from '../services/api';
import { Database, RefreshCw, Trash2, Download } from 'lucide-react';

function exportToCSV() {
  const csvRows = [
    ['Type', 'Count'],
    ...chartData.map(row => [row.name, row.value])
  ];
  const csvContent = csvRows.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ioc_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function exportFullReport() {
  const res = await fetch('http://localhost:5000/export');
  const data = await res.json();

  // Flatten and format data for CSV
  const csvRows = [];
  const headers = [
    'URL', 'Timestamp', 'Sentiment', 'Topics', 'IPs', 'Domains', 'Emails', 'CVEs', 'Malware', 'Hackers', 'Geolocation'
  ];
  csvRows.push(headers);

  data.forEach(doc => {
    const iocs = doc.iocs || {};
    const geo = (doc.geolocation || []).map(g =>
      `${g.city || ''},${g.country || ''},${g.latitude || ''},${g.longitude || ''}`
    ).join(' | ');

    csvRows.push([
      doc.url,
      doc.timestamp,
      doc.sentiment?.label || '',
      (doc.topics || []).join('; '),
      (iocs.ips || []).join('; '),
      (iocs.domains || []).join('; '),
      (iocs.emails || []).join('; '),
      (iocs.cve || []).join('; '),
      (iocs.malware || []).join('; '),
      (iocs.hacker || []).join('; '),
      geo
    ]);
  });

  const csvContent = csvRows.map(e => e.map(x => `"${x}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'full_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const DataManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_docs: 0,
    processed_docs: 0,
    pending_docs: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getMonitorData();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
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
        <Database className="text-blue-500" size={24} />
        <h1 className="text-2xl font-bold">Data Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm mb-1">Total Documents</h3>
              <p className="text-3xl font-bold">{stats.total_docs}</p>
            </div>
            <div className="bg-blue-500 bg-opacity-20 p-3 rounded-lg">
              <Database size={24} className="text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm mb-1">Processed Documents</h3>
              <p className="text-3xl font-bold">{stats.processed_docs}</p>
            </div>
            <div className="bg-green-500 bg-opacity-20 p-3 rounded-lg">
              <RefreshCw size={24} className="text-green-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${stats.total_docs ? (stats.processed_docs / stats.total_docs * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm mb-1">Pending Documents</h3>
              <p className="text-3xl font-bold">{stats.pending_docs}</p>
            </div>
            <div className="bg-yellow-500 bg-opacity-20 p-3 rounded-lg">
              <RefreshCw size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${stats.total_docs ? (stats.pending_docs / stats.total_docs * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Data Operations</h2>
          <div className="space-y-4">
            <button onClick={exportToCSV} className="w-full flex items-center justify-between px-4 py-3 bg-blue-500 bg-opacity-20 text-blue-500 rounded-lg hover:bg-opacity-30 transition-colors">
              <span>Refresh Data</span>

              <RefreshCw size={20} />
            </button>
            <button
              onClick={exportFullReport}
              className="w-full flex items-center justify-between px-4 py-3 bg-green-500 bg-opacity-20 text-green-500 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <span>Export Full Report</span>
              <Download size={20} />
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-red-500 bg-opacity-20 text-red-500 rounded-lg hover:bg-opacity-30 transition-colors">
              <span>Clear Cache</span>
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">API Status</span>
              <span className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-500 rounded-md text-xs">
                Online
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Database Status</span>
              <span className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-500 rounded-md text-xs">
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Last Update</span>
              <span className="text-gray-400">
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement; 