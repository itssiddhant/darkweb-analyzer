import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold text-white">
                DarkWeb Intel
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {/* Search */}
              <form className="relative">
                <input
                  type="text"
                  placeholder="Search threats..."
                  className="input w-64 pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </form>
              
              {/* Notification Bell */}
              <button className="ml-3 p-1 rounded-full bg-gray-700 hover:bg-gray-600">
                <Bell size={18} />
              </button>
            </div>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/search" 
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Search
            </Link>
            <Link 
              to="/topics" 
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Topics
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;