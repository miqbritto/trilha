import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const corsOrigins = (
    config.get<string>('CORS_ORIGINS') ??
    (config.get<string>('NODE_ENV') === 'production' ? '' : 'http://localhost:4200')
  )
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }))
  app.enableCors({
    origin: corsOrigins,
  })
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
