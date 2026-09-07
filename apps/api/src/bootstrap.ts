import { ValidationPipe, type INestApplication } from '@nestjs/common';

/**
 * Everything that decides how a request is read, in one place.
 *
 * main.ts is not the only thing that builds this application: the
 * integration tests build it too, and a test that ran without the global
 * prefix or without the validation pipe would be answering questions
 * about an application nobody deploys. Serving concerns stay in main.ts,
 * since a test never opens a port: CORS, Swagger and the port itself.
 */
export function configure(app: INestApplication): void {
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // drop properties the DTO does not declare
      forbidNonWhitelisted: true, // and reject the request that sent them
      transform: true,
    }),
  );
}
