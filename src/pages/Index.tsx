import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ContentRow } from '../components/ContentRow';
import { HeroSection } from '../components/HeroSection';
import { HeroVariants } from '../components/HeroVariants';
import { PostHogSurvey } from '../components/PostHogSurvey';
import { useEventTracking } from '../hooks/useEventTracking';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { mockContent, getFeaturedContent } from '../data/mockData';

export default function Index() {
  const { trackUserJourney } = useEventTracking();
  const useHeroVariants = useFeatureFlagEnabled('use_hero_variants');
  
  // Get content by category
  const trendingContent = mockContent.filter(content => content.trending);
  const movieContent = mockContent.filter(content => content.type === 'movie');
  const seriesContent = mockContent.filter(content => content.type === 'series');
  const featuredContent = getFeaturedContent();
  
  // Track user journey step
  React.useEffect(() => {
    trackUserJourney('homepage_visited', { section: 'main' });
  }, [trackUserJourney]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {useHeroVariants ? <HeroVariants /> : <HeroSection content={featuredContent} />}
      <ContentRow title="Trending Now" contentList={trendingContent} />
      <ContentRow title="Popular Movies" contentList={movieContent} />
      <ContentRow title="TV Series" contentList={seriesContent} />
      <PostHogSurvey trigger="content_engagement" />
      <Footer />
    </div>
  );
}