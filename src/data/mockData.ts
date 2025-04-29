export interface Content {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl?: string;
  type: 'movie' | 'series';
  releaseYear: number;
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

export const mockContent: Content[] = [
  // Original content
  {
    id: '1',
    title: 'Code & Quills',
    description: 'Max, a brilliant hedgehog programmer, embarks on a thrilling journey to create the ultimate app, while navigating the quirks and joys of coding from his cozy home office.',
    posterUrl: 'https://source.unsplash.com/photo-1498050108023-c5249f4df085',
    backdropUrl: 'https://source.unsplash.com/photo-1498050108023-c5249f4df085',
    type: 'series',
    releaseYear: 2022,
    ageRating: 'TV-14',
    duration: '3 Seasons',
    genre: ['Technology', 'Comedy', 'Drama'],
    trending: true
  },
  {
    id: '2',
    title: 'Palette of Prickles',
    description: 'In his vibrant studio, Max, the creative hedgehog, brings his imaginative designs to life with colorful sketches and digital artistry, aiming to win a prestigious design contest.',
    posterUrl: 'https://source.unsplash.com/photo-1488590528505-98d2b5aba04b',
    type: 'series',
    releaseYear: 2021,
    ageRating: 'TV-PG',
    duration: '2 Seasons',
    genre: ['Design', 'Arts', 'Creativity']
  },
  {
    id: '3',
    title: 'Data Spikes',
    description: 'Donning his lab coat, Max delves into the world of data analysis, uncovering fascinating insights and solving complex problems, all from his sleek, modern office.',
    posterUrl: 'https://source.unsplash.com/photo-1519389950473-47ba0277781c',
    type: 'movie',
    releaseYear: 2023,
    ageRating: 'PG-13',
    duration: '1h 45m',
    genre: ['Data', 'Technology', 'Science']
  },
  {
    id: '4',
    title: 'Hedge Your Bets',
    description: 'A family of hedgehogs navigates the digital age, with their spiky little ones constantly getting into tech-related mischief.',
    posterUrl: 'https://source.unsplash.com/photo-1649972904349-6e44c42644a7',
    type: 'movie',
    releaseYear: 2020,
    ageRating: 'PG',
    duration: '1h 30m',
    genre: ['Comedy', 'Family']
  },
  {
    id: '5',
    title: 'Prickly Surveillance',
    description: 'In this psychological thriller, a hedgehog becomes convinced he is being tracked through his digital devices, leading to a web of paranoia and discovery.',
    posterUrl: 'https://source.unsplash.com/photo-1605810230434-7631ac76ec81',
    backdropUrl: 'https://source.unsplash.com/photo-1605810230434-7631ac76ec81',
    type: 'movie',
    releaseYear: 2022,
    ageRating: 'TV-14',
    duration: '2h 10m',
    genre: ['Thriller', 'Mystery'],
    trending: true
  },
  {
    id: '6',
    title: 'Hogstream',
    description: 'A reality show about hedgehog families living their daily lives under constant streaming, revealing the true nature of spiky celebrity.',
    posterUrl: 'https://source.unsplash.com/photo-1721322800607-8c38375eef04',
    type: 'series',
    releaseYear: 2023,
    ageRating: 'TV-14',
    duration: '1 Season',
    genre: ['Reality', 'Comedy']
  },
  {
    id: '7',
    title: 'The Quill Algorithm',
    description: 'A brilliant hedgehog mathematician discovers an algorithm that can predict behavior with frightening accuracy, changing how we understand spiny creatures forever.',
    posterUrl: 'https://source.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    type: 'movie',
    releaseYear: 2021,
    ageRating: 'PG-13',
    duration: '1h 55m',
    genre: ['Sci-Fi', 'Drama']
  },
  {
    id: '8',
    title: 'Virtual Hedge',
    description: 'When virtual reality becomes indistinguishable from the real world, a hedgehog fights to remember what is real and what is digital.',
    posterUrl: 'https://source.unsplash.com/photo-1488590528505-98d2b5aba04b',
    type: 'movie',
    releaseYear: 2020,
    ageRating: 'PG-13',
    duration: '2h 15m',
    genre: ['Sci-Fi', 'Action']
  },
  {
    id: '9',
    title: 'Modern Hedgehog 2.0',
    description: 'A mockumentary following the lives of a hedgehog family where technology plays a central role in their spiky interactions.',
    posterUrl: 'https://source.unsplash.com/photo-1649972904349-6e44c42644a7',
    type: 'series',
    releaseYear: 2022,
    ageRating: 'TV-PG',
    duration: '4 Seasons',
    genre: ['Comedy', 'Family']
  },
  {
    id: '10',
    title: 'Hog Network',
    description: 'A gripping drama about the rise and fall of a social media network for hedgehogs and its controversial founder.',
    posterUrl: 'https://source.unsplash.com/photo-1519389950473-47ba0277781c',
    type: 'series',
    releaseYear: 2023,
    ageRating: 'TV-MA',
    duration: '1 Season',
    genre: ['Drama', 'Biography']
  },
  {
    id: '11',
    title: 'Digital Detox for Hogs',
    description: 'A group of technology-addicted hedgehogs are sent to a remote retreat to overcome their dependencies and rediscover their natural instincts.',
    posterUrl: 'https://source.unsplash.com/photo-1605810230434-7631ac76ec81',
    type: 'series',
    releaseYear: 2021,
    ageRating: 'TV-14',
    duration: '1 Season',
    genre: ['Reality', 'Drama']
  },
  {
    id: '12',
    title: 'Smart Burrow',
    description: 'A family\'s new AI-powered smart home burrow develops a mind of its own with sinister intentions toward its spiky inhabitants.',
    posterUrl: 'https://source.unsplash.com/photo-1721322800607-8c38375eef04',
    type: 'movie',
    releaseYear: 2022,
    ageRating: 'PG-13',
    duration: '1h 50m',
    genre: ['Horror', 'Sci-Fi']
  },
  
  // New content
  {
    id: '13',
    title: 'Spiky SQL',
    description: 'A documentary series about a hedgehog who becomes obsessed with databases and builds the world\'s first hedgehog-operated data center.',
    posterUrl: 'https://source.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    backdropUrl: 'https://source.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    type: 'series',
    releaseYear: 2023,
    ageRating: 'TV-PG',
    duration: '1 Season',
    genre: ['Technology', 'Documentary', 'Business'],
    trending: true
  },
  {
    id: '14',
    title: 'Hedgehog\'s Gambit',
    description: 'A prodigy hedgehog rises to the top of the international chess circuit while battling childhood trauma and addiction.',
    posterUrl: 'https://source.unsplash.com/photo-1506744038136-46273834b3fb',
    type: 'series',
    releaseYear: 2023,
    ageRating: 'TV-MA',
    duration: '1 Season',
    genre: ['Drama', 'Sports', 'Biography']
  },
  {
    id: '15',
    title: 'Prickly Heist',
    description: 'A band of hedgehog thieves plans the perfect garden heist to steal the neighborhood\'s prized vegetables in this animated comedy.',
    posterUrl: 'https://source.unsplash.com/photo-1470813740244-df37b8c1edcb',
    type: 'movie',
    releaseYear: 2023,
    ageRating: 'PG',
    duration: '1h 42m',
    genre: ['Animation', 'Comedy', 'Crime']
  },
  {
    id: '16',
    title: 'Quills of Fury',
    description: 'A martial arts master hedgehog defends his forest against invasive species using his legendary quill techniques.',
    posterUrl: 'https://source.unsplash.com/photo-1582562124811-c09040d0a901',
    type: 'movie',
    releaseYear: 2022,
    ageRating: 'PG-13',
    duration: '2h 05m',
    genre: ['Action', 'Adventure', 'Fantasy']
  },
  {
    id: '17',
    title: 'Hogwarts: A Hedgehog Tale',
    description: 'When a hedgehog accidentally gets an acceptance letter to a famous school of witchcraft, he must pretend to be a wizard to fit in.',
    posterUrl: 'https://source.unsplash.com/photo-1506744038136-46273834b3fb',
    type: 'movie',
    releaseYear: 2021,
    ageRating: 'PG',
    duration: '1h 55m',
    genre: ['Fantasy', 'Comedy', 'Family'],
    trending: true
  },
  {
    id: '18',
    title: 'Midnight Forager',
    description: 'A nocturnal hedgehog detective solves mysteries in the garden while the humans sleep, using his sharp senses and sharper quills.',
    posterUrl: 'https://source.unsplash.com/photo-1470813740244-df37b8c1edcb',
    backdropUrl: 'https://source.unsplash.com/photo-1470813740244-df37b8c1edcb',
    type: 'series',
    releaseYear: 2022,
    ageRating: 'TV-14',
    duration: '2 Seasons',
    genre: ['Mystery', 'Crime', 'Drama']
  },
  {
    id: '19',
    title: 'Hedge Fund',
    description: 'A financial genius hedgehog builds a wall street empire using acorn futures and berry commodities trading.',
    posterUrl: 'https://source.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    type: 'movie',
    releaseYear: 2023,
    ageRating: 'R',
    duration: '2h 32m',
    genre: ['Drama', 'Biography', 'Finance']
  },
  {
    id: '20',
    title: 'Prickles in Paris',
    description: 'A country hedgehog moves to the fashion capital of the world and becomes an unlikely style icon with his unique quill arrangements.',
    posterUrl: 'https://source.unsplash.com/photo-1582562124811-c09040d0a901',
    type: 'series',
    releaseYear: 2021,
    ageRating: 'TV-PG',
    duration: '3 Seasons',
    genre: ['Comedy', 'Fashion', 'Romance']
  }
];

// Update the mockCategories to include new content
export const mockCategories: Category[] = [
  {
    id: 'trending',
    name: 'Trending Now',
    contentIds: ['1', '5', '10', '13', '17']
  },
  {
    id: 'new-releases',
    name: 'New Releases',
    contentIds: ['3', '6', '10', '13', '15', '19']
  },
  {
    id: 'tech',
    name: 'Tech Adventures',
    contentIds: ['1', '3', '7', '8', '13']
  },
  {
    id: 'comedies',
    name: 'Spiky Comedies',
    contentIds: ['4', '6', '9', '15', '17', '20']
  },
  {
    id: 'data',
    name: 'Data Stories',
    contentIds: ['3', '5', '7', '13', '19']
  },
  {
    id: 'dramas',
    name: 'Hedgehog Dramas',
    contentIds: ['2', '10', '11', '14', '18']
  },
  {
    id: 'action',
    name: 'Action & Adventure',
    contentIds: ['8', '16', '17', '18']
  },
  {
    id: 'fantasy',
    name: 'Fantasy Tales',
    contentIds: ['12', '16', '17']
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
