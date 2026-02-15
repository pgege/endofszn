import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common';

const logger = new Logger('Bootstrap');

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error(
    `Unhandled Rejection: ${reason?.message || reason}`,
    reason?.stack,
  );
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const isDev = process.env.NODE_ENV !== 'production';
  const corsOrigins = process.env.API_CORS_ORIGINS?.split(',');

  app.enableCors({
    origin: corsOrigins || (isDev ? true : ['http://localhost:4200']),
    credentials: true,
  });

  const port = process.env.API_PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
