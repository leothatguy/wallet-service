import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { CustomLogger } from './common/logger/custom-logger.service';

async function bootstrap() {
  const customLogger = new CustomLogger();
  customLogger.setContext('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: customLogger,
  });

  // Global exception filter for error logging
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(), // Response standardization
    new LoggingInterceptor(), // Request/response logging (runs after transform)
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  // app.enableCors({
  //   origin: process.env.CORS_ORIGIN || '*',
  //   credentials: true,
  // });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Wallet Service API')
    .setDescription(
      'Backend wallet service with Paystack integration, JWT authentication, and API key management',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  customLogger.log(`🚀 Application is running on: http://localhost:${port}`);
  customLogger.log(
    `📚 Swagger documentation: http://localhost:${port}/api/docs`,
  );
  customLogger.log(`🔍 Detailed logging is enabled`);
  customLogger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
