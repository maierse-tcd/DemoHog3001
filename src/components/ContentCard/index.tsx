
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Content } from '../../data/mockData';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';
import { safeCapture } from '../../utils/posthog';
import { useToast } from '../../hooks/use-toast';
import { BaseCard } from './BaseCard';
import { ExpandedContent } from './ExpandedContent';
import { VideoModal } from './VideoModal';
import { getRandomVideo } from '../../utils/videoUtils';
import '../ContentCard.css';

interface ContentCardProps {
  content: Content;
}

export const ContentCard = ({ content }: ContentCardProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const { toast } = useToast();
  
  // Use backdrop image if available, otherwise fallback to poster or default
  const displayImage = content.backdropUrl || content.posterUrl || DEFAULT_IMAGES.backdrop;
  
  // Video URL - use content's specific URL or get a random PostHog video
  const videoUrl = content.videoUrl || getRandomVideo();
  
  // Handler for My List button
  const handleMyListClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    safeCapture('my_list_button_clicked', {
      contentId: content.id,
      contentTitle: content.title,
      location: 'content_card'
    });
    
    toast({
      title: 'Added to My List',
      description: `"${content.title}" has been added to My List.`
    });
  };
  
  // Handler for Play button
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowVideo(true);
    
    safeCapture('content_play_clicked', { 
      contentId: content.id,
      contentTitle: content.title
    });
  };
  
  // Handler for Like button
  const handleThumbsUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toast({
      title: "Liked",
      description: "We'll recommend more like this."
    });
  };

  // Handler for More Info button
  const handleDetailClick = (e: React.MouseEvent) => {
    safeCapture('content_details_opened', { 
      contentId: content.id,
      contentTitle: content.title
    });
  };

  return (
    <>
      <div className="content-card">
        <div className="card-container">
          {/* Base card - always visible */}
          <Link to={`/content/${content.id}`}>
            <BaseCard 
              title={content.title}
              imageUrl={displayImage}
              onClick={handleDetailClick}
            />
            
            {/* Expanded content - shown on hover */}
            <ExpandedContent 
              content={content}
              onPlayClick={handlePlayClick}
              onMyListClick={handleMyListClick}
              onThumbsUp={handleThumbsUp}
              onDetailClick={handleDetailClick}
            />
          </Link>
        </div>
      </div>

      {/* Video Modal - Netflix-style fullscreen player */}
      <VideoModal
        isOpen={showVideo}
        onOpenChange={setShowVideo}
        videoUrl={videoUrl}
        title={content.title}
      />
    </>
  );
};
