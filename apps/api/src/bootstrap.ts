import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

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

/**
 * The OpenAPI description of this API, built from the controllers.
 *
 * addBearerAuth is what makes the Authorize button appear: the
 * controllers are annotated with ApiBearerAuth, and Swagger ignores that
 * annotation unless the document also declares the scheme it names.
 * Without it the page offers no way to send a token, so every protected
 * endpoint answers 401 when somebody tries it.
 */
export function openApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Vehicle Maintenance Tracking API')
    .setDescription('MTS, RFP-012')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}
