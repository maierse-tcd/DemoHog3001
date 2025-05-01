export interface Content {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl?: string;
  type: 'movie' | 'series';
  releaseYear: string;
  ageRating: string;
  duration: string;
  genre: string[];
  trending?: boolean;
}

export interface Category {
  id: string;
  name: string;
  contentIds: string[];
}

// High-quality hedgehog-themed placeholder images
const hedgehogImages = {
  tech: [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=600&h=800",
  ],
  nature: [
    "https://images.unsplash.com/photo-1535376472810-5d229c65da09?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1567601169793-2718c12a0e1b?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1599150026015-39719ab0d201?auto=format&fit=crop&q=80&w=600&h=800",
  ],
  animals: [
    "https://images.unsplash.com/photo-1584553421349-3557471bed79?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1533327179083-d2cd51979c0e?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1582066660345-8541d0ab5b45?auto=format&fit=crop&q=80&w=600&h=800",
  ],
  backdrops: [
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200&h=800",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200&h=800",
    "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&q=80&w=1200&h=800",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200&h=800",
  ]
};

// Helper to get a random image from a category
const getRandomImage = (category: keyof typeof hedgehogImages): string => {
  const images = hedgehogImages[category];
  return images[Math.floor(Math.random() * images.length)];
};

export const mockContent: Content[] = [
  // Original content with improved images
  {
    id: '1',
    title: 'Code & Quills',
    description: 'Max, a brilliant hedgehog programmer, embarks on a thrilling journey to create the ultimate app, while navigating the quirks and joys of coding from his cozy home office.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2022',
    ageRating: 'TV-14',
    duration: '3 Seasons',
    genre: ['Technology', 'Comedy', 'Drama'],
    trending: true
  },
  {
    id: '2',
    title: 'Palette of Prickles',
    description: 'In his vibrant studio, Max, the creative hedgehog, brings his imaginative designs to life with colorful sketches and digital artistry, aiming to win a prestigious design contest.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2021',
    ageRating: 'TV-PG',
    duration: '2 Seasons',
    genre: ['Design', 'Arts', 'Creativity']
  },
  {
    id: '3',
    title: 'Data Spikes',
    description: 'Donning his lab coat, Max delves into the world of data analysis, uncovering fascinating insights and solving complex problems, all from his sleek, modern office.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2023',
    ageRating: 'PG-13',
    duration: '1h 45m',
    genre: ['Data', 'Technology', 'Science']
  },
  {
    id: '4',
    title: 'Hedge Your Bets',
    description: 'A family of hedgehogs navigates the digital age, with their spiky little ones constantly getting into tech-related mischief.',
    posterUrl: getRandomImage('animals'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2020',
    ageRating: 'PG',
    duration: '1h 30m',
    genre: ['Comedy', 'Family']
  },
  {
    id: '5',
    title: 'Prickly Surveillance',
    description: 'In this psychological thriller, a hedgehog becomes convinced he is being tracked through his digital devices, leading to a web of paranoia and discovery.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2022',
    ageRating: 'TV-14',
    duration: '2h 10m',
    genre: ['Thriller', 'Mystery'],
    trending: true
  },
  {
    id: '6',
    title: 'Hogstream',
    description: 'A reality show about hedgehog families living their daily lives under constant streaming, revealing the true nature of spiky celebrity.',
    posterUrl: getRandomImage('animals'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2023',
    ageRating: 'TV-14',
    duration: '1 Season',
    genre: ['Reality', 'Comedy']
  },
  {
    id: '7',
    title: 'The Quill Algorithm',
    description: 'A brilliant hedgehog mathematician discovers an algorithm that can predict behavior with frightening accuracy, changing how we understand spiny creatures forever.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2021',
    ageRating: 'PG-13',
    duration: '1h 55m',
    genre: ['Sci-Fi', 'Drama']
  },
  {
    id: '8',
    title: 'Virtual Hedge',
    description: 'When virtual reality becomes indistinguishable from the real world, a hedgehog fights to remember what is real and what is digital.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2020',
    ageRating: 'PG-13',
    duration: '2h 15m',
    genre: ['Sci-Fi', 'Action']
  },
  {
    id: '9',
    title: 'Modern Hedgehog 2.0',
    description: 'A mockumentary following the lives of a hedgehog family where technology plays a central role in their spiky interactions.',
    posterUrl: getRandomImage('animals'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2022',
    ageRating: 'TV-PG',
    duration: '4 Seasons',
    genre: ['Comedy', 'Family']
  },
  {
    id: '10',
    title: 'Hog Network',
    description: 'A gripping drama about the rise and fall of a social media network for hedgehogs and its controversial founder.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2023',
    ageRating: 'TV-MA',
    duration: '1 Season',
    genre: ['Drama', 'Biography']
  },
  {
    id: '11',
    title: 'Digital Detox for Hogs',
    description: 'A group of technology-addicted hedgehogs are sent to a remote retreat to overcome their dependencies and rediscover their natural instincts.',
    posterUrl: getRandomImage('nature'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2021',
    ageRating: 'TV-14',
    duration: '1 Season',
    genre: ['Reality', 'Drama']
  },
  {
    id: '12',
    title: 'Smart Burrow',
    description: 'A family\'s new AI-powered smart home burrow develops a mind of its own with sinister intentions toward its spiky inhabitants.',
    posterUrl: getRandomImage('nature'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2022',
    ageRating: 'PG-13',
    duration: '1h 50m',
    genre: ['Horror', 'Sci-Fi']
  },
  
  // New content with better images
  {
    id: '13',
    title: 'Spiky SQL',
    description: 'A documentary series about a hedgehog who becomes obsessed with databases and builds the world\'s first hedgehog-operated data center.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2023',
    ageRating: 'TV-PG',
    duration: '1 Season',
    genre: ['Technology', 'Documentary', 'Business'],
    trending: true
  },
  {
    id: '14',
    title: 'Hedgehog\'s Gambit',
    description: 'A prodigy hedgehog rises to the top of the international chess circuit while battling childhood trauma and addiction.',
    posterUrl: getRandomImage('animals'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2023',
    ageRating: 'TV-MA',
    duration: '1 Season',
    genre: ['Drama', 'Sports', 'Biography']
  },
  {
    id: '15',
    title: 'Prickly Heist',
    description: 'A band of hedgehog thieves plans the perfect garden heist to steal the neighborhood\'s prized vegetables in this animated comedy.',
    posterUrl: getRandomImage('nature'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2023',
    ageRating: 'PG',
    duration: '1h 42m',
    genre: ['Animation', 'Comedy', 'Crime']
  },
  {
    id: '16',
    title: 'Quills of Fury',
    description: 'A martial arts master hedgehog defends his forest against invasive species using his legendary quill techniques.',
    posterUrl: getRandomImage('animals'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2022',
    ageRating: 'PG-13',
    duration: '2h 05m',
    genre: ['Action', 'Adventure', 'Fantasy']
  },
  {
    id: '17',
    title: 'Hogwarts: A Hedgehog Tale',
    description: 'When a hedgehog accidentally gets an acceptance letter to a famous school of witchcraft, he must pretend to be a wizard to fit in.',
    posterUrl: getRandomImage('animals'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2021',
    ageRating: 'PG',
    duration: '1h 55m',
    genre: ['Fantasy', 'Comedy', 'Family'],
    trending: true
  },
  {
    id: '18',
    title: 'Midnight Forager',
    description: 'A nocturnal hedgehog detective solves mysteries in the garden while the humans sleep, using his sharp senses and sharper quills.',
    posterUrl: getRandomImage('nature'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2022',
    ageRating: 'TV-14',
    duration: '2 Seasons',
    genre: ['Mystery', 'Crime', 'Drama']
  },
  {
    id: '19',
    title: 'Hedge Fund',
    description: 'A financial genius hedgehog builds a wall street empire using acorn futures and berry commodities trading.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2023',
    ageRating: 'R',
    duration: '2h 32m',
    genre: ['Drama', 'Biography', 'Finance']
  },
  {
    id: '20',
    title: 'Prickles in Paris',
    description: 'A country hedgehog moves to the fashion capital of the world and becomes an unlikely style icon with his unique quill arrangements.',
    posterUrl: getRandomImage('animals'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2021',
    ageRating: 'TV-PG',
    duration: '3 Seasons',
    genre: ['Comedy', 'Fashion', 'Romance']
  },
  
  // Additional new content with high-quality images
  {
    id: '21',
    title: 'Spikes & Bytes',
    description: 'A hedgehog cybersecurity expert fights digital threats and hackers to protect the forest\'s sensitive data from falling into the wrong paws.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2024',
    ageRating: 'TV-14',
    duration: '1 Season',
    genre: ['Technology', 'Thriller', 'Action']
  },
  {
    id: '22',
    title: 'The Hedgehog Algorithm',
    description: 'When a hedgehog creates an AI that can predict the future, he must navigate ethical dilemmas and corporate espionage to keep his invention from being misused.',
    posterUrl: getRandomImage('tech'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2023',
    ageRating: 'PG-13',
    duration: '2h 12m',
    genre: ['Sci-Fi', 'Drama', 'Ethics']
  },
  {
    id: '23',
    title: 'Wild Coders',
    description: 'A documentary following hedgehogs who leave their corporate jobs to become independent developers, building apps that change how animals interact with technology.',
    posterUrl: getRandomImage('nature'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'series',
    releaseYear: '2023',
    ageRating: 'TV-PG',
    duration: '1 Season',
    genre: ['Documentary', 'Technology', 'Entrepreneurship']
  },
  {
    id: '24',
    title: 'Quill & Keyboard',
    description: 'A heartwarming story about a rural hedgehog who teaches coding to underprivileged woodland creatures, changing their lives forever.',
    posterUrl: getRandomImage('animals'),
    backdropUrl: getRandomImage('backdrops'),
    type: 'movie',
    releaseYear: '2022',
    ageRating: 'G',
    duration: '1h 48m',
    genre: ['Drama', 'Family', 'Inspiration'],
    trending: true
  }
];

// Update the mockCategories to include new content
export const mockCategories: Category[] = [
  {
    id: 'trending',
    name: 'Trending Now',
    contentIds: ['1', '5', '10', '13', '17', '24']
  },
  {
    id: 'new-releases',
    name: 'New Releases',
    contentIds: ['3', '6', '10', '13', '15', '19', '21', '22']
  },
  {
    id: 'tech',
    name: 'Tech Adventures',
    contentIds: ['1', '3', '7', '8', '13', '21', '22']
  },
  {
    id: 'comedies',
    name: 'Spiky Comedies',
    contentIds: ['4', '6', '9', '15', '17', '20']
  },
  {
    id: 'data',
    name: 'Data Stories',
    contentIds: ['3', '5', '7', '13', '19', '21']
  },
  {
    id: 'dramas',
    name: 'Hedgehog Dramas',
    contentIds: ['2', '10', '11', '14', '18', '24']
  },
  {
    id: 'action',
    name: 'Action & Adventure',
    contentIds: ['8', '16', '17', '18', '21']
  },
  {
    id: 'fantasy',
    name: 'Fantasy Tales',
    contentIds: ['12', '16', '17', '22']
  },
  {
    id: 'documentaries',
    name: 'Documentaries',
    contentIds: ['13', '23']
  },
  {
    id: 'nature',
    name: 'Nature & Wildlife',
    contentIds: ['11', '15', '18', '23']
  }
];

export const getFeaturedContent = (): Content => {
  const trendingContent = mockContent.filter(content => content.trending);
  return trendingContent[Math.floor(Math.random() * trendingContent.length)];
};

export const getContentById = (id: string): Content | undefined => {
  return mockContent.find(item => item.id === id);
};

export const getContentByCategory = (categoryId: string): Content[] => {
  const category = mockCategories.find(cat => cat.id === categoryId);
  if (!category) return [];
  return category.contentIds.map(id => mockContent.find(content => content.id === id)!).filter(Boolean);
};

export const getAllCategories = (): Category[] => {
  return mockCategories;
};
