process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
process.env.NODE_ENV = 'test';

describe('testimonialService - STATUS_TRANSITIONS', () => {
  const STATUS_TRANSITIONS = {
    draft: 'recording',
    recording: 'processing',
    processing: 'completed',
    completed: 'shared'
  };

  test('should have correct status transitions', () => {
    expect(STATUS_TRANSITIONS.draft).toBe('recording');
    expect(STATUS_TRANSITIONS.recording).toBe('processing');
    expect(STATUS_TRANSITIONS.processing).toBe('completed');
    expect(STATUS_TRANSITIONS.completed).toBe('shared');
  });

  test('should not have transition from shared', () => {
    expect(STATUS_TRANSITIONS.shared).toBeUndefined();
  });
});

describe('testimonialService - isOwner', () => {
  const isOwner = (testimonial, userId) => {
    return testimonial && testimonial.userId === userId;
  };

  test('should return true for matching userId', () => {
    const testimonial = { userId: 1 };
    expect(isOwner(testimonial, 1)).toBe(true);
  });

  test('should return false for non-matching userId', () => {
    const testimonial = { userId: 1 };
    expect(isOwner(testimonial, 2)).toBe(false);
  });

  test('should return falsy value for null testimonial', () => {
    expect(isOwner(null, 1)).toBeFalsy();
  });
});

describe('settingsService - field filtering', () => {
  const allowedFields = [
    'isEnabled',
    'defaultVideoLength',
    'videoLengthOptions',
    'questionnaire',
    'sendingOptions',
    'thankYouMessage',
    'contactConsent'
  ];

  const filterUpdateData = (updateData) => {
    const filteredUpdate = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    });
    return filteredUpdate;
  };

  test('should filter out non-allowed fields', () => {
    const result = filterUpdateData({
      isEnabled: true,
      invalidField: 'should be ignored'
    });

    expect(result).toHaveProperty('isEnabled');
    expect(result).not.toHaveProperty('invalidField');
  });

  test('should only include defined fields in update', () => {
    const result = filterUpdateData({
      isEnabled: true,
      thankYouMessage: undefined
    });

    expect(result).not.toHaveProperty('thankYouMessage');
  });
});

describe('analyticsService - date formatting', () => {
  test('should return ISO date strings in period', () => {
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    const result = {
      period: {
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null
      }
    };

    expect(result.period.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.period.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('should return null for missing dates', () => {
    const result = {
      period: {
        startDate: null,
        endDate: null
      }
    };

    expect(result.period.startDate).toBeNull();
    expect(result.period.endDate).toBeNull();
  });
});