import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { StudioAccess } from '../../core/services/studio-access.service';
import { Shell } from '../../shared/components/shell/shell';

@Component({
  selector: 'app-studio-login',
  imports: [Shell, FormsModule, RouterLink],
  template: `
    <app-shell>
      <div class="studio-page">
        <section class="editor" aria-labelledby="access-heading">
          <div class="section-heading">
            <p class="eyebrow">Acesso administrativo</p>
            <h1 id="access-heading">Estúdio<span>.</span></h1>
            <p>Informe a chave de administrador para entrar.</p>
          </div>
          <form (ngSubmit)="login()" [attr.aria-busy]="loading()">
            <label for="admin-key">Chave de administrador
              <input id="admin-key" name="adminKey" type="password" [(ngModel)]="key"
                required autocomplete="off" spellcheck="false" [disabled]="loading()"
                aria-describedby="access-error" />
            </label>
            <p id="access-error" class="error" role="alert">{{ error() }}</p>
            <footer class="form-actions">
              <a routerLink="/game">Voltar ao jogo</a>
              <button class="button primary" type="submit" [disabled]="!key.trim() || loading()">
                {{ loading() ? 'Validando...' : 'Entrar no estúdio' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </app-shell>
  `,
  styleUrl: './studio.scss',
})
export class StudioLogin {
  private readonly access = inject(StudioAccess);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected key = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected login(): void {
    if (!this.key.trim() || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.access.login(this.key).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => {
        this.key = '';
        void this.router.navigateByUrl('/studio', { replaceUrl: true });
      },
      error: (error) => this.error.set(error.status === 401 || error.status === 403
        ? 'Chave de administrador inválida. Tente novamente.'
        : error.status === 429
          ? 'Muitas tentativas. Aguarde um pouco e tente novamente.'
          : 'Não foi possível validar a chave. Tente novamente.'),
    });
  }
}
