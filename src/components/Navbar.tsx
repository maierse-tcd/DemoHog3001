
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { SearchBar } from './SearchBar';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const isDarkTheme = location.pathname !== '/login' && location.pathname !== '/signup';
  const isAdmin = useFeatureFlag('is_admin');
  
  // Handle scroll events to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isDarkTheme 
          ? isScrolled 
            ? 'bg-netflix-black shadow-md' 
            : 'bg-gradient-to-b from-netflix-black/90 to-transparent' 
          : 'bg-transparent'
      }`}
    >
      <div className="px-4 md:px-10 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="mr-2">
            <img 
              src="/placeholder.svg" 
              alt="Logo" 
              className="h-8 w-24 object-contain" 
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 ml-10">
            <Link 
              to="/" 
              className={`text-sm font-medium ${location.pathname === '/' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
            >
              Home
            </Link>
            <Link 
              to="/series" 
              className={`text-sm font-medium ${location.pathname === '/series' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
            >
              TV Shows
            </Link>
            <Link 
              to="/movies" 
              className={`text-sm font-medium ${location.pathname === '/movies' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
            >
              Movies
            </Link>
            <Link 
              to="/my-list" 
              className={`text-sm font-medium ${location.pathname === '/my-list' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
            >
              My List
            </Link>
            {isAdmin && (
              <Link 
                to="/image-manager" 
                className={`text-sm font-medium ${location.pathname === '/image-manager' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
              >
                Admin
              </Link>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-netflix-gray hover:text-netflix-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
        
        {/* Right Side Items */}
        <div className="flex items-center space-x-4">
          <SearchBar />
          {isLoggedIn ? (
            <ProfileDropdown /> 
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-netflix-white hover:text-netflix-gray text-sm"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="bg-netflix-red text-white py-1 px-3 rounded-sm hover:bg-netflix-red/90 text-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-netflix-black/95 border-t border-netflix-gray/20 py-2">
          <Link 
            to="/" 
            className={`block px-4 py-2 ${location.pathname === '/' ? 'text-netflix-white' : 'text-netflix-gray'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/series" 
            className={`block px-4 py-2 ${location.pathname === '/series' ? 'text-netflix-white' : 'text-netflix-gray'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            TV Shows
          </Link>
          <Link 
            to="/movies" 
            className={`block px-4 py-2 ${location.pathname === '/movies' ? 'text-netflix-white' : 'text-netflix-gray'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Movies
          </Link>
          <Link 
            to="/my-list" 
            className={`block px-4 py-2 ${location.pathname === '/my-list' ? 'text-netflix-white' : 'text-netflix-gray'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            My List
          </Link>
          {isAdmin && (
            <Link 
              to="/image-manager" 
              className={`block px-4 py-2 ${location.pathname === '/image-manager' ? 'text-netflix-white' : 'text-netflix-gray'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
