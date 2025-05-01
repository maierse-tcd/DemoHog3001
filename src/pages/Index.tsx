
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ContentRow } from '../components/ContentRow';
import { Footer } from '../components/Footer';
import { mockCategories, mockContent, getFeaturedContent, getContentByCategory, Content } from '../data/mockData';
import { safeGetDistinctId } from '../utils/posthogUtils';

const Index = () => {
  const [featuredContent, setFeaturedContent] = useState(getFeaturedContent());
  const [categories, setCategories] = useState(mockCategories);
  const [content, setContent] = useState<Content[]>(mockContent);
  
  // Load content from localStorage on mount and when it changes
  useEffect(() => {
    const loadContent = () => {
      const savedContent = localStorage.getItem('hogflix_content');
      if (savedContent) {
        try {
          const parsedContent = JSON.parse(savedContent);
          if (Array.isArray(parsedContent) && parsedContent.length > 0) {
            setContent(parsedContent);
            
            // Also update featured content if it exists in the saved content
            const featured = parsedContent.find(item => item.id === featuredContent.id);
            if (featured) {
              setFeaturedContent(featured);
            }
          }
        } catch (e) {
          console.error("Error parsing saved content:", e);
        }
      }
    };
    
    // Initial load
    loadContent();
    
    // Listen for changes in other tabs/windows
    window.addEventListener('storage', loadContent);
    
    // Custom event for this tab
    window.addEventListener('content-updated', loadContent);
    
    return () => {
      window.removeEventListener('storage', loadContent);
      window.removeEventListener('content-updated', loadContent);
    };
  }, [featuredContent.id]);
  
  // Simulate page view analytics event
  useEffect(() => {
    console.log('Analytics Event: Page View - Homepage');
  }, []);
  
  // Debug PostHog identity
  useEffect(() => {
    // Check if user is properly identified in PostHog
    const currentId = safeGetDistinctId();
    console.log(`PostHog Debug - Current user identifier: ${currentId}`);
  }, []);
  
  // Simulate content impression analytics events
  useEffect(() => {
    console.log('Analytics Event: Featured Content Impression', {
      contentId: featuredContent.id,
      title: featuredContent.title,
      position: 'hero'
    });
    
    categories.forEach(category => {
      console.log('Analytics Event: Row Impression', {
        categoryId: category.id,
        categoryName: category.name
      });
    });
  }, [featuredContent, categories]);

  // Create a custom version of getContentByCategory that uses our updated content
  const getContentByCategoryFromState = (categoryId: string) => {
    if (categoryId === 'trending') {
      return content.filter(item => item.trending);
    }
    
    // Match based on genre
    const genreMap: Record<string, string[]> = {
      'tech': ['Technology', 'Science', 'Data'],
      'comedies': ['Comedy'],
      'dramas': ['Drama'],
      'action': ['Action', 'Adventure'],
      'fantasy': ['Fantasy'],
      'documentaries': ['Documentary'],
      'nature': ['Nature']
    };
    
    const genres = genreMap[categoryId] || [];
    if (genres.length > 0) {
      return content.filter(item => 
        item.genre.some(g => genres.includes(g))
      );
    }
    
    // Default implementation for other categories
    return content.slice(0, 10);
  };

  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      
      <main>
        <HeroSection content={featuredContent} />
        
        <div className="mt-[-80px] relative z-10">
          {categories.map((category) => (
            <ContentRow 
              key={category.id} 
              title={category.name} 
              contentList={getContentByCategoryFromState(category.id)} 
            />
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
