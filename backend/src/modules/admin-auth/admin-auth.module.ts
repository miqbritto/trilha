import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminApiKeyGuard } from './admin-api-key.guard';

@Module({
  imports: [ConfigModule],
  providers: [AdminApiKeyGuard],
  exports: [AdminApiKeyGuard],
})
export class AdminAuthModule {}
