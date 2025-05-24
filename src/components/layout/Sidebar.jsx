import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronUp, LayoutDashboard, Search, Globe, FileText, AlertTriangle, Users, MessageCircle, Database, FileBarChart } from 'lucide-react';

const Sidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState({
    threats: false,
    analytics: false
  });
  
  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };
  
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 hidden lg:block">
      <div className="py-4 px-3">
        <div className="space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </NavLink>
          
          <NavLink
            to="/search"
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Search className="mr-3 h-5 w-5" />
            Search
          </NavLink>
          
          <div>
            <button
              onClick={() => toggleMenu('threats')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <div className="flex items-center">
                <AlertTriangle className="mr-3 h-5 w-5" />
                Threats
              </div>
              {expandedMenus.threats ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {expandedMenus.threats && (
              <div className="pl-10 space-y-1">
                <NavLink
                  to="/threats/latest"
                  className={({ isActive }) => 
                    `block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Latest Threats
                </NavLink>
                <NavLink
                  to="/threats/alerts"
                  className={({ isActive }) => 
                    `block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Alerts
                </NavLink>
                <NavLink
                  to="/threats/iocs"
                  className={({ isActive }) => 
                    `block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  IOCs
                </NavLink>
              </div>
            )}
          </div>
          
          <div>
            <button
              onClick={() => toggleMenu('analytics')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <div className="flex items-center">
                <FileBarChart className="mr-3 h-5 w-5" />
                Analytics
              </div>
              {expandedMenus.analytics ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {expandedMenus.analytics && (
              <div className="pl-10 space-y-1">
                <NavLink
                  to="/analytics/sentiment"
                  className={({ isActive }) => 
                    `block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Sentiment Analysis
                </NavLink>
                <NavLink
                  to="/analytics/geo"
                  className={({ isActive }) => 
                    `block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Geolocation
                </NavLink>
                <NavLink
                  to="/analytics/timeline"
                  className={({ isActive }) => 
                    `block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Timeline
                </NavLink>
                <NavLink
                  to="/analytics/reports"
                  className={({ isActive }) => 
                    `block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Reports
                </NavLink>
              </div>
            )}
          </div>
          
          <NavLink
            to="/topics"
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <FileText className="mr-3 h-5 w-5" />
            Topics
          </NavLink>
          
          <NavLink
            to="/mapping"
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Globe className="mr-3 h-5 w-5" />
            Global Mapping
          </NavLink>
          
          <NavLink
            to="/settings"
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Database className="mr-3 h-5 w-5" />
            Data Management
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;