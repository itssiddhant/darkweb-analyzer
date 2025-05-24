import { AlertTriangle, Shield, Globe, Clock } from 'lucide-react';

const OTXDetails = ({ data }) => {
  if (!data) return null;
  console.log("OTXDetails input data:", data);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Shield className="text-blue-500 mr-2" size={20} />
        OTX Threat Intelligence
      </h3>
      
      {data.pulse_info && (
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Clock className="text-gray-400 mr-2" size={16} />
            <span className="text-gray-400">Last Updated: </span>
            <span className="ml-2">{new Date(data.pulse_info.modified).toLocaleString()}</span>
          </div>
          
          {data.pulse_info.tags && data.pulse_info.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.pulse_info.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-500 rounded-md text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {data.pulse_info.description && (
            <p className="text-gray-300 text-sm">
              {data.pulse_info.description}
            </p>
          )}
          
          {data.pulse_info.references && data.pulse_info.references.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2">References:</h4>
              <ul className="space-y-1">
                {data.pulse_info.references.map((ref, index) => (
                  <li key={index}>
                    <a 
                      href={ref} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm break-all"
                    >
                      {ref}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {data.base_indicator && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Base Indicator:</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <AlertTriangle className="text-yellow-500 mr-2" size={16} />
              <span className="text-gray-400">Type: </span>
              <span className="ml-2 text-gray-300">{data.base_indicator.type}</span>
            </div>
            <div className="flex items-center text-sm">
              <Globe className="text-green-500 mr-2" size={16} />
              <span className="text-gray-400">Value: </span>
              <span className="ml-2 text-gray-300">{data.base_indicator.indicator}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTXDetails; 