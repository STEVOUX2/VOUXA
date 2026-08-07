export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  overview: string | null;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number | null;
  genres: string[] | null;
  runtime: number | null;
  cast: CastMember[] | null;
  director: string | null;
  tagline: string | null;
  created_at: string;
  updated_at: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Subtitle {
  id: string;
  movie_id: string;
  language: string;
  file_url: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      movies: {
        Row: Movie;
        Insert: Omit<Movie, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Movie, 'id' | 'created_at'>>;
      };
      subtitles: {
        Row: Subtitle;
        Insert: Omit<Subtitle, 'id' | 'created_at'>;
        Update: Partial<Omit<Subtitle, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'created_at'>>;
      };
    };
  };
}
