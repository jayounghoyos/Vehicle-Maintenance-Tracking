import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { configure, openApiDocument } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  configure(app);
  app.enableCors({ origin: config.get<string>('WEB_ORIGIN', 'http://localhost:5173') });

  SwaggerModule.setup('docs', app, openApiDocument(app));

  const port = Number(config.get('PORT', 3000));
  await app.listen(port, '0.0.0.0');
  console.log(`api listening on http://localhost:${port}/api  ·  docs at /docs`);
}

void bootstrap();
