const mongoose = require('mongoose');

const testimonialSettingsSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    unique: true 
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  defaultVideoLength: {
    type: Number,
    default: 10,
    min: 5,
    max: 60
  },
  videoLengthOptions: {
    type: [Number],
    default: [5,10,15,20,25],
    validate: {
        validator(values) {
            return values.every(v => v >= 5 && v <= 60);
        },
        message: "Video length must be between 5 and 60 seconds."
    }
  },
  questionnaire: {
    type: [String],
    default: ["What do you like about our service?"]
  },
  sendingOptions: {
    type: [{
        type: String,
        enum: ["email","sms"]
    }],
    default: ["email","sms"]
  },
  thankYouMessage: {
    type: String,
    default: "Thank you!"
  },
  contactConsent: {
    type: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: "Join our mailing list" }
    },
    default: {} 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestimonialSettings', testimonialSettingsSchema);