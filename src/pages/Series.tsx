
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ContentRow } from '../components/ContentRow';

const Series = () => {
  const [seriesContent, setSeriesContent] = useState(() => {
    // Load content from localStorage if available, otherwise use mockContent
    const savedContent = localStorage.getItem('hogflix_content');
    if (savedContent) {
      try {
        const parsedContent = JSON.parse(savedContent);
        return parsedContent.filter(item => item.type === 'series');
      } catch (e) {
        console.error("Error parsing saved content:", e);
        // Will fall back to mockContent import
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
          setSeriesContent(parsedContent.filter(item => item.type === 'series'));
        } catch (e) {
          console.error("Error parsing saved content:", e);
        }
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
  
  // Group series by genre
  const seriesByGenre = seriesContent.reduce((acc: {[key: string]: typeof seriesContent}, series) => {
    series.genre.forEach(genre => {
      if (!acc[genre]) acc[genre] = [];
      acc[genre].push(series);
    });
    return acc;
  }, {});
  
  // Simulate page view analytics event
  useEffect(() => {
    console.log('Analytics Event: Page View - Series');
  }, []);
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">TV Series</h1>
          
          {Object.entries(seriesByGenre).map(([genre, series]) => (
            <ContentRow 
              key={genre} 
              title={genre} 
              contentList={series} 
            />
          ))}
          
          {Object.keys(seriesByGenre).length === 0 && (
            <div className="text-center py-12">
              <p className="text-netflix-gray text-xl">No series available at this time.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Series;
