const request = require('supertest');
const app = require('../app');

let token;
let testimonialId;

const user = {
  email: 'owner@test.com',
  password: 'Password123',
  businessName: 'Coffee Shop',
};

beforeEach(async () => {
  const register = await request(app).post('/api/auth/register').send(user);

  token = register.body.data.token;
});

describe('Testimonials', () => {
  test('create testimonial', async () => {
    const res = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John Doe',
        customerEmail: 'john@test.com',
        rating: 5,
        text: 'Amazing service',
        consentGiven: true,
      });

    expect(res.statusCode).toBe(201);

    expect(res.body.status).toBe('success');

    expect(res.body.data.customerName).toBe('John Doe');

    testimonialId = res.body.data.testimonialId;
  });

  test('unauthorized create', async () => {
    const res = await request(app).post('/api/testimonials').send({
      customerName: 'John',
    });

    expect(res.statusCode).toBe(401);
  });

  test('validation error', async () => {
    const res = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'A',
      });

    expect(res.statusCode).toBe(400);
  });

  test('create testimonial ignores status field', async () => {
    const res = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John Doe',
        status: 'completed',
      });

    expect(res.statusCode).toBe(400);
  });

  test('get testimonials list', async () => {
    await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
        rating: 5,
      });

    const res = await request(app)
      .get('/api/testimonials')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    expect(Array.isArray(res.body.data)).toBe(true);

    expect(res.body.pagination).toBeDefined();
  });

  test('get testimonial by id', async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
        rating: 4,
      });

    const id = created.body.data.testimonialId;

    const res = await request(app)
      .get(`/api/testimonials/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    expect(res.body.data.testimonialId).toBe(id);
  });

  test('update testimonial', async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
        rating: 4,
      });

    const id = created.body.data.testimonialId;

    const res = await request(app)
      .put(`/api/testimonials/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
        text: 'Excellent',
      });

    expect(res.statusCode).toBe(200);

    expect(res.body.data.rating).toBe(5);

    expect(res.body.data.text).toBe('Excellent');
  });

  test('delete testimonial', async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
      });

    const id = created.body.data.testimonialId;

    const res = await request(app)
      .delete(`/api/testimonials/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    const deleted = await request(app)
      .get(`/api/testimonials/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.statusCode).toBe(404);
  });

  test('status transition draft -> recording', async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
      });

    const id = created.body.data.testimonialId;

    const res = await request(app)
      .patch(`/api/testimonials/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'recording',
      });

    expect(res.statusCode).toBe(200);

    expect(res.body.data.status).toBe('recording');
  });

  test('invalid status transition', async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
      });

    const id = created.body.data.testimonialId;

    const res = await request(app)
      .patch(`/api/testimonials/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'completed',
      });

    expect(res.statusCode).toBe(400);
  });

  test('share completed testimonial', async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
      });

    const id = created.body.data.testimonialId;

    await request(app)
      .patch(`/api/testimonials/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'recording' });

    await request(app)
      .patch(`/api/testimonials/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing' });

    await request(app)
      .patch(`/api/testimonials/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });

    const res = await request(app)
      .post(`/api/testimonials/${id}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        channels: ['email', 'facebook'],
      });

    expect(res.statusCode).toBe(200);

    expect(res.body.data.status).toBe('shared');

    expect(res.body.data.sharedChannels.length).toBe(2);
  });

  test('share draft should fail', async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
      });

    const id = created.body.data.testimonialId;

    const res = await request(app)
      .post(`/api/testimonials/${id}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        channels: ['email'],
      });

    expect(res.statusCode).toBe(400);
  });

  test('re-sharing shared testimonial is allowed', async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'John',
      });

    const id = created.body.data.testimonialId;

    await request(app)
      .patch(`/api/testimonials/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'recording' });

    await request(app)
      .patch(`/api/testimonials/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing' });

    await request(app)
      .patch(`/api/testimonials/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });

    const firstShare = await request(app)
      .post(`/api/testimonials/${id}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        channels: ['email'],
      });

    expect(firstShare.statusCode).toBe(200);
    expect(firstShare.body.data.status).toBe('shared');
    expect(firstShare.body.data.sharedChannels).toContain('email');

    const reshare = await request(app)
      .post(`/api/testimonials/${id}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        channels: ['sms'],
      });

    expect(reshare.statusCode).toBe(200);
    expect(reshare.body.data.status).toBe('shared');
    expect(reshare.body.data.sharedChannels).toContain('sms');
  });

  test('pagination works', async () => {
    for (let i = 0; i < 15; i++) {
      await request(app)
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerName: `Customer ${i}`,
        });
    }

    const res = await request(app)
      .get('/api/testimonials?page=2&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    expect(res.body.data.length).toBe(5);

    expect(res.body.pagination.page).toBe(2);
  });

  test("cannot access another user's testimonial", async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Owner Testimonial',
      });

    const testimonialId = created.body.data.testimonialId;

    const intruder = await request(app).post('/api/auth/register').send({
      email: 'intruder@test.com',
      password: 'Password123',
      businessName: 'Intruder Shop',
    });

    const intruderToken = intruder.body.data.token;

    const res = await request(app)
      .get(`/api/testimonials/${testimonialId}`)
      .set('Authorization', `Bearer ${intruderToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.status).toBe('failure');
    expect(res.body.message).toBe(
      'Forbidden. You do not own this testimonial.',
    );
  });

  test("cannot update another user's testimonial", async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Owner Testimonial',
      });

    const testimonialId = created.body.data.testimonialId;

    const intruder = await request(app).post('/api/auth/register').send({
      email: 'intruder2@test.com',
      password: 'Password123',
      businessName: 'Intruder Shop 2',
    });

    const intruderToken = intruder.body.data.token;

    const res = await request(app)
      .put(`/api/testimonials/${testimonialId}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({
        rating: 1,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.status).toBe('failure');
  });

  test("cannot delete another user's testimonial", async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Owner Testimonial',
      });

    const testimonialId = created.body.data.testimonialId;

    const intruder = await request(app).post('/api/auth/register').send({
      email: 'intruder3@test.com',
      password: 'Password123',
      businessName: 'Intruder Shop 3',
    });

    const intruderToken = intruder.body.data.token;

    const res = await request(app)
      .delete(`/api/testimonials/${testimonialId}`)
      .set('Authorization', `Bearer ${intruderToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.status).toBe('failure');
  });

  test("cannot update status of another user's testimonial", async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Owner Testimonial',
      });

    const testimonialId = created.body.data.testimonialId;

    const intruder = await request(app).post('/api/auth/register').send({
      email: 'intruder4@test.com',
      password: 'Password123',
      businessName: 'Intruder Shop 4',
    });

    const intruderToken = intruder.body.data.token;

    const res = await request(app)
      .patch(`/api/testimonials/${testimonialId}/status`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({
        status: 'recording',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.status).toBe('failure');
  });

  test("cannot share another user's testimonial", async () => {
    const created = await request(app)
      .post('/api/testimonials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Owner Testimonial',
      });

    const testimonialId = created.body.data.testimonialId;

    await request(app)
      .patch(`/api/testimonials/${testimonialId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'recording' });

    await request(app)
      .patch(`/api/testimonials/${testimonialId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing' });

    await request(app)
      .patch(`/api/testimonials/${testimonialId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });

    const intruder = await request(app).post('/api/auth/register').send({
      email: 'intruder5@test.com',
      password: 'Password123',
      businessName: 'Intruder Shop 5',
    });

    const intruderToken = intruder.body.data.token;

    const res = await request(app)
      .post(`/api/testimonials/${testimonialId}/share`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({
        channels: ['email'],
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.status).toBe('failure');
  });

  test('invalid testimonialId format returns 400', async () => {
    const res = await request(app)
      .get('/api/testimonials/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failure');
    expect(res.body.message).toContain('Invalid testimonialId format');
  });
});
