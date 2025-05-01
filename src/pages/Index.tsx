
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ContentRow } from '../components/ContentRow';
import { Footer } from '../components/Footer';
import { mockCategories, mockContent, getFeaturedContent, getContentByCategory } from '../data/mockData';
import { safeGetDistinctId } from '../utils/posthogUtils';

const Index = () => {
  const [featuredContent, setFeaturedContent] = useState(getFeaturedContent());
  const [categories, setCategories] = useState(mockCategories);
  
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
              contentList={getContentByCategory(category.id)} 
            />
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
