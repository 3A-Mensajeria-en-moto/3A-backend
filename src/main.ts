import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  // La autenticación es por header Bearer (no cookies), así que abrir CORS no expone sesiones.
  // En producción conviene limitarlo: CORS_ORIGIN=https://mi-app.com
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.enableShutdownHooks();

  const puerto = Number(process.env.PORT ?? 8080);
  await app.listen(puerto);
  new Logger('Bootstrap').log(`API escuchando en http://localhost:${puerto}/api/v1`);
}
bootstrap();
