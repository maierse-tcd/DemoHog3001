
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
    title: 'Stranger Series',
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
    posterUrl: 'https://source.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    backdropUrl: 'https://source.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    type: 'series',
    releaseYear: 2022,
    ageRating: 'TV-14',
    duration: '3 Seasons',
    genre: ['Mystery', 'Thriller', 'Sci-Fi'],
    trending: true
  },
  {
    id: '2',
    title: 'Tech Connection',
    description: 'Follow the stories of tech entrepreneurs as they navigate the challenges of building startups in Silicon Valley.',
    posterUrl: 'https://source.unsplash.com/photo-1488590528505-98d2b5aba04b',
    type: 'series',
    releaseYear: 2021,
    ageRating: 'TV-MA',
    duration: '2 Seasons',
    genre: ['Drama', 'Business']
  },
  {
    id: '3',
    title: 'Digital Horizons',
    description: 'A documentary exploring how digital technology is reshaping our world and the implications for humanity.',
    posterUrl: 'https://source.unsplash.com/photo-1519389950473-47ba0277781c',
    type: 'movie',
    releaseYear: 2023,
    ageRating: 'PG-13',
    duration: '1h 45m',
    genre: ['Documentary', 'Technology']
  },
  {
    id: '4',
    title: 'The Screen Sitters',
    description: 'A family comedy about parents trying to navigate raising children in the digital age.',
    posterUrl: 'https://source.unsplash.com/photo-1649972904349-6e44c42644a7',
    type: 'movie',
    releaseYear: 2020,
    ageRating: 'PG',
    duration: '1h 30m',
    genre: ['Comedy', 'Family']
  },
  {
    id: '5',
    title: 'Surveillance',
    description: 'In this psychological thriller, a woman becomes convinced she is being watched through her digital devices.',
    posterUrl: 'https://source.unsplash.com/photo-1605810230434-7631ac76ec81',
    backdropUrl: 'https://source.unsplash.com/photo-1605810230434-7631ac76ec81',
    type: 'movie',
    releaseYear: 2022,
    ageRating: 'R',
    duration: '2h 10m',
    genre: ['Thriller', 'Mystery'],
    trending: true
  },
  {
    id: '6',
    title: 'Home Stream',
    description: 'A reality show about families living their daily lives under constant streaming.',
    posterUrl: 'https://source.unsplash.com/photo-1721322800607-8c38375eef04',
    type: 'series',
    releaseYear: 2023,
    ageRating: 'TV-14',
    duration: '1 Season',
    genre: ['Reality', 'Drama']
  },
  {
    id: '7',
    title: 'Algorithm',
    description: 'A brilliant programmer discovers an algorithm that can predict human behavior with frightening accuracy.',
    posterUrl: 'https://source.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    type: 'movie',
    releaseYear: 2021,
    ageRating: 'PG-13',
    duration: '1h 55m',
    genre: ['Sci-Fi', 'Drama']
  },
  {
    id: '8',
    title: 'Virtual Reality',
    description: 'When virtual reality becomes indistinguishable from the real world, a man fights to remember what is real.',
    posterUrl: 'https://source.unsplash.com/photo-1488590528505-98d2b5aba04b',
    type: 'movie',
    releaseYear: 2020,
    ageRating: 'R',
    duration: '2h 15m',
    genre: ['Sci-Fi', 'Action']
  },
  {
    id: '9',
    title: 'Modern Family 2.0',
    description: 'A mockumentary following the lives of a family where technology plays a central role in their interactions.',
    posterUrl: 'https://source.unsplash.com/photo-1649972904349-6e44c42644a7',
    type: 'series',
    releaseYear: 2022,
    ageRating: 'TV-PG',
    duration: '4 Seasons',
    genre: ['Comedy', 'Family']
  },
  {
    id: '10',
    title: 'Network',
    description: 'A gripping drama about the rise and fall of a social media network and its controversial founder.',
    posterUrl: 'https://source.unsplash.com/photo-1519389950473-47ba0277781c',
    type: 'series',
    releaseYear: 2023,
    ageRating: 'TV-MA',
    duration: '1 Season',
    genre: ['Drama', 'Biography']
  },
  {
    id: '11',
    title: 'Digital Detox',
    description: 'A group of technology addicts are sent to a remote retreat to overcome their dependencies.',
    posterUrl: 'https://source.unsplash.com/photo-1605810230434-7631ac76ec81',
    type: 'series',
    releaseYear: 2021,
    ageRating: 'TV-14',
    duration: '1 Season',
    genre: ['Reality', 'Drama']
  },
  {
    id: '12',
    title: 'Smart Home',
    description: 'A family\'s new AI-powered smart home develops a mind of its own with sinister intentions.',
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
    id: 'sci-fi',
    name: 'Sci-Fi Adventures',
    contentIds: ['1', '7', '8', '12']
  },
  {
    id: 'comedies',
    name: 'Comedies',
    contentIds: ['4', '9']
  },
  {
    id: 'documentaries',
    name: 'Documentaries',
    contentIds: ['3']
  },
  {
    id: 'dramas',
    name: 'Dramas',
    contentIds: ['2', '5', '10', '11']
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
