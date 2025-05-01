
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ContentRow } from '../components/ContentRow';
import { Content } from '../data/mockData';
import { loadContentFromSupabase } from '../utils/contentUtils';

const Movies = () => {
  const [movieContent, setMovieContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load movie content from Supabase
  useEffect(() => {
    const loadMovies = async () => {
      try {
        setIsLoading(true);
        
        // Load all content from Supabase
        const allContent = await loadContentFromSupabase();
        
        // Filter for movies only
        const movies = allContent.filter(item => item.type === 'movie');
        setMovieContent(movies);
      } catch (error) {
        console.error("Error loading movies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial load
    loadMovies();
    
    // Listen for content updates
    window.addEventListener('content-updated', loadMovies);
    
    return () => {
      window.removeEventListener('content-updated', loadMovies);
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
  
  if (isLoading) {
    return (
      <div className="bg-netflix-black min-h-screen flex items-center justify-center">
        <div className="text-netflix-red text-2xl">Loading movies...</div>
      </div>
    );
  }
  
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
