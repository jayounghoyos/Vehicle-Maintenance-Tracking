import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.get<string>('WEB_ORIGIN', 'http://localhost:5173') });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // drop properties the DTO does not declare
      forbidNonWhitelisted: true, // and reject the request that sent them
      transform: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('Vehicle Maintenance Tracking API')
    .setDescription('MTS — RFP-012')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(config.get('PORT', 3000));
  await app.listen(port, '0.0.0.0');
  console.log(`api listening on http://localhost:${port}/api  ·  docs at /docs`);
}

void bootstrap();
