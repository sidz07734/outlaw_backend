const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  creatorId: {
    type: String,
    required: true
  },
  smeId: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);