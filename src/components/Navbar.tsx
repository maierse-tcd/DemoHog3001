
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, Home, Video, Film, CreditCard } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { SearchBar } from './SearchBar';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { ProfileAvatar } from './ProfileAvatar';
import { AdminNavItems } from './AdminNavItems';
import { PostHogDebug } from './PostHogDebug';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isLoggedIn, userEmail } = useAuth();
  const isDarkTheme = location.pathname !== '/login' && location.pathname !== '/signup';
  const hidePlan = useFeatureFlagEnabled('hide_plan');
  
  // Determine if we should show the Plans menu item
  // Only hide plans when the user is logged in AND the hidePlan flag is true
  const showPlansMenuItem = !isLoggedIn || (isLoggedIn && !hidePlan);
  
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
            <h1 className="text-netflix-red text-3xl font-bold tracking-tighter">HOGFLIX</h1>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 ml-10">
            <Link 
              to="/" 
              className={`text-sm font-medium flex items-center gap-2 ${location.pathname === '/' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
            >
              <Home size={16} />
              Home
            </Link>
            <Link 
              to="/series" 
              className={`text-sm font-medium flex items-center gap-2 ${location.pathname === '/series' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
            >
              <Video size={16} />
              TV Shows
            </Link>
            <Link 
              to="/movies" 
              className={`text-sm font-medium flex items-center gap-2 ${location.pathname === '/movies' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
            >
              <Film size={16} />
              Movies
            </Link>
            
            {/* Only show Plans when showPlansMenuItem is true */}
            {showPlansMenuItem && (
              <Link 
                to="/plans" 
                className={`text-sm font-medium flex items-center gap-2 ${location.pathname === '/plans' ? 'text-netflix-white' : 'text-netflix-gray hover:text-netflix-white'}`}
              >
                <CreditCard size={16} />
                Plans
              </Link>
            )}
            
            {/* Admin link is now handled by the AdminNavItems component */}
            <AdminNavItems />
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
            className={`flex items-center gap-2 px-4 py-2 ${location.pathname === '/' ? 'text-netflix-white' : 'text-netflix-gray'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home size={16} />
            Home
          </Link>
          <Link 
            to="/series" 
            className={`flex items-center gap-2 px-4 py-2 ${location.pathname === '/series' ? 'text-netflix-white' : 'text-netflix-gray'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Video size={16} />
            TV Shows
          </Link>
          <Link 
            to="/movies" 
            className={`flex items-center gap-2 px-4 py-2 ${location.pathname === '/movies' ? 'text-netflix-white' : 'text-netflix-gray'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Film size={16} />
            Movies
          </Link>
          
          {/* Only show Plans in mobile menu when showPlansMenuItem is true */}
          {showPlansMenuItem && (
            <Link 
              to="/plans" 
              className={`flex items-center gap-2 px-4 py-2 ${location.pathname === '/plans' ? 'text-netflix-white' : 'text-netflix-gray'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <CreditCard size={16} />
              Plans
            </Link>
          )}
          
          {/* Admin NavItems component will handle visibility rules */}
          <AdminNavItems />
        </div>
      )}
      
      {/* Debug component - only shows when enabled or in development */}
      <PostHogDebug enabled={true} />
    </nav>
  );
};
