import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StudioAccess } from '../services/studio-access.service';

export const studioAccessGuard: CanActivateFn = () =>
  inject(StudioAccess).authenticated() || inject(Router).createUrlTree(['/studio/login']);
