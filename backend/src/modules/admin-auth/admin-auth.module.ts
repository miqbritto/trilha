import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { AdminAuthController } from './admin-auth.controller';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [ConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 5,
        blockDuration: 120_000
      }
    ])
  ],
  providers: [AdminApiKeyGuard],
  controllers: [AdminAuthController],
  exports: [AdminApiKeyGuard],
})
export class AdminAuthModule {}
