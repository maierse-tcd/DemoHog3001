
import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-netflix-black py-10 px-4 md:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between mb-8">
          <div className="mb-6 md:mb-0">
            <h1 className="text-netflix-red text-2xl font-bold tracking-tighter mb-4">HOGFLIX</h1>
            <p className="text-netflix-gray text-sm max-w-xs">
              The premier streaming platform for all your hedgehog entertainment needs.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-medium mb-4">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-netflix-gray hover:text-white">Home</Link></li>
                <li><Link to="/movies" className="text-netflix-gray hover:text-white">Movies</Link></li>
                <li><Link to="/series" className="text-netflix-gray hover:text-white">TV Series</Link></li>
                <li><Link to="/new" className="text-netflix-gray hover:text-white">New & Popular</Link></li>
                <li><Link to="/mylist" className="text-netflix-gray hover:text-white">My List</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Account</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="text-netflix-gray hover:text-white">Sign In</Link></li>
                <li><Link to="/signup" className="text-netflix-gray hover:text-white">Sign Up</Link></li>
                <li><Link to="/profile" className="text-netflix-gray hover:text-white">Account</Link></li>
                <li><Link to="/profile" className="text-netflix-gray hover:text-white">Help Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="text-netflix-gray hover:text-white">Terms of Use</Link></li>
                <li><Link to="/privacy" className="text-netflix-gray hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="text-netflix-gray hover:text-white">Cookie Preferences</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-netflix-gray/20 text-netflix-gray text-sm flex flex-col md:flex-row justify-between items-center">
          <p>© 2025 Hogflix, Inc. All hedgehog rights reserved.</p>
          <p className="mt-2 md:mt-0">Made with ♥ for hedgehog enthusiasts everywhere.</p>
          <p className="mt-2 md:mt-0">Analytics provided by PostHog</p>
        </div>
      </div>
    </footer>
  );
};
