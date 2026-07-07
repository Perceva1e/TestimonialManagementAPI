process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
process.env.NODE_ENV = 'test';

const testimonialService = require('../services/testimonialService');
const settingsService = require('../services/settingsService');
const analyticsService = require('../services/analyticsService');

describe('testimonialService - STATUS_TRANSITIONS', () => {
  test('should have correct status transitions', () => {
    expect(testimonialService.STATUS_TRANSITIONS.draft).toBe('recording');
    expect(testimonialService.STATUS_TRANSITIONS.recording).toBe('processing');
    expect(testimonialService.STATUS_TRANSITIONS.processing).toBe('completed');
    expect(testimonialService.STATUS_TRANSITIONS.completed).toBe('shared');
  });

  test('should not have transition from shared', () => {
    expect(testimonialService.STATUS_TRANSITIONS.shared).toBeUndefined();
  });
});

describe('testimonialService - isOwner', () => {
  test('should return true for matching userId', () => {
    const testimonial = { userId: 1 };
    expect(testimonialService.isOwner(testimonial, 1)).toBe(true);
  });

  test('should return false for non-matching userId', () => {
    const testimonial = { userId: 1 };
    expect(testimonialService.isOwner(testimonial, 2)).toBe(false);
  });

  test('should return falsy value for null testimonial', () => {
    expect(testimonialService.isOwner(null, 1)).toBeFalsy();
  });
});

describe('settingsService - field filtering', () => {
  test('should filter out non-allowed fields in upsertSettings', async () => {
    const updateData = {
      isEnabled: true,
      invalidField: 'should be ignored',
    };

    const User = require('../models/user');
    const bcrypt = require('bcryptjs');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    const user = await User.create({
      userId: 9999,
      email: 'settings-filter-test@test.com',
      password: hashedPassword,
      businessName: 'Test Business',
    });

    const result = await settingsService.upsertSettings(
      user.userId,
      updateData,
    );

    expect(result.isEnabled).toBe(true);
    expect(result.invalidField).toBeUndefined();

    await User.deleteOne({ userId: 9999 });
  });

  test('should save allowed fields in upsertSettings', async () => {
    const updateData = {
      isEnabled: true,
      defaultVideoLength: 20,
      videoLengthOptions: [10, 20, 30],
      questionnaire: ['Question 1'],
      sendingOptions: ['email'],
      thankYouMessage: 'Thank you!',
      contactConsent: { enabled: true, text: 'Subscribe' },
    };

    const User = require('../models/user');
    const bcrypt = require('bcryptjs');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    const user = await User.create({
      userId: 9998,
      email: 'settings-allowed-test@test.com',
      password: hashedPassword,
      businessName: 'Test Business',
    });

    const result = await settingsService.upsertSettings(
      user.userId,
      updateData,
    );

    expect(result.isEnabled).toBe(true);
    expect(result.defaultVideoLength).toBe(20);
    expect(result.videoLengthOptions).toEqual([10, 20, 30]);
    expect(result.questionnaire).toEqual(['Question 1']);
    expect(result.sendingOptions).toEqual(['email']);
    expect(result.thankYouMessage).toBe('Thank you!');

    await User.deleteOne({ userId: 9998 });
  });
});

describe('analyticsService - date formatting', () => {
  test('should return ISO date strings in period', async () => {
    const User = require('../models/user');
    const bcrypt = require('bcryptjs');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    const user = await User.create({
      userId: 9997,
      email: 'analytics-date-test@test.com',
      password: hashedPassword,
      businessName: 'Test Business',
    });

    const result = await analyticsService.getAnalytics(user.userId, {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    expect(result.period.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.period.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    await User.deleteOne({ userId: 9997 });
  });

  test('should return null for missing dates', async () => {
    const User = require('../models/user');
    const bcrypt = require('bcryptjs');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    const user = await User.create({
      userId: 9996,
      email: 'analytics-null-test@test.com',
      password: hashedPassword,
      businessName: 'Test Business',
    });

    const result = await analyticsService.getAnalytics(user.userId, {});

    expect(result.period.startDate).toBeNull();
    expect(result.period.endDate).toBeNull();

    await User.deleteOne({ userId: 9996 });
  });

  test('should include full end date in query', async () => {
    const User = require('../models/user');
    const Testimonial = require('../models/testimonial');
    const bcrypt = require('bcryptjs');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    const user = await User.create({
      userId: 9995,
      email: 'analytics-enddate-test@test.com',
      password: hashedPassword,
      businessName: 'Test Business',
    });

    const testDate = '2024-01-01';
    const testDateObj = new Date(testDate);

    await Testimonial.create({
      testimonialId: 'test-enddate-123',
      userId: user.userId,
      customerName: 'Test Customer',
      status: 'draft',
      createdAt: testDateObj,
    });

    const result = await analyticsService.getAnalytics(user.userId, {
      startDate: testDate,
      endDate: testDate,
    });
    expect(result.overview.total).toBe(1);

    await User.deleteOne({ userId: 9995 });
    await Testimonial.deleteOne({ testimonialId: 'test-enddate-123' });
  });
});
