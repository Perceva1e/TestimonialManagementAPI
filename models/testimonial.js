const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    testimonialId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.'],
    },
    customerPhone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-()]{7,20}$/, 'Please enter a valid phone number.'],
    },
    videoUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL.'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'recording', 'processing', 'completed', 'shared'],
      default: 'draft',
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    sharedAt: {
      type: Date,
    },
    sharedChannels: {
      type: [
        {
          type: String,
          enum: ['email', 'sms', 'facebook', 'instagram'],
        },
      ],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

testimonialSchema.index({ userId: 1 });
testimonialSchema.index({ status: 1 });
testimonialSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
