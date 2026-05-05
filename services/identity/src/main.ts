import 'reflect-metadata';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { BusinessExceptionFilter } from './core/filters/business-exception.filter';
import { HTTPStatusInterceptor } from './core/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('My App')
    .setDescription('My App API description')
    .setVersion('1.0')
    .addBearerAuth(undefined, 'JWT-auth')
    .build();

  const httpAdapter = app.get(HttpAdapterHost);
  const reflector = app.get(Reflector);

  // app.useGlobalGuards(new JwtAuthGuard(reflector), new RoleGuard(reflector));
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapter), new BusinessExceptionFilter(httpAdapter));
  app.useGlobalInterceptors(new HTTPStatusInterceptor(reflector));

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document,{
    swaggerOptions: {
      persistAuthorization: true,
    }
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
    console.log(`Swagger docs available at http://localhost:${process.env.PORT ?? 3000}/docs`);
  });
}

void bootstrap();
