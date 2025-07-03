
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { PersistentSubBanner } from '../components/PersistentSubBanner';
import { Footer } from '../components/Footer';
import { ContentRow } from '../components/ContentRow';
import { Content } from '../data/mockData';
import { loadContentFromSupabase } from '../utils/contentUtils';
import { toast } from '../hooks/use-toast';

const Series = () => {
  const [seriesContent, setSeriesContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load series content from Supabase
  useEffect(() => {
    const loadSeries = async () => {
      try {
        setIsLoading(true);
        
        // Load all content from Supabase
        const allContent = await loadContentFromSupabase();
        
        // Filter for series only
        const series = allContent.filter(item => item.type === 'series');
        setSeriesContent(series);
      } catch (error) {
        console.error("Error loading series:", error);
        toast({
          title: "Error loading series",
          description: "There was a problem loading series. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial load
    loadSeries();
    
    // Listen for content updates
    window.addEventListener('content-updated', loadSeries);
    
    return () => {
      window.removeEventListener('content-updated', loadSeries);
    };
  }, []);
  
  // Group series by genre
  const seriesByGenre = seriesContent.reduce((acc: {[key: string]: Content[]}, series) => {
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
  
  if (isLoading) {
    return (
      <div className="bg-netflix-black min-h-screen flex items-center justify-center">
        <div className="text-netflix-red text-2xl">Loading series...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      <PersistentSubBanner />
      
      <main className="pb-12">
        <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto pt-24">
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
