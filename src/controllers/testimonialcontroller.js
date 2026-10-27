import Testimonial from '../model/testimonial.model.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Get all active testimonials
// @route   GET /api/testimonials
// @access  Public
export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all testimonials (admin)
// @route   GET /api/testimonials/all
// @access  Admin
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create testimonial
// @route   POST /api/testimonials
// @access  Admin
export const createTestimonial = async (req, res) => {
  try {
    const { clientName, feedback, rating, soldVia } = req.body;

    let image = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'aeonix/testimonials');
      image = result.secure_url;
    }

    const testimonial = await Testimonial.create({
      clientName,
      feedback,
      rating: Number(rating),
      soldVia,
      image,
    });

    res.status(201).json(testimonial);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Admin
export const updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Not found' });

    let image = testimonial.image;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'aeonix/testimonials');
      image = result.secure_url;
    }

    const updated = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { ...req.body, rating: Number(req.body.rating), image },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Admin
export const deleteTestimonial = async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};