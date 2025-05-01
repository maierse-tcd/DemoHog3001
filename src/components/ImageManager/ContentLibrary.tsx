
import React, { useState } from 'react';
import { Search, Pencil, Trash2, Plus, ImageIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Content } from '../../data/mockData';
import { DEFAULT_IMAGES } from '../../utils/imageUtils';

interface ContentLibraryProps {
  content: Content[];
  onEditContent: (content: Content) => void;
  onDeleteContent: (contentId: string) => void;
  onAddNew: () => void;
}

export const ContentLibrary: React.FC<ContentLibraryProps> = ({
  content,
  onEditContent,
  onDeleteContent,
  onAddNew
}) => {
  const [viewType, setViewType] = useState<'all' | 'movies' | 'series'>('all');
  const [librarySearch, setLibrarySearch] = useState('');
  
  const filteredLibrary = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(librarySearch.toLowerCase());
    const matchesType = viewType === 'all' || item.type === viewType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={librarySearch}
            onChange={(e) => setLibrarySearch(e.target.value)}
            className="pl-10 bg-black/40 border-netflix-gray/40"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={viewType === 'all' ? "default" : "outline"} 
            onClick={() => setViewType('all')}
            className="min-w-20"
          >
            All
          </Button>
          <Button 
            variant={viewType === 'movies' ? "default" : "outline"} 
            onClick={() => setViewType('movies')}
            className="min-w-20"
          >
            Movies
          </Button>
          <Button 
            variant={viewType === 'series' ? "default" : "outline"} 
            onClick={() => setViewType('series')}
            className="min-w-20"
          >
            Series
          </Button>
        </div>
        
        <Button 
          variant="default" 
          onClick={onAddNew}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredLibrary.length > 0 ? (
          filteredLibrary.map(item => (
            <Card 
              key={item.id} 
              className="bg-netflix-darkgray border-netflix-gray/20 overflow-hidden hover:border-netflix-red transition-colors"
            >
              <div className="aspect-video relative">
                {item.backdropUrl ? (
                  <img 
                    src={item.backdropUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMAGES.backdrop;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-black/50 flex items-center justify-center text-netflix-gray">
                    <ImageIcon className="h-8 w-8 text-netflix-gray/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => onEditContent(item)}
                    className="bg-black/70 p-1.5 rounded-full hover:bg-black"
                    title="Edit content"
                  >
                    <Pencil className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => onDeleteContent(item.id)}
                    className="bg-black/70 p-1.5 rounded-full hover:bg-netflix-red"
                    title="Delete content"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="text-sm font-medium line-clamp-1">{item.title}</h3>
                <p className="text-xs text-netflix-gray">{item.type} • {item.releaseYear}</p>
                <div className="flex flex-wrap mt-1 gap-1">
                  {item.genre.slice(0, 2).map((genre, i) => (
                    <span key={i} className="text-xs bg-netflix-gray/20 px-1.5 py-0.5 rounded">
                      {genre}
                    </span>
                  ))}
                  {item.genre.length > 2 && (
                    <span className="text-xs text-netflix-gray">+{item.genre.length - 2}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-netflix-gray">
            <p>No content found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
