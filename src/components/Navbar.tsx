
import { useState, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { ProfileDropdown } from './ProfileDropdown';
import { Bell, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav 
      className={`fixed top-0 z-50 w-full px-4 py-2 md:px-8 md:py-4 flex items-center justify-between transition-all duration-500 ${
        isScrolled ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center">
        <h1 className="text-netflix-red text-3xl font-bold tracking-tighter mr-10">HOGFLIX</h1>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="navbar-link text-netflix-white">Home</Link>
          <Link to="/movies" className="navbar-link">Movies</Link>
          <Link to="/series" className="navbar-link">Series</Link>
          <Link to="/new" className="navbar-link">New & Popular</Link>
          <Link to="/mylist" className="navbar-link">My List</Link>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Right side icons */}
      <div className="hidden md:flex items-center space-x-4">
        <SearchBar />
        <Bell className="h-5 w-5 text-netflix-gray hover:text-netflix-white cursor-pointer" />
        <ProfileDropdown />
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-14 left-0 right-0 bg-black/90 p-4 flex flex-col space-y-4 md:hidden animate-fade-in">
          <Link to="/" className="navbar-link text-netflix-white">Home</Link>
          <Link to="/movies" className="navbar-link">Movies</Link>
          <Link to="/series" className="navbar-link">Series</Link>
          <Link to="/new" className="navbar-link">New & Popular</Link>
          <Link to="/mylist" className="navbar-link">My List</Link>
          <div className="pt-2">
            <SearchBar />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Bell className="h-5 w-5 text-netflix-gray hover:text-netflix-white cursor-pointer" />
            <ProfileDropdown />
          </div>
        </div>
      )}
    </nav>
  );
};
