// src/components/dashboard/SearchResults.jsx
import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import OTXDetails from '../threats/OTXDetails';

const SearchResults = ({ results = { data: [], status: '' } }) => {
  const [expandedItem, setExpandedItem] = useState(null);
  console.log("Rendering SearchResults", results);

  // Extract and validate the data array from results
  let searchResults = [];
  if (results && results.data) {
    // If data is an array, use it directly
    if (Array.isArray(results.data)) {
      searchResults = results.data;
    }
    // If data is an object with a results array, use that
    else if (results.data.results && Array.isArray(results.data.results)) {
      searchResults = results.data.results;
    }
    // If data is an object with a data array, use that
    else if (results.data.data && Array.isArray(results.data.data)) {
      searchResults = results.data.data;
    }
  }

  console.log("Processed search results:", searchResults);

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg text-center">
        <AlertCircle size={32} className="mx-auto mb-2 text-yellow-500" />
        <p className="text-gray-300">No results found. Try adjusting your search query.</p>
      </div>
    );
  }

  const toggleExpand = (index) => {
    if (expandedItem === index) {
      setExpandedItem(null);
    } else {
      setExpandedItem(index);
    }
  };

  return (
    <div className="space-y-4">
      {searchResults.map((item, index) => (
        <div key={index} className="bg-gray-800 rounded-lg overflow-hidden shadow-md">
          <div 
            className="p-4 cursor-pointer flex justify-between items-center"
            onClick={() => toggleExpand(index)}
          >
            <div>
              <h3 className="text-lg font-medium text-white">{item.title || 'Untitled Document'}</h3>
              <p className="text-sm text-gray-400 truncate">{item.url}</p>
            </div>
            <div className="flex items-center">
              {expandedItem === index ? 
                <ChevronUp size={20} className="text-gray-400" /> : 
                <ChevronDown size={20} className="text-gray-400" />
              }
            </div>
          </div>

          {expandedItem === index && (
            <div className="p-4 border-t border-gray-700">
              {/* Content Preview */}
              {item.clean_text && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Content Preview:</h4>
                  <p className="text-gray-300 text-sm bg-gray-900 p-3 rounded-md max-h-36 overflow-y-auto">
                    {item.clean_text.length > 300 
                      ? `${item.clean_text.substring(0, 300)}...` 
                      : item.clean_text
                    }
                  </p>
                </div>
              )}

              {/* IOCs Section */}
              {item.iocs && Object.keys(item.iocs).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Indicators of Compromise:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.iocs.ips && item.iocs.ips.length > 0 && (
                      <div className="bg-gray-900 p-3 rounded-md">
                        <h5 className="text-xs font-medium text-blue-400 mb-1">IP Addresses:</h5>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {item.iocs.ips.map((ip, idx) => (
                            <div key={idx} className="text-sm text-gray-300">{ip}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.iocs.domains && item.iocs.domains.length > 0 && (
                      <div className="bg-gray-900 p-3 rounded-md">
                        <h5 className="text-xs font-medium text-purple-400 mb-1">Domains:</h5>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {item.iocs.domains.map((domain, idx) => (
                            <div key={idx} className="text-sm text-gray-300">{domain}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.iocs.emails && item.iocs.emails.length > 0 && (
                      <div className="bg-gray-900 p-3 rounded-md">
                        <h5 className="text-xs font-medium text-red-400 mb-1">Email Addresses:</h5>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {item.iocs.emails.map((email, idx) => (
                            <div key={idx} className="text-sm text-gray-300">{email}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.iocs.cve && item.iocs.cve.length > 0 && (
                      <div className="bg-gray-900 p-3 rounded-md">
                        <h5 className="text-xs font-medium text-yellow-400 mb-1">CVEs:</h5>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {item.iocs.cve.map((cve, idx) => (
                            <div key={idx} className="text-sm text-gray-300">{cve}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OTX Data */}
              {item.otx_data && <OTXDetails data={item.otx_data} />}

              {/* Sentiment Analysis */}
              {item.sentiment && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Sentiment Analysis:</h4>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-md text-xs ${
                      item.sentiment.label === 'positive' ? 'bg-green-500 bg-opacity-20 text-green-500' :
                      item.sentiment.label === 'negative' ? 'bg-red-500 bg-opacity-20 text-red-500' :
                      'bg-yellow-500 bg-opacity-20 text-yellow-500'
                    }`}>
                      {item.sentiment.label}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">
                      Score: {item.sentiment.score}
                    </span>
                  </div>
                </div>
              )}

              {/* Topics */}
              {item.topics && item.topics.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Related Topics:</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.topics.map((topic, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-500 rounded-md text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex justify-end">
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span>View Original</span>
                  <ExternalLink size={16} className="ml-2" />
                </a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SearchResults;