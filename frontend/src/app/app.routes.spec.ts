import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from './app.routes';
import { GameService } from './core/services/game.service';
import { GameSessionStorage } from './core/services/game-session-storage.service';
import { MovieService } from './core/services/movie.service';
import { Game } from './features/game/game';
import { HowToPlayDialog } from './shared/components/shell/components/how-to-play-dialog/how-to-play-dialog';
import { Shell } from './shared/components/shell/shell';

describe('Game entry', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: MovieService, useValue: {} },
        { provide: GameSessionStorage, useValue: { load: () => null, save: vi.fn() } },
        {
          provide: GameService,
          useValue: {
            getDailyChallenge: () => of({
              id: 'daily-test',
              mode: 'daily',
              date: '2026-09-19',
              rules: { revealStages: [1, 2, 4, 6, 8] },
            }),
          },
        },
      ],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it.each(['/', '/game', '/onboarding'])('opens the game with instructions from %s', async url => {
    // jsdom does not implement the native modal dialog API.
    const open = vi.spyOn(HowToPlayDialog.prototype, 'open').mockImplementation(() => {});
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, Game);
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/game');
    expect(harness.routeNativeElement?.querySelector('.game-page')).toBeTruthy();
    expect(open).toHaveBeenCalledTimes(1);

    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(open).toHaveBeenCalledTimes(1);

    harness.routeNativeElement?.querySelector<HTMLButtonElement>('.how-to-play')?.click();
    expect(open).toHaveBeenCalledTimes(2);
  });

  it('keeps instructions closed by default on other screens using the shell', async () => {
    const open = vi.spyOn(HowToPlayDialog.prototype, 'open').mockImplementation(() => {});
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    expect(open).not.toHaveBeenCalled();
  });
});
