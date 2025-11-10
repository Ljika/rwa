import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Globalna validacija za sve DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Uklanja properties koji nisu u DTO
      forbidNonWhitelisted: true, // Baca error ako se pošalju extra polja
      transform: true, // Automatski transformiše tipove (string → number)
    }),
  );

  // Swagger konfiguracija
  const config = new DocumentBuilder()
    .setTitle('MediSync API')
    .setDescription('API dokumentacija za MediSync aplikaciju')
    .setVersion('1.0')
    .addBearerAuth() // Dodaje dugme za JWT token
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Dostupno na http://localhost:3000/api

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger docs on http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
