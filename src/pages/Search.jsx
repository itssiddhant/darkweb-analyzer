// src/pages/Search.jsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search as SearchIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { searchThreatData } from '../services/api';
import SearchResults from '../components/dashboard/SearchResults';
import Loader from '../components/common/Loader';

const Search = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('query') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Perform search when query parameter changes
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const results = await searchThreatData(query);
      setSearchResults(results);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again later.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Search query:", searchQuery);
    handleSearch(searchQuery);
    
    // Update URL with search query for sharing/bookmarking
    const newUrl = `/search?query=${encodeURIComponent(searchQuery)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Threat Intelligence Search</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Search by URL, IP, domain, email or CVE..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-400">
          <p>Tip: Search for specific indicators of compromise (IOCs) to find threats</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-800 text-red-300 px-4 py-3 rounded relative mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {loading ? (
        <Loader message="Searching for threats..." />
      ) : (
        <>
          {searched && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                Search Results 
                <span className="text-gray-400 ml-2">
                  ({searchResults.length} {searchResults.length === 1 ? 'item' : 'items'})
                </span>
              </h2>
            </div>
          )}
          
          <SearchResults results={searchResults} />
          
          {searched && searchResults.length === 0 && !error && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-300">No results found</h3>
              <p className="mt-2 text-gray-400">
                Try modifying your search query or look for different indicators
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;