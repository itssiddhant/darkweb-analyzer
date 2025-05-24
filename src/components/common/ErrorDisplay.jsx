import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorDisplay = ({ message, retry = null }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-900 bg-opacity-20 rounded-lg">
      <AlertTriangle size={32} className="text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-500 mb-2">Error</h3>
      <p className="text-gray-300 text-center mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;