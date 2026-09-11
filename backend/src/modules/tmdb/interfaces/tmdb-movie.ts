export interface TmdbMovie {
    id: number;
    title: string;
    original_title: string;
    director: string | null;
    release_date: string | null;
    poster_path: string | null
}

export interface TmdbMovieSearchResponse {
    page: number;
    results: TmdbMovie[];
    total_pages: number;
    total_results: number;
}

export interface TmdbMovieCredits {
    crew: {
        id: number;
        name: string;
        job: string
    }[];
}