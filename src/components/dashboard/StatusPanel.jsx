// src/components/dashboard/StatusPanel.jsx
import { Server, AlertTriangle, Check } from 'lucide-react';

const StatusPanel = ({ totalDocs, processedDocs, pendingDocs, isConnected }) => {
  const processingPercentage = (processedDocs / totalDocs) * 100 || 0;
  
  return (
    <>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-gray-400 text-sm">Processed Documents</h3>
            <p className="text-3xl font-bold text-white">{processedDocs}</p>
          </div>
          <div className="bg-green-500 bg-opacity-20 p-3 rounded-lg">
            <Server size={24} className="text-green-500" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs text-gray-400">{processingPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${processingPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-gray-400 text-sm">Pending Documents</h3>
            <p className="text-3xl font-bold text-white">{pendingDocs}</p>
          </div>
          <div className="bg-yellow-500 bg-opacity-20 p-3 rounded-lg">
            <AlertTriangle size={24} className="text-yellow-500" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Queue Status</span>
            <span className="text-xs text-gray-400">{pendingDocs > 0 ? "Processing" : "Complete"}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${pendingDocs > 0 ? 100 - processingPercentage : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-gray-400 text-sm">Connection Status</h3>
            <p className="text-3xl font-bold text-white">{isConnected ? "Connected" : "Disconnected"}</p>
          </div>
          <div className={`${isConnected ? 'bg-green-500' : 'bg-red-500'} bg-opacity-20 p-3 rounded-lg`}>
            <Check size={24} className={isConnected ? 'text-green-500' : 'text-red-500'} />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Real-time Updates</span>
            <span className="text-xs text-gray-400">{isConnected ? "Active" : "Inactive"}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`${isConnected ? 'bg-green-500' : 'bg-red-500'} h-2 rounded-full`} 
              style={{ width: isConnected ? '100%' : '0%' }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatusPanel;