// src/components/dashboard/LatestThreats.jsx
import { Link } from 'react-router-dom';
import { ExternalLink, Clock } from 'lucide-react';

const LatestThreats = ({ threats = [] }) => {
  // Format the processed_at date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
  
    try {
      // Truncate to 3 decimal places (milliseconds)
      const sanitized = dateString.replace(/\.(\d{3})\d*/, '.$1');
      const date = new Date(sanitized);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };
  

  if (!threats || threats.length === 0) {
    return (
      <div className="bg-gray-900 p-6 rounded-lg text-center">
        <p className="text-gray-400">No recent threats detected</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">URL</th>
            <th className="py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Detected At</th>
            <th className="py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IOCs</th>
            <th className="py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {threats.map((threat, index) => (
            <tr key={index} className="hover:bg-gray-700">
              <td className="py-4 whitespace-nowrap text-sm">
                <div className="flex items-center">
                  <span className="truncate max-w-xs">{threat.url}</span>
                </div>
              </td>
              <td className="py-4 whitespace-nowrap text-sm">
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  <span>{new Date(threat.timestamp).toLocaleString()}</span>
                </div>
              </td>
              <td className="py-4 whitespace-nowrap text-sm">
                <div className="flex flex-wrap gap-2">
                  {threat.iocs?.IP && threat.iocs.IP.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-blue-800 text-blue-200 text-xs">
                      {threat.iocs.IP.length} IPs
                    </span>
                  )}
                  {threat.iocs?.DOMAIN && threat.iocs.DOMAIN.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-purple-800 text-purple-200 text-xs">
                      {threat.iocs.DOMAIN.length} Domains
                    </span>
                  )}
                  {threat.iocs?.EMAIL && threat.iocs.EMAIL.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-red-800 text-red-200 text-xs">
                      {threat.iocs.EMAIL.length} Emails
                    </span>
                  )}
                  {threat.iocs?.CVE && threat.iocs.CVE.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-yellow-800 text-yellow-200 text-xs">
                      {threat.iocs.CVE.length} CVEs
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 whitespace-nowrap text-sm">
                <Link 
                  to={`/search?query=${encodeURIComponent(threat.url)}`}
                  className="text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <span>Details</span>
                  <ExternalLink size={14} className="ml-1" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LatestThreats;