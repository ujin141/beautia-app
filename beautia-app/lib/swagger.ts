// Swagger/OpenAPI 설정

import swaggerJsdoc, { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BEAUTIA API',
      version: '1.0.0',
      description: 'BEAUTIA 플랫폼 API 문서',
      contact: {
        name: 'BEAUTIA Support',
        email: 'support@beautia.com',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.beautia.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'partner_token',
        },
      },
      schemas: {
        ApiSuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
            },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
            },
            code: {
              type: 'string',
            },
            details: {
              type: 'object',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Admin',
        description: '관리자 API',
      },
      {
        name: 'Partner',
        description: '파트너 API',
      },
      {
        name: 'Customer',
        description: '고객 API',
      },
      {
        name: 'Stripe',
        description: 'Stripe 결제 API',
      },
    ],
  },
  apis: [
    './app/api/**/*.ts', // API 라우트 파일 경로
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
