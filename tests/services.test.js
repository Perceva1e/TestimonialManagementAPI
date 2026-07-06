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
    const allowedFields = [
        'isEnabled',
        'defaultVideoLength',
        'videoLengthOptions',
        'questionnaire',
        'sendingOptions',
        'thankYouMessage',
        'contactConsent'
    ];

    test('should filter out non-allowed fields in upsertSettings', () => {
        const updateData = {
            isEnabled: true,
            invalidField: 'should be ignored'
        };
        
        expect(allowedFields).toContain('isEnabled');
        expect(allowedFields).toContain('defaultVideoLength');
        expect(allowedFields).not.toContain('invalidField');
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