
import { ContentCard } from './ContentCard';
import { Content } from '../data/mockData';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import './ContentRow.css';

interface ContentRowProps {
  title: string;
  contentList: Content[];
  isOnMyListPage?: boolean;
}

export const ContentRow = ({ title, contentList, isOnMyListPage = false }: ContentRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75
        : scrollLeft + clientWidth * 0.75;
      
      rowRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
      
      // Update arrow visibility after scroll
      setTimeout(() => {
        if (rowRef.current) {
          setShowLeftArrow(rowRef.current.scrollLeft > 0);
          setShowRightArrow(rowRef.current.scrollLeft < rowRef.current.scrollWidth - rowRef.current.clientWidth - 10);
        }
      }, 300);
    }
  };
  
  const handleScroll = () => {
    if (rowRef.current) {
      setShowLeftArrow(rowRef.current.scrollLeft > 0);
      setShowRightArrow(rowRef.current.scrollLeft < rowRef.current.scrollWidth - rowRef.current.clientWidth - 10);
    }
  };
  
  return (
    <div className="relative my-8 content-row">
      <h2 className="text-xl md:text-2xl font-medium mb-2 px-4 md:px-8 lg:px-12 content-row-title">{title}</h2>
      
      <div className="group relative">
        {/* Left scroll button */}
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
        )}
        
        {/* Content row with ScrollArea - Hide scrollbar */}
        <ScrollArea className="w-full overflow-x-auto pb-4 scrollbar-none" hideScrollbar={true}>
          <div 
            className="flex items-start space-x-1 px-4 md:px-8 lg:px-12 pt-2"
            ref={rowRef}
            onScroll={handleScroll}
            style={{ minWidth: "100%" }}
          >
            {contentList.map((content) => (
              <div key={content.id}>
                <ContentCard content={content} isOnMyListPage={isOnMyListPage} />
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Right scroll button */}
        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};
