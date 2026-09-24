import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Shell } from '../../shared/components/shell/shell';
import { MovieService } from '../../core/services/movie.service';
import { MovieOption } from '../../core/models/movie';

interface StudioTrack {
  id: string;
  title: string;
  artist: string;
  movie: string;
}

@Component({
  selector: 'app-studio',
  imports: [Shell, FormsModule, DatePipe],
  templateUrl: './studio.html',
  styleUrl: './studio.scss',
})
export class Studio implements OnDestroy {
  protected readonly movieService = inject(MovieService);
  protected readonly tab = signal<'music' | 'challenge'>('music');
  protected readonly feedback = signal('');
  protected readonly fileError = signal('');
  protected readonly audioFile = signal<File | null>(null);
  protected readonly audioUrl = signal('');
  protected readonly dragging = signal(false);
  protected readonly revealStages = [1, 2, 4, 6, 8];
  // Example catalog and drafts live only in this component. No API or storage is used.
  protected readonly movies = signal<MovieOption[]>([]);
  protected readonly selectedMovie = signal<MovieOption | null>(null)
  protected readonly tracks = signal<StudioTrack[]>([
    { id: 'example-1', title: 'Cornfield Chase', artist: 'Hans Zimmer', movie: 'Interestelar' },
    { id: 'example-2', title: 'Time', artist: 'Hans Zimmer', movie: 'A Origem' },
    {
      id: 'example-3',
      title: 'Comptine d’un autre été',
      artist: 'Yann Tiersen',
      movie: 'O Fabuloso Destino de Amélie Poulain',
    },
  ]);
  protected music = this.emptyMusic();
  protected readonly trackId = signal('');
  protected challengeDate = '';
  protected readonly selectedTrack = computed(() =>
    this.tracks().find((track) => track.id === this.trackId()),
  );
  protected readonly drafts = signal<{ date: string; track: StudioTrack }[]>([]);
  protected readonly sortedDrafts = computed(() =>
    [...this.drafts()].sort((a, b) => a.date.localeCompare(b.date)),
  );
  private nextTrackId = 1;

  protected switchTab(tab: 'music' | 'challenge'): void {
    this.tab.set(tab);
    this.feedback.set('');
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
    form.resetForm(this.music);
    this.removeFile();
    this.feedback.set('');
  }

  protected saveMusic(form: NgForm): void {
    if (form.invalid || !this.music.title.trim() || !this.audioFile()) return;
    const track: StudioTrack = {
      id: `draft-${this.nextTrackId++}`,
      title: this.music.title.trim(),
      artist: this.music.artist.trim(),
      movie: this.music.movie,
    };
    this.tracks.update((tracks) => [...tracks, track]);
    this.resetMusic(form);
    this.trackId.set(track.id);
    this.feedback.set(
      `“${track.title}” adicionada ao catálogo temporário. Você já pode usá-la na aba de desafios. Nenhum arquivo foi enviado.`,
    );
  }

  protected saveChallenge(form: NgForm): void {
    const track = this.selectedTrack();
    if (form.invalid || !track) return;
    if (this.drafts().some((draft) => draft.date === this.challengeDate)) {
      this.feedback.set(
        'Já existe um rascunho nesta data. Escolha outro dia ou remova o anterior.',
      );
      return;
    }
    this.drafts.update((drafts) => [...drafts, { date: this.challengeDate, track }]);
    this.feedback.set('Desafio adicionado à agenda de rascunhos. Ele ainda não foi publicado.');
  }

  protected removeChallenge(date: string): void {
    this.drafts.update((drafts) => drafts.filter((draft) => draft.date !== date));
    this.feedback.set('Rascunho removido da agenda.');
  }

  private emptyMusic() {
    return { title: '', artist: '', movie: '', note: '' };
  }

  ngOnDestroy(): void {
    if (this.audioUrl()) URL.revokeObjectURL(this.audioUrl());
  }
}
