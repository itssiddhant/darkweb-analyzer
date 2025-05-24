// src/components/dashboard/TopicViewer.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, BookOpen, Tag } from 'lucide-react';

const TopicViewer = ({ topics = {} }) => {
  const [filterText, setFilterText] = useState('');
  
  // Transform topics object to array for filtering and sorting
  const topicsArray = Object.entries(topics).map(([id, details]) => ({
    id,
    ...details
  }));
  
  // Filter topics based on keywords
  const filteredTopics = topicsArray.filter(topic => 
    topic.keywords && 
    topic.keywords.some(keyword => 
      keyword.toLowerCase().includes(filterText.toLowerCase())
    )
  );
  
  // Sort by relevance/frequency/score if available, otherwise default
  const sortedTopics = filteredTopics.sort((a, b) => 
    (b.frequency || b.score || 0) - (a.frequency || a.score || 0)
  );

  if (!topics || Object.keys(topics).length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <BookOpen size={32} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-300">No topics have been extracted yet.</p>
        <p className="text-gray-400 text-sm mt-2">Topics will appear here when more content is processed.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <label htmlFor="filter-topics" className="sr-only">Filter topics</label>
        <div className="relative">
          <input
            type="text"
            id="filter-topics"
            className="block w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-3 pr-10 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="Filter topics by keyword..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
          <Tag className="absolute right-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      <div className="space-y-3">
        {sortedTopics.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No topics match your filter criteria.</p>
        ) : (
          sortedTopics.map(topic => (
            <Link 
              key={topic.id} 
              to={`/topics/${topic.id}`}
              className="block bg-gray-700 hover:bg-gray-600 p-4 rounded-md transition-colors duration-150"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">
                    Topic {topic.id}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {topic.keywords && topic.keywords.slice(0, 5).map((keyword, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                        {keyword}
                      </span>
                    ))}
                    {topic.keywords && topic.keywords.length > 5 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-200">
                        +{topic.keywords.length - 5} more
                      </span>
                    )}
                  </div>
                  {(topic.score || topic.frequency) && (
                    <p className="mt-2 text-sm text-gray-400">
                      {topic.frequency ? `Frequency: ${topic.frequency}` : ''}
                      {topic.score ? `Score: ${topic.score.toFixed(2)}` : ''}
                    </p>
                  )}
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default TopicViewer;