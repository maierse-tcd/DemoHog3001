
// Collection of placeholder images for the application
// These can be replaced with actual images later

export const placeholderImages = {
  heroBackdrop: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80",
  moviePoster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80",
  tvSeriesPoster: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80",
  profileBackground: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80",
  userAvatar: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=150&h=150"
};

// Helper function to get a random placeholder from the collection
export const getRandomPlaceholder = (): string => {
  const placeholders = Object.values(placeholderImages);
  const randomIndex = Math.floor(Math.random() * placeholders.length);
  return placeholders[randomIndex];
};
