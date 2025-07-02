import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ContentLibrary } from './ContentLibrary';
import { GalleryView } from './GalleryView';
import { PlanManager } from './PlanManager';
import { Content } from '../../data/mockData';

interface ImageManagerTabsProps {
  contentList: Content[];
  isLoadingContent: boolean;
  uploadedImages: string[];
  isLoadingImages: boolean;
  isDeleting: boolean;
  onEditContent: (content: Content) => void;
  onDeleteContent: (contentId: string) => void;
  onAddNewContent: () => void;
  onRefreshImages: () => void;
  onDeleteImage: (imageUrl: string) => void;
}

export const ImageManagerTabs = ({
  contentList,
  isLoadingContent,
  uploadedImages,
  isLoadingImages,
  isDeleting,
  onEditContent,
  onDeleteContent,
  onAddNewContent,
  onRefreshImages,
  onDeleteImage
}: ImageManagerTabsProps) => {
  const [activeTab, setActiveTab] = useState('content');

  return (
    <Tabs 
      defaultValue="content" 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="space-y-8"
    >
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="content">Content Library</TabsTrigger>
        <TabsTrigger value="images">Image Gallery</TabsTrigger>
        <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
      </TabsList>
      
      <TabsContent value="content">
        <Card className="bg-netflix-darkgray border-netflix-gray/20">
          <CardHeader>
            <CardTitle>Content Library</CardTitle>
            <CardDescription>Browse, edit and manage all movies and series</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingContent ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-32 bg-netflix-gray rounded mb-4"></div>
                  <div className="text-netflix-gray">Loading content...</div>
                </div>
              </div>
            ) : (
              <ContentLibrary 
                content={contentList}
                onEditContent={onEditContent}
                onDeleteContent={onDeleteContent}
                onAddNew={onAddNewContent}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="images">
        <Card className="bg-netflix-darkgray border-netflix-gray/20">
          <CardHeader>
            <CardTitle>Image Gallery</CardTitle>
            <CardDescription>Manage images used across your content</CardDescription>
          </CardHeader>
          <CardContent>
            <GalleryView 
              isLoadingImages={isLoadingImages}
              uploadedImages={uploadedImages}
              onRefreshImages={onRefreshImages}
              onDeleteImage={onDeleteImage}
              isDeleting={isDeleting}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="plans">
        <PlanManager />
      </TabsContent>
    </Tabs>
  );
};