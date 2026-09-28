import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GameService } from './game.service';
import { MusicTrackService } from './music-track.service';
import { GameSessionStorage } from './game-session-storage.service';
import { environment } from '../../../environments/environment.development';

describe('Audio and catalog access', () => {
  const base = environment.apiUrl.replace(/\/+$/, '');
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    sessionStorage.clear();
    localStorage.clear();
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
    localStorage.clear();
    TestBed.resetTestingModule();
  });
  it('points playback to the API even if a legacy response contains a storage URL', () => {
    TestBed.inject(GameService).getDailyChallenge().subscribe(challenge => {
      expect(challenge.audioUrl).toBe(`${base}/games/daily/challenge-id/audio`);
    });
    TestBed.inject(HttpTestingController).expectOne(`${base}/games/daily`).flush({
      id: 'challenge-id', audioUrl: 'https://storage.invalid/movie_song.mp3',
    });
  });
  it('authenticates catalog requests with a header', () => {
    TestBed.inject(MusicTrackService).getAllTracks('test-key').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(`${base}/music/all`);
    expect(request.request.headers.get('x-admin-key')).toBe('test-key');
    request.flush([]);
  });
  it('migrates old session URLs without losing guesses', () => {
    sessionStorage.setItem('session', JSON.stringify({
      challenge: { mode: 'daily', id: 'old-id', audioUrl: 'https://storage.invalid/answer.mp3' },
      guesses: [{ correct: false }],
    }));
    const session = TestBed.inject(GameSessionStorage).load();
    expect(session?.challenge.audioUrl).toBe(`${base}/games/daily/old-id/audio`);
    expect(session?.guesses).toEqual([{ correct: false }]);
    expect(localStorage.getItem('session')).not.toContain('storage.invalid');
    expect(sessionStorage.getItem('session')).toBeNull();
  });
  it('restores the saved game from localStorage and clears it explicitly', () => {
    const storage = TestBed.inject(GameSessionStorage);
    localStorage.setItem('session', JSON.stringify({
      version: 1, challenge: { mode: 'daily', id: 'saved-id' }, guesses: [],
    }));
    const session = storage.load()!;
    storage.save(session);
    sessionStorage.clear();
    expect(storage.load()).toEqual(session);
    storage.clear();
    expect(storage.load()).toBeNull();
  });
  it('ignores malformed stored data', () => {
    localStorage.setItem('session', '{broken');
    expect(TestBed.inject(GameSessionStorage).load()).toBeNull();
  });
});
