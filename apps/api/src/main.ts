import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const isDev = process.env.NODE_ENV !== 'production';
  const corsOrigins = process.env.API_CORS_ORIGINS?.split(',');

  app.enableCors({
    origin: corsOrigins || (isDev ? true : ['http://localhost:4200']),
    credentials: true,
  });

  const port = process.env.API_PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
