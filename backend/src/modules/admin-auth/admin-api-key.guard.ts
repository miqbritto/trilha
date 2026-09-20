import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_KEY');
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-admin-key'];

    // Missing configuration must never make administrative routes public.
    if (!expected?.trim() || typeof provided !== 'string' || !provided) {
      throw new UnauthorizedException('Acesso administrativo não autorizado.');
    }

    // Fixed-size digests allow a timing-safe comparison even for different lengths.
    const expectedHash = createHash('sha256').update(expected).digest();
    const providedHash = createHash('sha256').update(provided).digest();
    if (!timingSafeEqual(expectedHash, providedHash)) {
      throw new UnauthorizedException('Acesso administrativo não autorizado.');
    }

    return true;
  }
}
