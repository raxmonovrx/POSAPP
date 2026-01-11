import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const isProd = process.env.NODE_ENV === 'production';
  const swaggerFlag = config.get<string>('SWAGGER_ENABLED') === 'true';
  let swaggerEnabled = !isProd || swaggerFlag;

  if (swaggerEnabled) {
    if (isProd) {
      const user = config.get<string>('SWAGGER_USER');
      const pass = config.get<string>('SWAGGER_PASS');
      if (!user || !pass) {
        console.warn(
          'Swagger enabled in production but SWAGGER_USER/PASS missing. Swagger disabled.',
        );
        swaggerEnabled = false;
      } else {
        app.use(
          ['/docs', '/docs-json'],
          basicAuth({
            challenge: true,
            users: { [user]: pass },
          }),
        );
      }
    }

    if (swaggerEnabled) {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('POSAPP API')
        .setDescription(
          'POSAPP multi-token API. tokenType separation: tenantUser (tenant panel), platformAdmin (platform ops), device (POS sync with tokenVersion).',
        )
        .setVersion('1.0')
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'tenantAuth',
        )
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'platformAuth',
        )
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'deviceAuth',
        )
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup('docs', app, document);
    }
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
