import { Component, ElementRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-how-to-play-dialog',
  templateUrl: './how-to-play-dialog.html',
  styleUrl: './how-to-play-dialog.scss',
})
export class HowToPlayDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    const dialog = this.dialog().nativeElement;
    if (event.target !== dialog) return;

    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    ) {
      this.close();
    }
  }
}
