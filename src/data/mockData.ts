export interface Category {
  id: string;
  name: string;
}

export const mockCategories: Category[] = [
  { id: 'trending', name: 'Trending Now' },
  { id: 'tech', name: 'Tech & Design' },
  { id: 'comedies', name: 'Comedies' },
  { id: 'dramas', name: 'Dramas' },
  { id: 'action', name: 'Action & Adventure' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'documentaries', name: 'Documentaries' },
  { id: 'nature', name: 'Nature' }
];

export type Genre = 
  | 'Action' | 'Adventure' | 'Animation' | 'Comedy' | 'Crime'
  | 'Documentary' | 'Drama' | 'Family' | 'Fantasy' | 'Horror'  
  | 'Mystery' | 'Romance' | 'Sci-Fi' | 'Thriller' | 'Western'
  | 'Biography' | 'History' | 'Sport' | 'Musical' | 'War'
  | 'Technology' | 'Design' | 'Arts' | 'Creativity' | 'Data' 
  | 'Science' | 'Biography' | 'Sports' | 'Reality' | 'Fashion' 
  | 'Ethics' | 'Business' | 'Finance' | 'Entrepreneurship' 
  | 'Inspiration' | 'Nature' | 'Lifestyle';

export interface Content {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'series';
  posterUrl: string;
  backdropUrl: string;
  genre: Genre[];
  releaseYear: string;
  ageRating: string;
  duration: string;
  trending: boolean;
  videoUrl?: string;
}

export const mockContent: Content[] = [
  {
    id: '1',
    title: 'Stranger Things',
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    type: 'series',
    posterUrl: '/stranger_things_poster.jpg',
    backdropUrl: '/stranger_things_backdrop.jpg',
    genre: ['Drama', 'Fantasy', 'Horror'],
    releaseYear: '2016',
    ageRating: 'TV-14',
    duration: '4 Seasons',
    trending: true,
    videoUrl: 'https://www.youtube.com/embed/X7KtnsrViai'
  },
  {
    id: '2',
    title: 'The Queen\'s Gambit',
    description: 'Orphaned at a young age, Beth Harmon discovers she possesses an astonishing gift for chess while struggling with addiction.',
    type: 'series',
    posterUrl: '/queens_gambit_poster.jpg',
    backdropUrl: '/queens_gambit_backdrop.jpg',
    genre: ['Drama'],
    releaseYear: '2020',
    ageRating: 'TV-MA',
    duration: '1 Season',
    trending: true,
    videoUrl: 'https://www.youtube.com/embed/CDjieWsFFFw'
  },
  {
    id: '3',
    title: 'Bridgerton',
    description: 'Wealth, lust, and betrayal set against the backdrop of Regency-era England, seen through the eyes of the powerful Bridgerton family.',
    type: 'series',
    posterUrl: '/bridgerton_poster.jpg',
    backdropUrl: '/bridgerton_backdrop.jpg',
    genre: ['Drama', 'Romance'],
    releaseYear: '2020',
    ageRating: 'TV-MA',
    duration: '2 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/gpv7ayf_tyE'
  },
  {
    id: '4',
    title: 'The Crown',
    description: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign and the events that shaped the second half of the 20th century.',
    type: 'series',
    posterUrl: '/the_crown_poster.jpg',
    backdropUrl: '/the_crown_backdrop.jpg',
    genre: ['Drama', 'History'],
    releaseYear: '2016',
    ageRating: 'TV-MA',
    duration: '5 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/vwkpJuxVwJc'
  },
  {
    id: '5',
    title: 'Formula 1: Drive to Survive',
    description: 'A behind-the-scenes look at the drivers and races of the Formula One World Championship.',
    type: 'series',
    posterUrl: '/drive_to_survive_poster.jpg',
    backdropUrl: '/drive_to_survive_backdrop.jpg',
    genre: ['Documentary', 'Sport'],
    releaseYear: '2019',
    ageRating: 'TV-MA',
    duration: '4 Seasons',
    trending: true,
    videoUrl: 'https://www.youtube.com/embed/WTgn9qqCGLg'
  },
  {
    id: '6',
    title: 'Our Planet',
    description: 'Experience our planet\'s natural beauty and examine how climate change impacts all living creatures in this ambitious documentary.',
    type: 'series',
    posterUrl: '/our_planet_poster.jpg',
    backdropUrl: '/our_planet_backdrop.jpg',
    genre: ['Documentary', 'Nature'],
    releaseYear: '2019',
    ageRating: 'TV-G',
    duration: '1 Season',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/93UqgcR7wes'
  },
  {
    id: '7',
    title: 'The Social Dilemma',
    description: 'Explores the dangerous human impact of social networking, with tech experts sounding the alarm on their own creations.',
    type: 'movie',
    posterUrl: '/social_dilemma_poster.jpg',
    backdropUrl: '/social_dilemma_backdrop.jpg',
    genre: ['Documentary', 'Technology'],
    releaseYear: '2020',
    ageRating: 'PG-13',
    duration: '1h 34m',
    trending: true,
    videoUrl: 'https://www.youtube.com/embed/aWycg9nS5Jk'
  },
  {
    id: '8',
    title: 'The Imitation Game',
    description: 'During World War II, mathematician Alan Turing tries to crack the enigma code with help from fellow mathematicians.',
    type: 'movie',
    posterUrl: '/imitation_game_poster.jpg',
    backdropUrl: '/imitation_game_backdrop.jpg',
    genre: ['Drama', 'History'],
    releaseYear: '2014',
    ageRating: 'PG-13',
    duration: '1h 54m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/S5CjKEFb-sM'
  },
  {
    id: '9',
    title: 'Arrival',
    description: 'A linguist works with the military to communicate with alien lifeforms who have arrived on Earth.',
    type: 'movie',
    posterUrl: '/arrival_poster.jpg',
    backdropUrl: '/arrival_backdrop.jpg',
    genre: ['Sci-Fi', 'Mystery'],
    releaseYear: '2016',
    ageRating: 'PG-13',
    duration: '1h 56m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/tFMo3UJ4B4g'
  },
  {
    id: '10',
    title: 'Ex Machina',
    description: 'A young programmer is selected to participate in a ground-breaking experiment in artificial intelligence by evaluating the human qualities of a highly advanced humanoid A.I.',
    type: 'movie',
    posterUrl: '/ex_machina_poster.jpg',
    backdropUrl: '/ex_machina_backdrop.jpg',
    genre: ['Sci-Fi', 'Thriller'],
    releaseYear: '2014',
    ageRating: 'R',
    duration: '1h 48m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/EoMRA83SQlA'
  },
  {
    id: '11',
    title: 'Black Mirror',
    description: 'A British science fiction anthology series that examines how technology is shaping our lives.',
    type: 'series',
    posterUrl: '/black_mirror_poster.jpg',
    backdropUrl: '/black_mirror_backdrop.jpg',
    genre: ['Sci-Fi', 'Thriller', 'Technology'],
    releaseYear: '2011',
    ageRating: 'TV-MA',
    duration: '5 Seasons',
    trending: true,
    videoUrl: 'https://www.youtube.com/embed/jDiYGjp5KjI'
  },
  {
    id: '12',
    title: 'Abstract: The Art of Design',
    description: 'Step inside the minds of the world\'s most innovative designers and see how design impacts every aspect of life.',
    type: 'series',
    posterUrl: '/abstract_poster.jpg',
    backdropUrl: '/abstract_backdrop.jpg',
    genre: ['Documentary', 'Design', 'Arts'],
    releaseYear: '2017',
    ageRating: 'TV-PG',
    duration: '2 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/5VBWvjQjWzA'
  },
  {
    id: '13',
    title: 'Chef\'s Table',
    description: 'A documentary series that profiles some of the most renowned chefs in the world.',
    type: 'series',
    posterUrl: '/chefs_table_poster.jpg',
    backdropUrl: '/chefs_table_backdrop.jpg',
    genre: ['Documentary'],
    releaseYear: '2015',
    ageRating: 'TV-MA',
    duration: '6 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/m_WmpZM0K6k'
  },
  {
    id: '14',
    title: 'Explained',
    description: 'This enlightening series explores a variety of topics and current events in an accessible and engaging way.',
    type: 'series',
    posterUrl: '/explained_poster.jpg',
    backdropUrl: '/explained_backdrop.jpg',
    genre: ['Documentary'],
    releaseYear: '2018',
    ageRating: 'TV-MA',
    duration: '3 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/u5h2oDrHeqk'
  },
  {
    id: '15',
    title: 'The Minimalists: Less Is Now',
    description: 'A documentary about the benefits of living a minimalist lifestyle.',
    type: 'movie',
    posterUrl: '/the_minimalists_poster.jpg',
    backdropUrl: '/the_minimalists_backdrop.jpg',
    genre: ['Documentary'],
    releaseYear: '2021',
    ageRating: 'TV-14',
    duration: '1h 0m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/w9WG-5ZFG-k'
  },
  {
    id: '16',
    title: 'Citizenfour',
    description: 'A documentary about Edward Snowden and the NSA spying scandal.',
    type: 'movie',
    posterUrl: '/citizenfour_poster.jpg',
    backdropUrl: '/citizenfour_backdrop.jpg',
    genre: ['Documentary', 'Thriller'],
    releaseYear: '2014',
    ageRating: 'R',
    duration: '1h 54m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '17',
    title: 'Icarus',
    description: 'When Bryan Fogel sets out to uncover the truth about doping in sports, he accidentally unearths a major international scandal.',
    type: 'movie',
    posterUrl: '/icarus_poster.jpg',
    backdropUrl: '/icarus_backdrop.jpg',
    genre: ['Documentary', 'Thriller', 'Sports'],
    releaseYear: '2017',
    ageRating: 'TV-MA',
    duration: '2h 0m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '18',
    title: 'Free Solo',
    description: 'Alex Honnold attempts to conquer El Capitan\'s 3,000-foot vertical rock face in Yosemite National Park without ropes or safety gear.',
    type: 'movie',
    posterUrl: '/free_solo_poster.jpg',
    backdropUrl: '/free_solo_backdrop.jpg',
    genre: ['Documentary', 'Sports'],
    releaseYear: '2018',
    ageRating: 'PG-13',
    duration: '1h 40m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '19',
    title: 'The Last Dance',
    description: 'A 10-part documentary series about Michael Jordan and the Chicago Bulls dynasty of the 1990s.',
    type: 'series',
    posterUrl: '/the_last_dance_poster.jpg',
    backdropUrl: '/the_last_dance_backdrop.jpg',
    genre: ['Documentary', 'Sports'],
    releaseYear: '2020',
    ageRating: 'TV-MA',
    duration: '1 Season',
    trending: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '20',
    title: 'Senna',
    description: 'A documentary about the life and death of Brazilian Formula One champion Ayrton Senna.',
    type: 'movie',
    posterUrl: '/senna_poster.jpg',
    backdropUrl: '/senna_backdrop.jpg',
    genre: ['Documentary', 'Sports'],
    releaseYear: '2010',
    ageRating: 'PG-13',
    duration: '1h 46m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '21',
    title: 'Into the Inferno',
    description: 'Werner Herzog explores active volcanoes around the world and the cultures that surround them.',
    type: 'movie',
    posterUrl: '/into_the_inferno_poster.jpg',
    backdropUrl: '/into_the_inferno_backdrop.jpg',
    genre: ['Documentary', 'Nature'],
    releaseYear: '2016',
    ageRating: 'TV-MA',
    duration: '1h 44m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '22',
    title: 'Planet Earth II',
    description: 'David Attenborough returns to present a documentary series exploring the planet\'s diverse habitats.',
    type: 'series',
    posterUrl: '/planet_earth_ii_poster.jpg',
    backdropUrl: '/planet_earth_ii_backdrop.jpg',
    genre: ['Documentary', 'Nature'],
    releaseYear: '2016',
    ageRating: 'TV-G',
    duration: '1 Season',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '23',
    title: 'Blue Planet II',
    description: 'A documentary series exploring the world\'s oceans.',
    type: 'series',
    posterUrl: '/blue_planet_ii_poster.jpg',
    backdropUrl: '/blue_planet_ii_backdrop.jpg',
    genre: ['Documentary', 'Nature'],
    releaseYear: '2017',
    ageRating: 'TV-G',
    duration: '1 Season',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '24',
    title: 'Moving Art',
    description: 'Experience the beauty of nature through stunning time-lapse photography.',
    type: 'series',
    posterUrl: '/moving_art_poster.jpg',
    backdropUrl: '/moving_art_backdrop.jpg',
    genre: ['Documentary', 'Nature'],
    releaseYear: '2013',
    ageRating: 'TV-G',
    duration: '3 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '25',
    title: 'Minimalism: A Documentary About the Important Things',
    description: 'How might your life be better with less?',
    type: 'movie',
    posterUrl: '/minimalism_poster.jpg',
    backdropUrl: '/minimalism_backdrop.jpg',
    genre: ['Documentary'],
    releaseYear: '2015',
    ageRating: 'TV-14',
    duration: '1h 18m',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '26',
    title: 'Tidying Up with Marie Kondo',
    description: 'Japanese organizing consultant Marie Kondo helps people declutter their homes and transform their lives.',
    type: 'series',
    posterUrl: '/tidying_up_poster.jpg',
    backdropUrl: '/tidying_up_backdrop.jpg',
    genre: ['Reality', 'Lifestyle'],
    releaseYear: '2019',
    ageRating: 'TV-G',
    duration: '1 Season',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '27',
    title: 'Queer Eye',
    description: 'The Fab Five travel the U.S. to transform the lives of everyday people.',
    type: 'series',
    posterUrl: '/queer_eye_poster.jpg',
    backdropUrl: '/queer_eye_backdrop.jpg',
    genre: ['Reality', 'Lifestyle'],
    releaseYear: '2018',
    ageRating: 'TV-MA',
    duration: '6 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '28',
    title: 'Nailed It!',
    description: 'Home bakers with a terrible track record attempt to recreate edible masterpieces for a $10,000 prize.',
    type: 'series',
    posterUrl: '/nailed_it_poster.jpg',
    backdropUrl: '/nailed_it_backdrop.jpg',
    genre: ['Reality', 'Comedy'],
    releaseYear: '2018',
    ageRating: 'TV-G',
    duration: '7 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '29',
    title: 'Selling Sunset',
    description: 'The elite real estate brokers at The Oppenheim Group sell the luxe life to affluent buyers in Los Angeles.',
    type: 'series',
    posterUrl: '/selling_sunset_poster.jpg',
    backdropUrl: '/selling_sunset_backdrop.jpg',
    genre: ['Reality', 'Business'],
    releaseYear: '2019',
    ageRating: 'TV-MA',
    duration: '5 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '30',
    title: 'Get Organized with The Home Edit',
    description: 'Clea Shearer and Joanna Teplin of The Home Edit bring their skills to organize celebrity and everyday clients\' homes.',
    type: 'series',
    posterUrl: '/get_organized_poster.jpg',
    backdropUrl: '/get_organized_backdrop.jpg',
    genre: ['Reality', 'Lifestyle'],
    releaseYear: '2020',
    ageRating: 'TV-G',
    duration: '2 Seasons',
    trending: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

export const getFeaturedContent = (): Content => {
  const trendingContent = mockContent.filter(content => content.trending);
  if (trendingContent.length > 0) {
    return trendingContent[Math.floor(Math.random() * trendingContent.length)];
  } else {
    return mockContent[Math.floor(Math.random() * mockContent.length)];
  }
};
