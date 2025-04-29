
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-netflix-black text-netflix-gray px-4 md:px-16 py-12 mt-8">
      <div className="max-w-6xl mx-auto">
        {/* Social Icons */}
        <div className="flex space-x-6 mb-6">
          <Facebook className="h-6 w-6 hover:text-netflix-white cursor-pointer" />
          <Instagram className="h-6 w-6 hover:text-netflix-white cursor-pointer" />
          <Twitter className="h-6 w-6 hover:text-netflix-white cursor-pointer" />
          <Youtube className="h-6 w-6 hover:text-netflix-white cursor-pointer" />
        </div>
        
        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:underline">Audio Description</a></li>
              <li><a href="#" className="hover:underline">Investor Relations</a></li>
              <li><a href="#" className="hover:underline">Legal Notices</a></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:underline">Help Center</a></li>
              <li><a href="#" className="hover:underline">Jobs</a></li>
              <li><a href="#" className="hover:underline">Cookie Preferences</a></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:underline">Gift Cards</a></li>
              <li><a href="#" className="hover:underline">Terms of Use</a></li>
              <li><a href="#" className="hover:underline">Corporate Information</a></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:underline">Media Center</a></li>
              <li><a href="#" className="hover:underline">Privacy</a></li>
              <li><a href="#" className="hover:underline">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        {/* Service Code */}
        <button className="border border-netflix-gray px-2 py-1 text-xs mb-6 hover:text-netflix-white">
          Service Code
        </button>
        
        {/* Copyright */}
        <p className="text-xs">
          &copy; 2025 StreamFlix. A Netflix Clone Demo for Product Analytics
        </p>
      </div>
    </footer>
  );
};
