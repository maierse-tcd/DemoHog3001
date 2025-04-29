
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ContentRow } from '../components/ContentRow';
import { mockContent } from '../data/mockData';

const Movies = () => {
  const [movieContent, setMovieContent] = useState(() => {
    // Filter the content for movies only
    return mockContent.filter(item => item.type === 'movie');
  });
  
  // Group movies by genre
  const moviesByGenre = movieContent.reduce((acc: {[key: string]: typeof movieContent}, movie) => {
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
