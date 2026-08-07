export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: TMDBGenre[];
  runtime: number | null;
  tagline: string | null;
  status: string;
  popularity: number;
  adult: boolean;
  budget: number;
  revenue: number;
  imdb_id: string | null;
  homepage: string | null;
  original_language: string;
  production_companies: TMDBProductionCompany[];
  credits?: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  popularity: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBSearchResult {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}
