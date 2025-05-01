
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ContentRow } from '../components/ContentRow';
import { Content } from '../data/mockData';

const Movies = () => {
  const [movieContent, setMovieContent] = useState<Content[]>(() => {
    // Load content from localStorage if available, otherwise use empty array
    const savedContent = localStorage.getItem('hogflix_content');
    if (savedContent) {
      try {
        const parsedContent = JSON.parse(savedContent);
        // Ensure we return an array of Content items filtered for movies
        return Array.isArray(parsedContent) 
          ? parsedContent.filter((item: Content) => item.type === 'movie')
          : [];
      } catch (e) {
        console.error("Error parsing saved content:", e);
        return [];
      }
    }
    return [];
  });
  
  // Refresh content when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedContent = localStorage.getItem('hogflix_content');
      if (savedContent) {
        try {
          const parsedContent = JSON.parse(savedContent);
          // Ensure we're setting an array
          if (Array.isArray(parsedContent)) {
            setMovieContent(parsedContent.filter((item: Content) => item.type === 'movie'));
          } else {
            console.error("Content in localStorage is not an array:", parsedContent);
            setMovieContent([]);
          }
        } catch (e) {
          console.error("Error parsing saved content:", e);
          setMovieContent([]);
        }
      } else {
        // If content is removed from localStorage, set to empty array
        setMovieContent([]);
      }
    };
    
    // Initial load
    handleStorageChange();
    
    // Listen for changes in other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for this tab
    window.addEventListener('content-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('content-updated', handleStorageChange);
    };
  }, []);
  
  // Group movies by genre
  const moviesByGenre = movieContent.reduce((acc: {[key: string]: Content[]}, movie) => {
    movie.genre.forEach(genre => {
      if (!acc[genre]) acc[genre] = [];
      acc[genre].push(movie);
    });
    return acc;
  }, {});
  
  // Simulate page view analytics event
  useEffect(() => {
    console.log('Analytics Event: Page View - Movies');
  }, []);
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Movies</h1>
          
          {Object.entries(moviesByGenre).map(([genre, movies]) => (
            <ContentRow 
              key={genre} 
              title={genre} 
              contentList={movies} 
            />
          ))}
          
          {Object.keys(moviesByGenre).length === 0 && (
            <div className="text-center py-12">
              <p className="text-netflix-gray text-xl">No movies available at this time.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Movies;
