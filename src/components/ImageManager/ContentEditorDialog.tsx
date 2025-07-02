import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { ContentEditor } from '../ContentEditor';
import { Content } from '../../data/mockData';

interface ContentEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  selectedContent: Content | null;
  onSave: (content: Content) => void;
  onCancel: () => void;
}

export const ContentEditorDialog = ({
  isOpen,
  onOpenChange,
  isEditMode,
  selectedContent,
  onSave,
  onCancel
}: ContentEditorDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-netflix-black border-netflix-gray/20 p-0 max-h-[95vh] overflow-hidden">
        <ScrollArea className="max-h-[calc(95vh-2rem)]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Content' : 'Add New Content'}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Update details for this movie or series' 
                  : 'Add a new movie or series to your library'}
              </DialogDescription>
            </DialogHeader>
            <ContentEditor 
              content={isEditMode ? selectedContent || undefined : undefined}
              isEdit={isEditMode}
              onSave={onSave}
              onCancel={onCancel}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};