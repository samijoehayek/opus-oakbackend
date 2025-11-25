import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import timeout from 'connect-timeout';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Production: ['error', 'warn', 'log']
  });

  // Get ConfigService for environment variables
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8081);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Add the exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Add logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ============================================
  // SECURITY
  // ============================================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false, // Needed for some APIs
    }),
  );

  app.use(timeout('30s')); // 30 second timeout

  app.use(json({ limit: '10mb' })); // Limit request body size
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS - Configure based on environment
  const corsOrigins = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:3000',
  );
  app.enableCors({
    origin: corsOrigins.split(','), // ['http://localhost:3000', 'https://yourdomain.com']
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true, // Allow cookies
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'], // Custom headers client can read
    maxAge: 3600, // Preflight cache duration
  });

  // ============================================
  // PERFORMANCE
  // ============================================

  // Compression - Gzip responses
  app.use(compression());

  // Global prefix (all routes will be /api/*)
  app.setGlobalPrefix('api', {
    exclude: ['health', 'metrics'], // Exclude health checks from /api prefix
  });

  // API Versioning (optional but recommended)
  app.enableVersioning({
    type: VersioningType.URI, // /api/v1/users, /api/v2/users
    defaultVersion: '1',
  });

  // ============================================
  // VALIDATION & TRANSFORMATION
  // ============================================

  app.useGlobalPipes(
    new ValidationPipe({
      // Validation options
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties exist
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert types (string -> number)
      },

      // Error handling
      disableErrorMessages: nodeEnv === 'production', // Hide validation details in prod

      // Performance
      skipMissingProperties: false, // Validate even if property is missing
      skipNullProperties: false,
      skipUndefinedProperties: false,
    }),
  );

  // ============================================
  // SWAGGER DOCUMENTATION
  // ============================================

  if (nodeEnv !== 'production') {
    // Only enable Swagger in dev/staging
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Furniture E-commerce API')
      .setDescription(
        'Complete API documentation for custom furniture e-commerce platform with 3D configurator',
      )
      .setVersion('1.0')
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management')
      .addTag('Products', 'Furniture product catalog')
      .addTag('Cart', 'Shopping cart operations')
      .addTag('Orders', 'Order management and tracking')
      .addTag('Payments', 'Payment processing')
      .addTag('Addresses', 'User address management')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth', // This name will be used in @ApiBearerAuth()
      )
      .addServer('http://localhost:8081', 'Local Development')
      .addServer('https://staging.yourapi.com', 'Staging')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Keep auth token after refresh
        tagsSorter: 'alpha', // Sort tags alphabetically
        operationsSorter: 'alpha', // Sort endpoints alphabetically
        docExpansion: 'none', // Collapse all by default
        filter: true, // Enable search
        showRequestDuration: true, // Show response time
      },
      customSiteTitle: 'Furniture API Docs',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customCss: '.swagger-ui .topbar { display: none }', // Hide Swagger topbar
    });

    logger.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
  }

  // ============================================
  // HEALTH CHECK & MONITORING
  // ============================================

  // Simple health check endpoint (can be expanded with @nestjs/terminus)
  // This is outside /api prefix (see exclude above)
  // You'll need to create this route in a health module
  logger.log('💓 Health check available at: /health');

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================

  app.enableShutdownHooks();

  // Handle shutdown signals
  process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.warn('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  // ============================================
  // START SERVER
  // ============================================

  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📡 API Base URL: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
