import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerCard } from './player-card';

describe('PlayerCard playback limits', () => {
  let fixture: ComponentFixture<PlayerCard>;
  let player: PlayerCard;
  let audio: HTMLAudioElement;
  let paused: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    paused = true;
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
      paused = true;
      this.dispatchEvent(new Event('pause'));
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(async function (this: HTMLMediaElement) {
      paused = false;
      this.dispatchEvent(new Event('playing'));
    });

    TestBed.configureTestingModule({ imports: [PlayerCard] });
    fixture = TestBed.createComponent(PlayerCard);
    player = fixture.componentInstance;
    fixture.componentRef.setInput('guessSlots', [1, 2, 3, 4, 5]);
    fixture.componentRef.setInput('audioUrl', '/audio/teste.wav');
    fixture.componentRef.setInput('revealStages', [1, 2, 4, 6, 8]);
    fixture.componentRef.setInput('maxSeconds', 1);
    fixture.detectChanges();
    audio = fixture.nativeElement.querySelector('audio');
    Object.defineProperty(audio, 'paused', { get: () => paused });
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('stops at the limit and starts the next play from the beginning', async () => {
    await player.play();
    audio.currentTime = 1;
    vi.advanceTimersByTime(1000);
    expect(paused).toBe(true);
    expect(player.isPressed()).toBe(false);

    await player.pressButton();
    expect(audio.currentTime).toBe(0);
    expect(paused).toBe(false);
  });

  it('does not consume the allowance while buffering', async () => {
    await player.play();
    audio.currentTime = .25;
    audio.dispatchEvent(new Event('waiting'));
    vi.advanceTimersByTime(5000);
    expect(audio.currentTime).toBe(.25);
    expect(paused).toBe(false);

    audio.dispatchEvent(new Event('playing'));
    audio.currentTime = 1;
    vi.advanceTimersByTime(750);
    expect(paused).toBe(true);
  });

  it('resumes from the paused position and replay returns to zero', async () => {
    await player.play();
    audio.currentTime = .4;
    await player.pressButton();
    vi.advanceTimersByTime(2000);
    expect(audio.currentTime).toBe(.4);
    await player.pressButton();
    expect(audio.currentTime).toBe(.4);
    await player.replay();
    expect(audio.currentTime).toBe(0);
  });

  it('resets playback when another attempt unlocks more seconds', async () => {
    await player.play();
    audio.currentTime = .5;
    fixture.componentRef.setInput('maxSeconds', 2);
    fixture.detectChanges();
    expect(paused).toBe(true);
    expect(audio.currentTime).toBe(0);

    await player.play();
    audio.currentTime = 1;
    audio.dispatchEvent(new Event('timeupdate'));
    expect(paused).toBe(false);
    audio.currentTime = 2;
    audio.dispatchEvent(new Event('timeupdate'));
    expect(paused).toBe(true);
  });

  it('clamps seeks past the unlocked limit', () => {
    audio.currentTime = 5;
    audio.dispatchEvent(new Event('seeking'));
    expect(audio.currentTime).toBe(1);
    expect(paused).toBe(true);
  });

  it('allows the full audio when no limit is set', async () => {
    fixture.componentRef.setInput('maxSeconds', null);
    fixture.detectChanges();
    await player.play();
    audio.currentTime = 20;
    audio.dispatchEvent(new Event('timeupdate'));
    vi.advanceTimersByTime(20000);
    expect(paused).toBe(false);
  });

  it('disables playback until the challenge supplies a limit', async () => {
    fixture.componentRef.setInput('maxSeconds', 0);
    fixture.detectChanges();
    await player.play();
    expect(paused).toBe(true);
    expect(fixture.nativeElement.querySelector('.play-button').disabled).toBe(true);
  });
});
