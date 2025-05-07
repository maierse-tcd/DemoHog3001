
// Collection of YouTube videos for the application
export const youtubeVideos = {
  posthogVideos: [
    "https://www.youtube.com/embed/9mCWbVNzn4c",
    "https://www.youtube.com/embed/3afzkLS-zQA",
    "https://www.youtube.com/embed/1QhMvLs27yk",
    "https://www.youtube.com/embed/2jQco8hEvTI",
    "https://www.youtube.com/embed/U2Ac4w5flJQ",
    "https://www.youtube.com/embed/nmQS5EOgalU",
    "https://www.youtube.com/embed/KSzLc80FIx4",
    "https://www.youtube.com/embed/kMrJz-h1YPA",
    "https://www.youtube.com/embed/OgwnhinI9xI"
  ],
  rickroll: "https://www.youtube.com/embed/dQw4w9WgXcQ"
};

// Get a random video from the collection
export const getRandomVideo = (): string => {
  const videos = youtubeVideos.posthogVideos;
  // 10% chance for a rickroll (reduced from 20%)
  if (Math.random() < 0.1) {
    return youtubeVideos.rickroll;
  }
  // Otherwise pick a random PostHog video
  const randomIndex = Math.floor(Math.random() * videos.length);
  return videos[randomIndex];
};
