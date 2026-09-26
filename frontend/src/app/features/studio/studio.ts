import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Shell } from '../../shared/components/shell/shell';
import { MovieService } from '../../core/services/movie.service';
import { Movie, MovieOption } from '../../core/models/movie';
import { MusicTrackService } from '../../core/services/music-track.service';
import { GameService } from '../../core/services/game.service';
import { StudioChallengeResponse } from '../../core/models/game-challenge';
import { Subscription, switchMap, timer } from 'rxjs';
import { MusicOption } from '../../core/models/music-track';

@Component({
  selector: 'app-studio',
  imports: [Shell, FormsModule, DatePipe],
  templateUrl: './studio.html',
  styleUrl: './studio.scss',
})
export class Studio implements OnDestroy {
  protected adminKey = '';
  protected readonly movieService = inject(MovieService);
  private readonly musicTrackService = inject(MusicTrackService);
  private readonly gameService = inject(GameService);
  protected readonly challenges = signal<StudioChallengeResponse[]>([]);
  protected readonly challengesLoading = signal(false);
  protected readonly challengesLoaded = signal(false);
  protected readonly challengesError = signal('');
  private challengesRequest?: Subscription;
  private tracksRequest?: Subscription;
  private challengeSaveRequest?: Subscription;
  protected readonly challengeSaving = signal(false);
  protected readonly challengeError = signal('');
  protected readonly tracksLoading = signal(false);
  protected readonly tracksError = signal('');
  protected readonly tab = signal<'music' | 'challenge' | 'movie'>('music');
  protected movieQuery = '';
  protected movieQuote = '';
  protected readonly tmdbMovies = signal<Movie[]>([]);
  protected readonly tmdbSelection = signal<Movie | null>(null);
  protected readonly movieSearching = signal(false);
  protected readonly movieSearched = signal(false);
  protected readonly movieSaving = signal(false);
  protected readonly movieError = signal('');
  private movieSearchRequest?: Subscription;
  private movieSaveRequest?: Subscription;
  protected readonly feedback = signal('');
  protected readonly fileError = signal('');
  protected readonly audioFile = signal<File | null>(null);
  protected readonly audioUrl = signal('');
  protected readonly dragging = signal(false);
  protected readonly revealStages = [1, 2, 4, 6, 8];
  protected readonly movies = signal<MovieOption[]>([]);
  protected readonly selectedMovie = signal<MovieOption | null>(null)
  protected readonly tracks = signal<MusicOption[]>([]);
  protected music = this.emptyMusic();
  protected readonly trackId = signal('');
  protected challengeDate = '';
  protected readonly selectedTrack = computed(() =>
    this.tracks().find((track) => track.id === this.trackId()),
  );

  protected switchTab(tab: 'music' | 'challenge' | 'movie'): void {
    this.tab.set(tab);
    this.feedback.set('');
    if (tab === 'challenge') {
      if (this.adminKey.trim()) this.loadChallenges();
      this.loadTracks();
    }
  }

  protected updateAdminKey(key: string): void {
    if (key === this.adminKey) return;
    this.challengesRequest?.unsubscribe();
    this.tracksRequest?.unsubscribe();
    this.tracks.set([]);
    this.trackId.set('');
    this.tracksLoading.set(false);
    this.tracksError.set('');
    this.adminKey = key;
    this.challenges.set([]);
    this.challengesLoading.set(false);
    this.challengesLoaded.set(false);
    this.challengesError.set('');
    this.challengeError.set('');
  }

  protected searchTmdbMovies(value: string): void {
    this.movieSearchRequest?.unsubscribe();
    this.movieQuery = value;
    this.tmdbSelection.set(null);
    this.tmdbMovies.set([]);
    this.movieError.set('');
    this.feedback.set('');
    this.movieSearched.set(false);
    const query = value.trim();
    if (query.length > 30) this.movieError.set('Use até 30 caracteres para buscar um filme.');
    this.movieSearching.set(query.length >= 2 && query.length <= 30);
    if (!this.movieSearching()) return;
    this.movieSearchRequest = timer(300).pipe(
      switchMap(() => this.movieService.searchMovie(query)),
    ).subscribe({
      next: (movies) => {
        this.tmdbMovies.set(movies);
        this.movieSearching.set(false);
        this.movieSearched.set(true);
      },
      error: () => {
        this.movieSearching.set(false);
        this.movieError.set('Não foi possível buscar filmes. Altere a busca para tentar novamente.');
      },
    });
  }

  protected selectTmdbMovie(movie: Movie): void {
    this.movieSearchRequest?.unsubscribe();
    this.tmdbSelection.set(movie);
    this.movieQuery = movie.title;
    this.tmdbMovies.set([]);
    this.movieSearching.set(false);
    this.movieError.set('');
  }

  protected saveMovie(form: NgForm): void {
    const movie = this.tmdbSelection();
    if (form.invalid || !movie || !this.adminKey.trim() || this.movieSaving()) return;
    this.movieSaving.set(true);
    this.movieError.set('');
    this.feedback.set('');
    this.movieSaveRequest = this.movieService.create({
      tmdbId: movie.tmdbId,
      quote: this.movieQuote,
    }, this.adminKey).subscribe({
      next: (registered) => {
        this.movieSaving.set(false);
        this.movieQuery = '';
        this.movieQuote = '';
        this.tmdbSelection.set(null);
        this.tmdbMovies.set([]);
        this.movieSearched.set(false);
        form.resetForm({ movieQuery: '', movieQuote: '', movieAdminKey: this.adminKey });
        this.feedback.set(`Filme "${registered.title}" disponível no catálogo. Você já pode selecioná-lo no cadastro de músicas.`);
      },
      error: (error) => {
        this.movieSaving.set(false);
        this.movieError.set(error.status === 401 || error.status === 403
          ? 'Chave de administrador inválida. Confira a chave e tente novamente.'
          : 'Não foi possível cadastrar o filme. Tente novamente.');
      },
    });
  }

  protected loadTracks() {
    this.tracksRequest?.unsubscribe();
    if (!this.adminKey.trim()) {
      this.tracksError.set('Informe a chave de administrador e atualize o catálogo.');
      return;
    }
    this.tracksLoading.set(true);
    this.tracksError.set('');
    this.tracksRequest = this.musicTrackService.getAllTracks(this.adminKey).subscribe(
      {
        next: tracks => {
          this.tracks.set([...tracks]);
          this.tracksLoading.set(false);
        },
        error: (error) => {
          this.tracksLoading.set(false);
          this.tracksError.set(error.status === 401 || error.status === 403
            ? 'Chave de administrador inválida. Confira a chave e atualize o catálogo.'
            : 'Não foi possível carregar as músicas. Tente novamente.');
        }
      }
    )
  }

  protected loadChallenges(): void {
    if (!this.adminKey.trim() || this.challengesLoading()) return;
    this.challengesLoading.set(true);
    this.challengesLoaded.set(false);
    this.challengesError.set('');
    this.challenges.set([]);
    this.challengesRequest = this.gameService.getStudioChallenges(this.adminKey).subscribe({
      next: (challenges) => {
        this.challenges.set([...challenges].sort((a, b) => a.date.localeCompare(b.date)));
        this.challengesLoaded.set(true);
        this.challengesLoading.set(false);
      },
      error: (error) => {
        this.challengesLoading.set(false);
        this.challengesError.set(error.status === 401 || error.status === 403
          ? 'Chave de administrador inválida. Confira a chave e tente novamente.'
          : 'Não foi possível carregar a agenda. Tente novamente.');
      },
    });
  }

  protected selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
    input.value = '';
  }

  protected dragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected dropFile(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length !== 1) {
      this.fileError.set('Selecione um arquivo de áudio por vez.');
      return;
    }
    this.setFile(files[0]);
  }

  protected searchMovies(search: string) {
    const query = search.trim()

    this.music.movie = ''
    this.movies.set([])

    if(!query) return;

    this.movieService.getMovieOptions(query).subscribe({
      next: (movies) => this.movies.set(movies),
      error: () => this.feedback.set("Não foi possível buscar os filmes")
    })
  }

  protected selectMovie(movie: MovieOption) {
    this.selectedMovie.set(movie)
    this.music.movie = movie.title;
    this.movies.set([])
  }

  private setFile(file: File): void {
    this.fileError.set('');
    this.feedback.set('');
    if (!/\.(mp3|wav|ogg|m4a)$/i.test(file.name)) {
      this.fileError.set('Escolha um áudio em MP3, WAV, OGG ou M4A.');
      return;
    }
    if (file.size === 0 || file.size > 20 * 1024 * 1024) {
      this.fileError.set('Escolha um arquivo não vazio de até 20 MB para esta prévia.');
      return;
    }
    this.removeFile();
    this.audioFile.set(file);
    this.audioUrl.set(URL.createObjectURL(file));
  }

  protected removeFile(): void {
    if (this.audioUrl()) URL.revokeObjectURL(this.audioUrl());
    this.audioUrl.set('');
    this.audioFile.set(null);
    this.fileError.set('');
  }

  protected resetMusic(form: NgForm): void {
    this.music = this.emptyMusic();
    form.resetForm({ ...this.music, adminKey: this.adminKey });
    this.removeFile();
    this.feedback.set('');
  }

  protected saveMusic(form: NgForm): void {
    
    const movie = this.selectedMovie();
    const audio = this.audioFile();

    if (form.invalid || !movie || !audio || !this.music.title.trim()) return;

    this.musicTrackService.create(
      {
        title: this.music.title,
        movieId: movie?.id,
        artist: this.music.artist,
        note: this.music.note
      },
      audio,
      this.adminKey
    ).subscribe({
      next: (track) => {
        this.resetMusic(form);
        this.selectedMovie.set(null);
        this.feedback.set(`Música "${track.title}" cadastrada!`);
      },
      error: () => {
        this.feedback.set('Não foi possível cadastrar a música.');
      }
    })
  }

  protected saveChallenge(form: NgForm): void {
    const track = this.selectedTrack();
    if (form.invalid || !track || !this.challengeDate || !this.adminKey.trim() || this.challengeSaving()) return;
    this.challengeError.set('');
    this.feedback.set('');
    if (this.challenges().some((challenge) => challenge.date === this.challengeDate)) {
      this.challengeError.set('Já existe um desafio para essa data. Escolha outro dia.');
      return;
    }
    this.challengeSaving.set(true);
    this.challengeSaveRequest = this.gameService.createDailyChallenge(
      track.id, this.challengeDate, this.adminKey,
    ).subscribe({
      next: () => {
        this.challengeSaving.set(false);
        this.challengeDate = '';
        this.trackId.set('');
        form.resetForm({ date: '', trackId: '', challengeAdminKey: this.adminKey });
        this.feedback.set('Desafio cadastrado com sucesso!');
        this.challengesRequest?.unsubscribe();
        this.challengesLoading.set(false);
        this.loadChallenges();
      },
      error: (error) => {
        this.challengeSaving.set(false);
        this.challengeError.set(error.status === 401 || error.status === 403
          ? 'Chave de administrador inválida. Confira a chave e tente novamente.'
          : error.status === 409
            ? 'Já existe um desafio para essa data. Escolha outro dia.'
            : error.status === 404
              ? 'Música não encontrada. Atualize o catálogo e selecione outra música.'
              : error.status === 400
                ? 'Confira a data e a música selecionadas e tente novamente.'
                : 'Não foi possível cadastrar o desafio. Tente novamente.');
      },
    });
  }

  private emptyMusic() {
    return { title: '', artist: '', movie: '', note: '' };
  }

  ngOnDestroy(): void {
    this.movieSearchRequest?.unsubscribe();
    this.movieSaveRequest?.unsubscribe();
    this.challengesRequest?.unsubscribe();
    this.tracksRequest?.unsubscribe();
    this.challengeSaveRequest?.unsubscribe();
    if (this.audioUrl()) URL.revokeObjectURL(this.audioUrl());
  }
}
