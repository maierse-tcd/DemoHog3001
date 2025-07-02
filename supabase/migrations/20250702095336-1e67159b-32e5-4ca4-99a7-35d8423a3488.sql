-- Add database indexes for better query performance on frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_content_images_created_at ON content_images (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_images_content_id ON content_images (content_id);
CREATE INDEX IF NOT EXISTS idx_content_images_user_id ON content_images (user_id);

-- Add indexes for content_items table for better filtering performance
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items (type);
CREATE INDEX IF NOT EXISTS idx_content_items_trending ON content_items (trending);
CREATE INDEX IF NOT EXISTS idx_content_items_genre ON content_items USING GIN (genre);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items (created_at DESC);