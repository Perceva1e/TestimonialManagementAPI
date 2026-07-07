const request = require('supertest');
const app = require('../app');

let token;

beforeEach(async () => {
  const register = await request(app).post('/api/auth/register').send({
    email: 'analytics@test.com',
    password: 'Password123',
    businessName: 'Coffee',
  });

  token = register.body.data.token;
});

describe('Analytics', () => {
  test('empty analytics', async () => {
    const res = await request(app)
      .get('/api/testimonials/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    expect(res.body.data.overview.total).toBe(0);

    expect(res.body.data.overview.averageRating).toBe(0);
  });

  test('analytics after testimonials', async () => {
    await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
        rating: 5,
      });

    await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Jane',
        rating: 3,
      });

    const res = await request(app)
      .get('/api/testimonials/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    expect(res.body.data.overview.total).toBe(2);

    expect(res.body.data.overview.averageRating).toBe(4);
  });

  test('analytics with dates', async () => {
    const today = new Date().toISOString();

    const res = await request(app)
      .get(`/api/testimonials/analytics?startDate=${today}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  test('invalid dates', async () => {
    const res = await request(app)
      .get(
        '/api/testimonials/analytics?startDate=2025-10-01&endDate=2025-01-01',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });

  test('analytics returns ISO formatted dates', async () => {
    const res = await request(app)
      .get(
        '/api/testimonials/analytics?startDate=2025-01-01T00:00:00.000Z&endDate=2025-12-31T23:59:59.999Z',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    if (res.body.data.period.startDate) {
      expect(res.body.data.period.startDate).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    }
    if (res.body.data.period.endDate) {
      expect(res.body.data.period.endDate).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    }
  });

  test('analytics requires auth', async () => {
    const res = await request(app).get('/api/testimonials/analytics');

    expect(res.statusCode).toBe(401);
  });
});
