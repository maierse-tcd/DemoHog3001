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
  }
];

export const mockCategories: Category[] = [
  {
    id: 'trending',
    name: 'Trending Now',
    contentIds: ['1', '5', '10']
  },
  {
    id: 'new-releases',
    name: 'New Releases',
    contentIds: ['3', '6', '10']
  },
  {
    id: 'tech',
    name: 'Tech Adventures',
    contentIds: ['1', '3', '7', '8']
  },
  {
    id: 'comedies',
    name: 'Spiky Comedies',
    contentIds: ['4', '6', '9']
  },
  {
    id: 'data',
    name: 'Data Stories',
    contentIds: ['3', '5', '7']
  },
  {
    id: 'dramas',
    name: 'Hedgehog Dramas',
    contentIds: ['2', '10', '11']
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
