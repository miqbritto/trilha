import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { GameService } from '../core/services/game.service';
import { GameSessionStorage } from '../core/services/game-session-storage.service';
import { MovieService } from '../core/services/movie.service';
import { HowToPlayDialog } from '../shared/components/shell/components/how-to-play-dialog/how-to-play-dialog';
import { Game } from './game/game';
import { History } from './history/history';
import { GameOver } from './game-over/game-over';
import { DailyGameChallenge } from '../core/models/game-challenge';

describe('Player request feedback', () => {
  const challenge: DailyGameChallenge = {
    id: 'challenge-1', mode: 'daily', number: 1, date: '2026-09-24',
    expiresAt: '', rules: { revealStages: [1, 2, 4, 6, 8] },
  };
  const movie = { tmdbId: 1, title: 'Filme', releaseYear: 2000, director: null, posterUrl: null, quote: null };
  const unavailable = () => throwError(() => new HttpErrorResponse({ status: 503 }));
  let api: { getDailyChallenge: ReturnType<typeof vi.fn>; getAllChallenges: ReturnType<typeof vi.fn>; sendGuess: ReturnType<typeof vi.fn>; getDailyResult: ReturnType<typeof vi.fn> };
  let movies: { searchMovie: ReturnType<typeof vi.fn>; getDirector: ReturnType<typeof vi.fn> };
  let storage: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      getDailyChallenge: vi.fn(() => of(challenge)),
      getAllChallenges: vi.fn(() => of([])),
      sendGuess: vi.fn(() => of({ correct: false })),
      getDailyResult: vi.fn(() => of({ movie, track: { title: 'Faixa' } })),
    };
    movies = { searchMovie: vi.fn(() => of([])), getDirector: vi.fn(() => of({ director: null })) };
    storage = { load: vi.fn(() => null), save: vi.fn() };
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: GameService, useValue: api },
      { provide: MovieService, useValue: movies },
      { provide: GameSessionStorage, useValue: storage },
    ] });
    vi.spyOn(HowToPlayDialog.prototype, 'open').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('shows loading, then a recoverable error, and retries the challenge', async () => {
    const pending = new Subject<DailyGameChallenge>();
    api.getDailyChallenge.mockReturnValueOnce(pending);
    const fixture = TestBed.createComponent(Game);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Carregando desafio');
    pending.error(new HttpErrorResponse({ status: 503 }));
    await Promise.resolve();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Não foi possível carregar');
    expect(fixture.nativeElement.querySelector('#movie-guess')).toBeNull();
    fixture.nativeElement.querySelector('.request-state button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#movie-guess')).not.toBeNull();
    expect(api.getDailyChallenge).toHaveBeenCalledTimes(2);
  });

  it('explains when the daily challenge is unavailable', async () => {
    api.getDailyChallenge.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const fixture = TestBed.createComponent(Game);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('O desafio de hoje ainda não está disponível');
  });

  it('keeps the selected movie and attempts when a guess fails, then retries once', async () => {
    api.sendGuess.mockReturnValueOnce(unavailable());
    const fixture = TestBed.createComponent(Game);
    await fixture.whenStable();
    const game = fixture.componentInstance;
    game.selectMovie(movie);
    await game.makeGuess();
    await fixture.whenStable();
    expect(game.guessesMade()).toBe(0);
    expect(game.movieSearch.selectedMovie()).toEqual(movie);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('confirmar o palpite');
    await game.makeGuess();
    expect(game.guessesMade()).toBe(1);
    expect(game.guessError()).toBe('');
  });

  it('distinguishes search failure from no results and retries the same query', async () => {
    const fixture = TestBed.createComponent(Game);
    await fixture.whenStable();
    vi.useFakeTimers();
    movies.searchMovie.mockReturnValueOnce(unavailable());
    const game = fixture.componentInstance;
    game.movieSearch.searchMovie('Filme');
    await vi.advanceTimersByTimeAsync(350);
    expect(game.movieSearch.searchError()).toContain('Não foi possível buscar');
    game.movieSearch.retrySearch();
    await vi.advanceTimersByTimeAsync(350);
    expect(movies.searchMovie).toHaveBeenCalledTimes(2);
    expect(game.movieSearch.searchError()).toBe('');
    expect(game.movieSearch.suggestions()).toEqual([]);
  });

  it('stops loading if the challenge request never responds', async () => {
    const fixture = TestBed.createComponent(Game);
    await fixture.whenStable();
    vi.useFakeTimers();
    api.getDailyChallenge.mockReturnValue(new Subject());
    const request = fixture.componentInstance.startNewGame();
    await vi.advanceTimersByTimeAsync(15000);
    await request;
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.loadError()).not.toBe('');
  });

  it('retries the history and shows its empty state only after success', async () => {
    api.getAllChallenges.mockReturnValueOnce(unavailable());
    const fixture = TestBed.createComponent(History);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar o histórico');
    expect(fixture.nativeElement.textContent).not.toContain('Ainda não há desafios');
    fixture.nativeElement.querySelector('.request-state button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Ainda não há desafios');
  });

  it('provides a way back to the game when no session exists', async () => {
    const fixture = TestBed.createComponent(GameOver);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.request-state a').getAttribute('href')).toBe('/game');
    expect(api.getDailyResult).not.toHaveBeenCalled();
  });

  it('retries a failed result without changing the saved game', async () => {
    storage.load.mockReturnValue({ version: 1, challenge, guesses: [{ movie, correct: true }] });
    api.getDailyResult.mockReturnValueOnce(unavailable());
    const fixture = TestBed.createComponent(GameOver);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar o resultado');
    fixture.nativeElement.querySelector('.request-state button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.movie-info h2').textContent).toBe('Filme');
    expect(storage.save).not.toHaveBeenCalled();
  });
});
