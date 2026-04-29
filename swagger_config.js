const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Platform Core API',
      version: '1.0.0',
      description: 'API Documentation for Activity-Based Networking Platform. This is the live contract for cross-team integration (AI/ML and Data Analyst teams).',
      contact: {
        name: 'Backend Team',
      },
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
      securitySchemes: {
        TokenAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-auth-token',
          description: 'JWT token obtained from /api/login',
        },
      },
      schemas: {
        // ═══════════════════════════════════════
        // INPUT SCHEMAS (What the client sends)
        // ═══════════════════════════════════════
        RegisterInput: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string', example: 'john_doe', description: 'Unique username' },
            email: { type: 'string', format: 'email', example: 'john@example.com', description: 'User email address' },
            password: { type: 'string', format: 'password', example: 'securePass123', description: 'Minimum 6 characters' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'securePass123' },
          },
        },
        PostInput: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', example: 'My First Post', description: 'Title of the post' },
            content: { type: 'string', example: 'This is the body content of the post.', description: 'Full content body' },
          },
        },

        // ═══════════════════════════════════════
        // OUTPUT SCHEMAS (What the API returns)
        // ═══════════════════════════════════════
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' },
            title: { type: 'string', example: 'My First Post' },
            content: { type: 'string', example: 'This is the body content.' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
              },
            },
            date: { type: 'string', format: 'date-time' },
            summary: { type: 'string', description: 'Auto-generated summary (first 50 chars)' },
          },
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'User Registered Successfully' },
            data: { $ref: '#/components/schemas/User' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login Successful' },
            token: { type: 'string', description: 'JWT Bearer Token' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        PaginatedPosts: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
            totalPosts: { type: 'integer', example: 50 },
            posts: {
              type: 'array',
              items: { $ref: '#/components/schemas/Post' },
            },
          },
        },
        PaginatedUsers: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            totalUsers: { type: 'integer' },
            users: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message describing what went wrong' },
          },
        },
        RateLimitError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Too many requests from this IP, please try again after 15 minutes.' },
          },
        },
      },
    },
  },
  apis: ['./server.js'], // Path to the API docs (JSDoc comments)
};

module.exports = swaggerJsdoc(options);
