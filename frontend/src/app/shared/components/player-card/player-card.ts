import { Component, computed, effect, ElementRef, input, OnDestroy, signal, viewChild, viewChildren } from '@angular/core';

@Component({
  selector: 'app-player-card',
  styleUrl: './player-card.scss',
  templateUrl: './player-card.html',
})
export class PlayerCard implements OnDestroy {
  readonly guessSlots = input.required<number[]>();
  readonly audioUrl = input.required<string>()
  readonly maxSeconds = input<number | null>(null);
  readonly revealStages = input<number[]>([]);
  readonly stages = computed(() => this.revealStages().length ? this.revealStages() : this.guessSlots());
  readonly unlockedStages = computed(() => {
    const limit = this.maxSeconds();
    return this.stages().map(second => limit === null || second <= limit);
  });
  readonly duration = signal(0);
  readonly durationLabel = computed(() => {
    const seconds = Math.floor(this.duration());
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });
  readonly waveBars = Array.from({ length: 18 }, (_, index) => index);
  readonly isPressed = signal(false);
  private playbackTimeout?: ReturnType<typeof setTimeout>;
  readonly playbackError = signal('');

  private readonly audioRef = viewChild<ElementRef<HTMLAudioElement>>('audio')
  private readonly barRefs = viewChildren<ElementRef<HTMLDivElement>>('waveBar');
  private audioContext?: AudioContext;
  private audioSource?: MediaElementAudioSourceNode;
  private analyser?: AnalyserNode;
  private frequencyData?: Uint8Array<ArrayBuffer>;
  private animationFrame?: number;

  constructor() {
    effect(() => {
      this.audioUrl();
      this.maxSeconds();
      const audio = this.audioRef()?.nativeElement;
      this.onPause();
      if (audio && typeof audio.pause === 'function') {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  async pressButton() {
    const audio = this.audioRef()?.nativeElement;
    if(!audio) return;
    if (audio.paused) {
      await this.play()
    } else {
      audio.pause()
    }
  }

  async play() {
    const audio = this.audioRef()?.nativeElement;
    if(!audio || this.maxSeconds() === 0) return;

    const limit = this.maxSeconds();
    if (audio.ended || (limit !== null && audio.currentTime >= limit)) {
      audio.currentTime = 0;
    }

    this.playbackError.set("")
    try {
      this.prepareAnalyser(audio);
      // Both calls start within the user's gesture, including on mobile browsers.
      await Promise.all([this.audioContext?.resume(), audio.play()]);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      audio.pause();
      this.onPause();
      this.playbackError.set('Não foi possível reproduzir a trilha.');
    }

  }

  onPlaying() {
    this.isPressed.set(true);
    this.scheduleLimit();
    this.startVisualization();
  }

  onPause() {
    clearTimeout(this.playbackTimeout);
    this.isPressed.set(false);
    this.stopVisualization();
  }

  private prepareAnalyser(audio: HTMLAudioElement) {
    if (this.audioContext || typeof AudioContext === 'undefined') return;

    const context = new AudioContext();
    this.audioContext = context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.75;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -20;

    // Reuse this graph on replay: a media element can only have one source node.
    this.audioSource = context.createMediaElementSource(audio);
    this.audioSource.connect(analyser);
    analyser.connect(context.destination);
    this.analyser = analyser;
    this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
  }

  private startVisualization() {
    this.stopVisualization();
    const analyser = this.analyser;
    const data = this.frequencyData;
    const context = this.audioContext;
    if (!analyser || !data || !context || !this.isPressed()) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const unlocked = this.unlockedStages();
    const bars = this.barRefs()
      .filter((_, index) => unlocked[Math.floor(index / this.waveBars.length)])
      .map(ref => ref.nativeElement);
    const binWidth = context.sampleRate / analyser.fftSize;
    const minFrequency = 60;
    const maxFrequency = Math.min(14000, context.sampleRate / 2);
    // Spread bass, mids and treble across the unlocked slots on a logarithmic scale.
    const bands = bars.map((_, index) => {
      const start = Math.floor(minFrequency * (maxFrequency / minFrequency) ** (index / bars.length) / binWidth);
      const end = Math.ceil(minFrequency * (maxFrequency / minFrequency) ** ((index + 1) / bars.length) / binWidth);
      return { start, end: Math.min(data.length, Math.max(start + 1, end)) };
    });

    const draw = () => {
      if (!this.isPressed() || reducedMotion.matches) return;
      analyser.getByteFrequencyData(data);
      bars.forEach((bar, index) => {
        const { start, end } = bands[index];
        let energy = 0;
        for (let bin = start; bin < end; bin++) energy += data[bin];
        const level = energy / (end - start) / 255;
        // Silence stays low; only energy from the actual audio raises a bar.
        bar.style.setProperty('--level', String(0.12 + 0.88 * level ** 1.5));
      });
      this.animationFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  private stopVisualization() {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.barRefs().forEach(ref => ref.nativeElement.style.removeProperty('--level'));
  }

  onMetadata() {
    const duration = this.audioRef()?.nativeElement.duration;
    this.duration.set(duration && Number.isFinite(duration) ? duration : 0);
  }

  onTimeUpdate() {
    const audio = this.audioRef()?.nativeElement;
    const limit = this.maxSeconds();
    if (audio && limit !== null && audio.currentTime >= limit) {
      audio.pause();
      if (audio.currentTime !== limit) audio.currentTime = limit;
      this.onPause();
    }
  }

  scheduleLimit() {
    clearTimeout(this.playbackTimeout);
    const audio = this.audioRef()?.nativeElement;
    const limit = this.maxSeconds();
    if (!audio || audio.paused || limit === null) return;

    this.onTimeUpdate();
    if (audio.paused || audio.playbackRate <= 0) return;

    // Recheck media time: buffering must not consume the listening allowance.
    const remaining = (limit - audio.currentTime) / audio.playbackRate;
    this.playbackTimeout = setTimeout(() => this.scheduleLimit(), Math.max(10, remaining * 1000));
  }

  async replay() {
    const audio = this.audioRef()?.nativeElement;
    if(!audio) return;

    audio.currentTime = 0;
    await this.play()

  }

  ngOnDestroy() {
    this.onPause();
    const audio = this.audioRef()?.nativeElement;
    if (audio && typeof audio.pause === 'function') audio.pause();
    this.audioSource?.disconnect();
    this.analyser?.disconnect();
    void this.audioContext?.close().catch(() => {});
  }
}
