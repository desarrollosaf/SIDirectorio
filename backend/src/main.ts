import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// 👇 Esto va FUERA de bootstrap, antes de todo
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👇 Esto va DENTRO de bootstrap, donde app sí existe
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Backend NestJS corriendo en http://localhost:${port}`);
}

bootstrap();