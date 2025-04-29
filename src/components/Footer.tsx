
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-netflix-black py-8 border-t border-netflix-gray/20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <Link to="/">
              <h2 className="text-netflix-red text-2xl font-bold tracking-tighter">HOGFLIX</h2>
            </Link>
            <p className="text-netflix-gray text-sm mt-2">The premier streaming service for hedgehog enthusiasts.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-netflix-white font-medium mb-3">Navigation</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-netflix-gray hover:text-white text-sm">Home</Link></li>
                <li><Link to="/movies" className="text-netflix-gray hover:text-white text-sm">Movies</Link></li>
                <li><Link to="/series" className="text-netflix-gray hover:text-white text-sm">Series</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-netflix-white font-medium mb-3">Account</h3>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-netflix-gray hover:text-white text-sm">Sign In</Link></li>
                <li><Link to="/signup" className="text-netflix-gray hover:text-white text-sm">Sign Up</Link></li>
                <li><Link to="/profile" className="text-netflix-gray hover:text-white text-sm">Profile</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-netflix-white font-medium mb-3">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-netflix-gray hover:text-white text-sm">Help Center</Link></li>
                <li><Link to="/terms" className="text-netflix-gray hover:text-white text-sm">Terms of Use</Link></li>
                <li><Link to="/privacy" className="text-netflix-gray hover:text-white text-sm">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-netflix-gray/20">
          <p className="text-netflix-gray text-xs text-center">
            &copy; {currentYear} Hogflix. All rights reserved. Not affiliated with any actual hedgehogs.
          </p>
        </div>
      </div>
    </footer>
  );
};
