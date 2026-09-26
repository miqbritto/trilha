import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Studio } from './studio';
import { GameService } from '../../core/services/game.service';
import { MovieService } from '../../core/services/movie.service';
import { MusicTrackService } from '../../core/services/music-track.service';

describe('Studio challenge creation', () => {
  let studio: Studio;
  const games = { createDailyChallenge: vi.fn(), getStudioChallenges: vi.fn() };
  const music = { getAllTracks: vi.fn() };
  const track = { id: 'track-id', title: 'Main Title', movieTitle: 'Movie' };
  const form = { invalid: false, resetForm: vi.fn() } as unknown as NgForm;

  beforeEach(() => {
    vi.resetAllMocks();
    games.getStudioChallenges.mockReturnValue(of([]));
    music.getAllTracks.mockReturnValue(of([track]));
    TestBed.configureTestingModule({ providers: [
      { provide: GameService, useValue: games },
      { provide: MovieService, useValue: {} },
      { provide: MusicTrackService, useValue: music },
    ] });
    studio = TestBed.runInInjectionContext(() => new Studio());
    studio['adminKey'] = 'key';
    studio['tracks'].set([track]);
    studio['trackId'].set(track.id);
    studio['challengeDate'] = '2026-10-01';
  });

  afterEach(() => { studio.ngOnDestroy(); TestBed.resetTestingModule(); });

  it('requires an admin key before loading the catalog', () => {
    studio['adminKey'] = '';
    studio['switchTab']('challenge');
    expect(music.getAllTracks).not.toHaveBeenCalled();
    expect(studio['tracksError']()).toContain('chave');
    expect(games.getStudioChallenges).not.toHaveBeenCalled();
  });

  it('sends the key when loading the catalog and clears it on key changes', () => {
    studio['switchTab']('challenge');
    expect(music.getAllTracks).toHaveBeenCalledWith('key');
    studio['updateAdminKey']('other-key');
    expect(studio['tracks']()).toEqual([]);
    expect(studio['trackId']()).toBe('');
  });

  it('saves once, clears the form and reloads the persisted agenda', () => {
    const response = new Subject<unknown>();
    games.createDailyChallenge.mockReturnValue(response);
    studio['saveChallenge'](form);
    studio['saveChallenge'](form);
    expect(games.createDailyChallenge).toHaveBeenCalledExactlyOnceWith(track.id, '2026-10-01', 'key');
    expect(studio['challengeSaving']()).toBe(true);
    response.next({});
    expect(studio['challengeSaving']()).toBe(false);
    expect(studio['trackId']()).toBe('');
    expect(studio['challengeDate']).toBe('');
    expect(studio['adminKey']).toBe('key');
    expect(games.getStudioChallenges).toHaveBeenCalledWith('key');
  });

  it.each([401, 409, 500])('preserves input and allows retry after HTTP %i', (status) => {
    games.createDailyChallenge.mockReturnValue(throwError(() => ({ status })));
    studio['saveChallenge'](form);
    expect(studio['challengeSaving']()).toBe(false);
    expect(studio['challengeError']()).not.toBe('');
    expect(studio['trackId']()).toBe(track.id);
    expect(studio['challengeDate']).toBe('2026-10-01');
    expect(form.resetForm).not.toHaveBeenCalled();
    expect(games.getStudioChallenges).not.toHaveBeenCalled();
  });

  it('rejects submissions without an admin key', () => {
    studio['adminKey'] = ' ';
    studio['saveChallenge'](form);
    expect(games.createDailyChallenge).not.toHaveBeenCalled();
  });
});
