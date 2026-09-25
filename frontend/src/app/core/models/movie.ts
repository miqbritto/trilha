export interface Movie {
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  director: string | null;
  posterUrl: string | null;
  quote: string | null;
}

export interface MovieOption {
  id: string;
  title: string;
}

export interface CreateMovie {
  tmdbId: number;
  quote?: string;
}

export interface RegisteredMovie extends MovieOption {
  tmdbId: number;
  quote: string;
}
