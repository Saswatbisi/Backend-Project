const request = require('supertest');
const app = require('../server'); // Import the Express app

// ═══════════════════════════════════════════
// 🧪 INTEGRATION TEST SUITE
// Platform Core API - Endpoint Reliability Tests
// ═══════════════════════════════════════════

// ───────────────────────────────────────────
// 📌 SECTION 1: Health Check
// ───────────────────────────────────────────
describe('GET / (Health Check)', () => {
  it('should return 200 and confirm server is running', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Server Running');
  });
});

// ───────────────────────────────────────────
// 📌 SECTION 2: Swagger Documentation
// ───────────────────────────────────────────
describe('GET /api-docs (Swagger Documentation)', () => {
  it('should return 200 and serve the Swagger UI page', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.statusCode).toEqual(200);
    // Swagger UI serves an HTML page
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

// ───────────────────────────────────────────
// 📌 SECTION 3: User Registration
// ───────────────────────────────────────────
describe('POST /api/register', () => {
  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'test@test.com' }); // Missing username and password

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBeDefined();
  });
});

// ───────────────────────────────────────────
// 📌 SECTION 4: User Login
// ───────────────────────────────────────────
describe('POST /api/login', () => {
  it('should return 400 if email and password are missing', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({}); // Empty body

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nonexistent@test.com', password: 'wrongpass' });

    expect(res.statusCode).toEqual(400);
  });
});

// ───────────────────────────────────────────
// 📌 SECTION 5: Protected Routes (Dashboard)
// ───────────────────────────────────────────
describe('GET /api/dashboard (Protected)', () => {
  it('should return 401 if no auth token is provided', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.statusCode).toEqual(401);
    expect(res.body.msg).toContain('No token');
  });

  it('should return 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('x-auth-token', 'invalid_token_value_12345');

    expect(res.statusCode).toEqual(401);
    expect(res.body.msg).toContain('Token is not valid');
  });
});

// ───────────────────────────────────────────
// 📌 SECTION 6: Posts Endpoints
// ───────────────────────────────────────────
describe('GET /api/posts (Public)', () => {
  it('should return 200 and a paginated posts response', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('totalPosts');
    expect(res.body).toHaveProperty('posts');
    expect(Array.isArray(res.body.posts)).toBe(true);
  });

  it('should respect pagination query parameters', async () => {
    const res = await request(app).get('/api/posts?page=1&limit=5');
    expect(res.statusCode).toEqual(200);
    expect(res.body.page).toEqual(1);
    expect(res.body.limit).toEqual(5);
  });
});

describe('POST /api/posts (Protected)', () => {
  it('should return 401 if no auth token is provided', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Test Post', content: 'Test Content' });

    expect(res.statusCode).toEqual(401);
  });
});

// ───────────────────────────────────────────
// 📌 SECTION 7: Users Endpoint
// ───────────────────────────────────────────
describe('GET /api/users', () => {
  it('should return 200 and a paginated users response', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('totalUsers');
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});

// ───────────────────────────────────────────
// 📌 SECTION 8: Rate Limiting (Login)
// ───────────────────────────────────────────
describe('Rate Limiting on /api/login', () => {
  it('should return 429 after exceeding login rate limit (5 attempts)', async () => {
    // Exhaust the rate limit by sending 5 rapid requests
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/login')
        .send({ email: 'ratelimit@test.com', password: 'wrongpass' });
    }

    // The 6th request should be rate-limited
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'ratelimit@test.com', password: 'wrongpass' });

    expect(res.statusCode).toEqual(429);
  });
});
