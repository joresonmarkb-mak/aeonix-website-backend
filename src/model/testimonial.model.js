import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  image: {
    type: String,
    default: '',
  },
  soldVia: {
    type: String,
    enum: ['Meetup', 'COD', 'Facebook', 'Ship via J&T', 'Ship via LBC', 'Website', 'Carousell', 'Other'],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model('Testimonial', testimonialSchema);