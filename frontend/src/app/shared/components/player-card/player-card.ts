import { Component, computed, effect, ElementRef, input, OnDestroy, signal, viewChild } from '@angular/core';

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
      await audio.play()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.isPressed.set(false)
      this.playbackError.set('Não foi possível reproduzir a trilha.');
    }

  }

  onPlaying() {
    this.isPressed.set(true);
    this.scheduleLimit();
  }

  onPause() {
    clearTimeout(this.playbackTimeout);
    this.isPressed.set(false);
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
  }
}
