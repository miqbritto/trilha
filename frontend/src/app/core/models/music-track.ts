export interface CreateMusicTrack {
    title: string;
    movieId: string;
    artist: string;
    note: string | null;
}

export interface MusicTrack {
  id: string;
  title: string;
  movieId: string;
  artist: string | null;
  note: string | null;
  externalId: string;
  previewUrl: string | null;
  source: string;
}