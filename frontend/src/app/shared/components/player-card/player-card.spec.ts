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

  it('shows a continuous full-track timeline and seeks beyond the challenge stages', async () => {
    fixture.componentRef.setInput('variant', 'full');
    fixture.componentRef.setInput('maxSeconds', null);
    fixture.detectChanges();
    Object.defineProperty(audio, 'duration', { value: 125, configurable: true });
    audio.dispatchEvent(new Event('loadedmetadata'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.revealed-seconds')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.wave').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.timeline-times').textContent).toContain('2:05');
    const slider = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    slider.value = '60';
    slider.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(audio.currentTime).toBe(60);
    expect(player.currentTimeLabel()).toBe('1:00');
    await player.play();
    expect(audio.currentTime).toBe(60);
    expect(paused).toBe(false);
    await player.replay();
    expect(player.currentTime()).toBe(0);
  });

  it('disables seeking until metadata arrives and resets on a new audio source', () => {
    fixture.componentRef.setInput('variant', 'full');
    fixture.componentRef.setInput('maxSeconds', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="range"]').disabled).toBe(true);
    Object.defineProperty(audio, 'duration', { value: 100, configurable: true });
    audio.dispatchEvent(new Event('loadedmetadata'));
    audio.currentTime = 40;
    audio.dispatchEvent(new Event('timeupdate'));
    fixture.detectChanges();
    expect(player.currentTime()).toBe(40);
    fixture.componentRef.setInput('audioUrl', '/audio/another.wav');
    fixture.detectChanges();
    expect(player.duration()).toBe(0);
    expect(player.currentTime()).toBe(0);
    expect(fixture.nativeElement.querySelector('input[type="range"]').disabled).toBe(true);
  });

  describe('audio visualization', () => {
    let spectrum: Uint8Array;
    let context: {
      sampleRate: number;
      destination: object;
      createAnalyser: ReturnType<typeof vi.fn>;
      createMediaElementSource: ReturnType<typeof vi.fn>;
      resume: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };
    let reducedMotion: boolean;

    beforeEach(() => {
      spectrum = new Uint8Array(2048);
      reducedMotion = false;
      context = {
        sampleRate: 48000,
        destination: {},
        createAnalyser: vi.fn(() => ({
          frequencyBinCount: 2048,
          getByteFrequencyData: (data: Uint8Array) => data.set(spectrum),
          connect: vi.fn(),
          disconnect: vi.fn(),
        })),
        createMediaElementSource: vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() })),
        resume: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.stubGlobal('AudioContext', class { constructor() { return context; } });
      vi.stubGlobal('matchMedia', () => ({ get matches() { return reducedMotion; } }));
    });

    afterEach(() => vi.unstubAllGlobals());

    const levels = () => Array.from(
      fixture.nativeElement.querySelectorAll('.wave-bar') as NodeListOf<HTMLElement>,
      bar => Number(bar.style.getPropertyValue('--level') || '0.12'),
    );

    it('responds to real frequency data and returns to baseline in silence', async () => {
      fixture.componentRef.setInput('maxSeconds', null);
      fixture.detectChanges();
      spectrum.fill(255, 0, 32);
      await player.play();
      expect(levels()[0]).toBe(1);
      expect(levels().at(-1)).toBe(0.12);

      spectrum.fill(0);
      vi.advanceTimersByTime(32);
      expect(levels().every(level => level === 0.12)).toBe(true);

      spectrum.fill(255, 500);
      vi.advanceTimersByTime(32);
      expect(levels()[0]).toBe(0.12);
      expect(levels().at(-1)).toBe(1);
      expect(audio.crossOrigin).toBe('anonymous');
    });

    it('animates only unlocked slots as the listening allowance changes', async () => {
      spectrum.fill(255);
      for (const [limit, unlockedCount] of [[1, 1], [4, 3], [1, 1], [null, 5]] as const) {
        fixture.componentRef.setInput('maxSeconds', limit);
        fixture.detectChanges();
        await player.play();
        fixture.detectChanges();
        vi.advanceTimersByTime(32);

        const activeBars = unlockedCount * player.waveBars.length;
        expect(levels().slice(0, activeBars).every(level => level === 1)).toBe(true);
        expect(levels().slice(activeBars).every(level => level === 0.12)).toBe(true);
        expect(fixture.nativeElement.querySelectorAll('.wave.is-unlocked').length).toBe(unlockedCount);
        expect(fixture.nativeElement.querySelectorAll('.second-bar.is-active').length).toBe(unlockedCount);
      }
    });

    it('stops during buffering and at the playback limit, and reuses the audio graph', async () => {
      spectrum.fill(255);
      await player.play();
      audio.dispatchEvent(new Event('waiting'));
      vi.advanceTimersByTime(32);
      expect(levels().every(level => level === 0.12)).toBe(true);

      audio.dispatchEvent(new Event('playing'));
      expect(levels()[0]).toBe(1);
      audio.currentTime = 1;
      audio.dispatchEvent(new Event('timeupdate'));
      vi.advanceTimersByTime(32);
      expect(levels().every(level => level === 0.12)).toBe(true);

      await player.replay();
      expect(levels()[0]).toBe(1);
      expect(context.createMediaElementSource).toHaveBeenCalledTimes(1);
    });

    it('honors reduced motion while still playing the audio', async () => {
      reducedMotion = true;
      spectrum.fill(255);
      await player.play();
      vi.advanceTimersByTime(32);
      expect(paused).toBe(false);
      expect(levels().every(level => level === 0.12)).toBe(true);
    });

    it('releases the audio graph and animation when destroyed', async () => {
      const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
      await player.play();
      const analyser = context.createAnalyser.mock.results[0].value;
      const readSpectrum = vi.spyOn(analyser, 'getByteFrequencyData');
      fixture.destroy();
      expect(paused).toBe(true);
      expect(context.close).toHaveBeenCalledTimes(1);
      expect(analyser.disconnect).toHaveBeenCalledTimes(1);
      expect(cancelFrame).toHaveBeenCalled();
      vi.advanceTimersByTime(2000);
      expect(readSpectrum).not.toHaveBeenCalled();
    });
  });
});
