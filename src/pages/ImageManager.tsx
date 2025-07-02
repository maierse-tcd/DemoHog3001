
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AuthGuard } from '../components/ImageManager/AuthGuard';
import { ContentEditorDialog } from '../components/ImageManager/ContentEditorDialog';
import { ImageManagerTabs } from '../components/ImageManager/ImageManagerTabs';
import { useImageManager } from '../hooks/useImageManager';
import { useContentManager } from '../hooks/useContentManager';

const ImageManager = () => {
  const {
    uploadedImages,
    isLoadingImages,
    isDeleting,
    loadUploadedImages,
    handleDeleteImage
  } = useImageManager();

  const {
    selectedContent,
    contentList,
    showContentEditor,
    setShowContentEditor,
    isEditMode,
    isLoadingContent,
    handleContentSaved,
    handleEditContent,
    handleAddNewContent,
    handleDeleteContent
  } = useContentManager();

  const handleContentSave = (content: any) => {
    handleContentSaved(content, loadUploadedImages);
  };

  const handleImageDelete = (imageUrl: string) => {
    handleDeleteImage(imageUrl, contentList);
  };
  
  return (
    <AuthGuard>
      <div className="bg-netflix-black min-h-screen">
        <Navbar />
        
        <main className="pt-24 pb-12">
          <div className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold">Content Management</h1>
            </div>
            
            <ContentEditorDialog
              isOpen={showContentEditor}
              onOpenChange={setShowContentEditor}
              isEditMode={isEditMode}
              selectedContent={selectedContent}
              onSave={handleContentSave}
              onCancel={() => setShowContentEditor(false)}
            />
            
            <ImageManagerTabs
              contentList={contentList}
              isLoadingContent={isLoadingContent}
              uploadedImages={uploadedImages}
              isLoadingImages={isLoadingImages}
              isDeleting={isDeleting}
              onEditContent={handleEditContent}
              onDeleteContent={handleDeleteContent}
              onAddNewContent={handleAddNewContent}
              onRefreshImages={loadUploadedImages}
              onDeleteImage={handleImageDelete}
            />
          </div>
        </main>
        
        <Footer />
      </div>
    </AuthGuard>
  );
};

export default ImageManager;
