import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTopicDocuments } from '../services/api';
import { ArrowLeft, FileText, ExternalLink, Calendar, AlertCircle, Shield, Tag } from 'lucide-react';
import Loader from '../components/common/Loader';
import ErrorDisplay from '../components/common/ErrorDisplay';

const TopicDetail = () => {
  const { topicId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTopicDocuments = async () => {
      try {
        setLoading(true);
        const response = await getTopicDocuments(topicId);
        setDocuments(response.documents);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching documents for topic ${topicId}:`, err);
        setError(`Failed to load documents for Topic ${topicId}. Please try again later.`);
        setLoading(false);
      }
    };

    fetchTopicDocuments();
  }, [topicId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter documents based on search term and active tab
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clean_text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'high_threat' && doc.threat_score >= 0.7) return matchesSearch;
    if (activeTab === 'medium_threat' && doc.threat_score >= 0.4 && doc.threat_score < 0.7) return matchesSearch;
    if (activeTab === 'low_threat' && doc.threat_score < 0.4) return matchesSearch;
    
    return false;
  });

  // Get sentiment badge color
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'bg-gray-500 text-gray-200';
    if (sentiment.toLowerCase() === 'negative') return 'bg-red-500 bg-opacity-20 text-red-500';
    if (sentiment.toLowerCase() === 'neutral') return 'bg-yellow-500 bg-opacity-20 text-yellow-500';
    return 'bg-green-500 bg-opacity-20 text-green-500';
  };

  // Get threat score color
  const getThreatScoreColor = (score) => {
    if (!score && score !== 0) return 'bg-gray-500 text-gray-200';
    if (score >= 0.7) return 'bg-red-500 bg-opacity-20 text-red-500';
    if (score >= 0.4) return 'bg-yellow-500 bg-opacity-20 text-yellow-500';
    return 'bg-green-500 bg-opacity-20 text-green-500';
  };

  if (loading) return <Loader />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link to="/topics" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
          <ArrowLeft size={16} className="mr-1" />
          Back to Topics
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Topic {topicId} Details</h1>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documents by title, URL, or content..."
                className="w-full bg-gray-700 text-white rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('high_threat')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === 'high_threat'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              High Threat
            </button>
            <button
              onClick={() => setActiveTab('medium_threat')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === 'medium_threat'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Medium Threat
            </button>
            <button
              onClick={() => setActiveTab('low_threat')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === 'low_threat'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Low Threat
            </button>
          </div>
        </div>
      </div>

      {/* Document Count */}
      <div className="mb-4 text-gray-400">
        Found {filteredDocuments.length} documents
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
          <h3 className="text-xl font-semibold mb-2">No Documents Found</h3>
          <p className="text-gray-400">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3">
                  <FileText className="text-blue-500 mt-1" size={20} />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {doc.title || 'Untitled Document'}
                    </h3>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 text-sm flex items-center hover:text-blue-500"
                    >
                      {doc.url}
                      <ExternalLink size={12} className="ml-1" />
                    </a>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium mb-2 ${getThreatScoreColor(
                      doc.threat_score
                    )}`}
                  >
                    Threat Score: {doc.threat_score ? Math.round(doc.threat_score * 100) : 'N/A'}%
                  </span>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${getSentimentColor(
                      doc.sentiment
                    )}`}
                  >
                    {doc.sentiment || 'Unknown Sentiment'}
                  </span>
                </div>
              </div>

              {/* Content Preview */}
              <div className="mb-4">
                <p className="text-gray-300 text-sm line-clamp-3">
                  {doc.clean_text?.substring(0, 250)}
                  {doc.clean_text?.length > 250 ? '...' : ''}
                </p>
              </div>

              {/* IOCs and Metadata */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-400 mb-2 flex items-center">
                    <Shield size={14} className="mr-1" /> IOCs
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {doc.iocs?.IP?.map((ip, idx) => (
                      <span
                        key={`ip-${idx}`}
                        className="bg-blue-500 bg-opacity-20 text-blue-400 px-2 py-1 rounded-md text-xs"
                      >
                        IP: {ip}
                      </span>
                    ))}
                    {doc.iocs?.DOMAIN?.map((domain, idx) => (
                      <span
                        key={`domain-${idx}`}
                        className="bg-purple-500 bg-opacity-20 text-purple-400 px-2 py-1 rounded-md text-xs"
                      >
                        Domain: {domain}
                      </span>
                    ))}
                    {doc.iocs?.EMAIL?.map((email, idx) => (
                      <span
                        key={`email-${idx}`}
                        className="bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded-md text-xs"
                      >
                        Email: {email}
                      </span>
                    ))}
                    {doc.iocs?.CVE?.map((cve, idx) => (
                      <span
                        key={`cve-${idx}`}
                        className="bg-red-500 bg-opacity-20 text-red-400 px-2 py-1 rounded-md text-xs"
                      >
                        CVE: {cve}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end text-gray-400 text-sm">
                  <Calendar size={14} className="mr-1" />
                  Processed: {formatDate(doc.processed_at)}
                </div>
              </div>

              {/* Topic Relevance Score */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-gray-400 text-sm">
                    <Tag size={14} className="mr-1" />
                    Topic Relevance Score
                  </div>
                  <span className="text-blue-500 font-medium">
                    {Math.round((doc.topic_score || 0) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${(doc.topic_score || 0) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicDetail;