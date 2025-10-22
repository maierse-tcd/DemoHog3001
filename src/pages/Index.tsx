import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { PersistentSubBanner } from '../components/PersistentSubBanner';
import { HeroSection } from '../components/HeroSection';
import { ContentRow } from '../components/ContentRow';
import { Footer } from '../components/Footer';
import { mockCategories, mockContent, getFeaturedContent, Content } from '../data/mockData';
import { safeGetDistinctId } from '../utils/posthogUtils';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useAuth } from '../hooks/useAuth';
import { loadContentFromSupabase, initializeContentDatabase } from '../utils/contentUtils';
import { toast } from '../hooks/use-toast';
import { getPostHogInstance } from '../utils/posthog/core';

const Index = () => {
  const [featuredContent, setFeaturedContent] = useState<Content>(getFeaturedContent());
  const [categories, setCategories] = useState(mockCategories);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feature flag checks
  const isAdmin = useFeatureFlag('is_admin');
  const hasPasswordProtection = useFeatureFlag('access_password');
  
  // Auth check
  const { isLoggedIn } = useAuth();
  
  // Helper function to get a random item from an array
  const getRandomItem = <T,>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
  };
  
  // Load content from Supabase on mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        
        // Initialize database with mock data if it's empty
        await initializeContentDatabase(mockContent);
        
        // Then load all content from the database
        const contentData = await loadContentFromSupabase();
        
        if (contentData.length > 0) {
          setContent(contentData);
          
          // Set a random trending item as featured content, or random item if no trending
          const trending = contentData.filter(item => item.trending);
          const newFeatured = trending.length > 0 
            ? getRandomItem(trending) 
            : getRandomItem(contentData);
            
          // Explicitly cast to Content to satisfy TypeScript
          setFeaturedContent(newFeatured as Content);

          console.log("Featured content with backdrop URL:", newFeatured.backdropUrl);
          
          // Simulate background data validation error for PostHog tracking
          try {
            const posthog = getPostHogInstance();
            if (posthog && Math.random() > 0.7) {
              throw new Error('Content validation warning: Unexpected genre format detected');
            }
          } catch (validationError: any) {
            // Silent error - only tracked in PostHog
            const posthog = getPostHogInstance();
            posthog?.capture('$exception', {
              $exception_list: [{
                type: validationError.name || 'Error',
                value: validationError.message,
                mechanism: { handled: true, type: 'generic' }
              }],
              $exception_source: 'content_validation',
              page: 'homepage'
            });
          }
        }
      } catch (error) {
        console.error("Error loading content:", error);
        toast({
          title: "Error loading content",
          description: "There was a problem loading content. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
    
    // Set up event listener for content changes
    window.addEventListener('content-updated', loadContent);
    
    return () => {
      window.removeEventListener('content-updated', loadContent);
    };
  }, []);
  
  // Simulate page view analytics event
  useEffect(() => {
    console.log('Analytics Event: Page View - Homepage');
  }, []);
  
  // Debug PostHog identity
  useEffect(() => {
    // Check if user is properly identified in PostHog
    const currentId = safeGetDistinctId();
    console.log(`PostHog Debug - Current user identifier: ${currentId}`);
    console.log('Feature flags status:', { 
      is_admin: isAdmin, 
      access_password: hasPasswordProtection 
    });
    
    // Simulate API timeout error for PostHog tracking
    try {
      const posthog = getPostHogInstance();
      if (posthog && Math.random() > 0.8) {
        throw new Error('API timeout: Feature flag request exceeded 5000ms');
      }
    } catch (apiError: any) {
      // Silent error - only tracked in PostHog
      const posthog = getPostHogInstance();
      posthog?.capture('$exception', {
        $exception_list: [{
          type: apiError.name || 'Error',
          value: apiError.message,
          mechanism: { handled: true, type: 'generic' }
        }],
        $exception_source: 'feature_flags',
        page: 'homepage',
        timeout_duration: 5000
      });
    }
  }, [isAdmin, hasPasswordProtection]);
  
  // Simulate content impression analytics events
  useEffect(() => {
    if (featuredContent) {
      console.log('Analytics Event: Featured Content Impression', {
        contentId: featuredContent.id,
        title: featuredContent.title,
        position: 'hero'
      });
      
      // Simulate metadata parsing error for PostHog tracking
      try {
        const posthog = getPostHogInstance();
        if (posthog && Math.random() > 0.75) {
          throw new TypeError('Failed to parse content metadata: Invalid date format');
        }
      } catch (metadataError: any) {
        // Silent error - only tracked in PostHog
        const posthog = getPostHogInstance();
        posthog?.capture('$exception', {
          $exception_list: [{
            type: metadataError.name || 'TypeError',
            value: metadataError.message,
            mechanism: { handled: true, type: 'generic' }
          }],
          $exception_source: 'content_impressions',
          page: 'homepage',
          content_id: featuredContent.id
        });
      }
    }
    
    categories.forEach(category => {
      console.log('Analytics Event: Row Impression', {
        categoryId: category.id,
        categoryName: category.name
      });
    });
    
    // Simulate category rendering error for PostHog tracking
    try {
      const posthog = getPostHogInstance();
      if (posthog && categories.length > 0 && Math.random() > 0.85) {
        throw new ReferenceError('Category renderer: Missing required thumbnail property');
      }
    } catch (categoryError: any) {
      // Silent error - only tracked in PostHog
      const posthog = getPostHogInstance();
      posthog?.capture('$exception', {
        $exception_list: [{
          type: categoryError.name || 'ReferenceError',
          value: categoryError.message,
          mechanism: { handled: true, type: 'generic' }
        }],
        $exception_source: 'category_rendering',
        page: 'homepage',
        category_count: categories.length
      });
    }
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

  if (isLoading) {
    return (
      <div className="bg-netflix-black min-h-screen flex items-center justify-center">
        <div className="text-netflix-red text-2xl">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="bg-netflix-black min-h-screen">
      <Navbar />
      <PersistentSubBanner />
      
      <main>
        {featuredContent && <HeroSection content={featuredContent} />}
        
        <div className={featuredContent ? "mt-[-80px] relative z-10" : "mt-24 relative z-10"}>
          {categories.map((category) => (
            <ContentRow 
              key={category.id} 
              title={category.name} 
              contentList={getContentByCategoryFromState(category.id)} 
            />
          ))}
          
          {content.length === 0 && (
            <div className="text-center py-12 px-4">
              <p className="text-netflix-gray text-xl">No content available. Please check back later.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
