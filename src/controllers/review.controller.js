import Review from '../model/review.model.js';
import Order from '../model/order.model.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, feedback, timeReceived } = req.body;

    // Verify order belongs to user and is delivered
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (order.status !== 'Delivered') return res.status(400).json({ message: 'Order not yet delivered' });

    // Check already reviewed
    const existing = await Review.findOne({ product: productId, user: req.user.id, order: orderId });
    if (existing) return res.status(400).json({ message: 'Already reviewed this item' });

    // Upload images if any
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map(f => uploadToCloudinary(f.buffer, 'aeonix/reviews'))
      );
      imageUrls = uploads.map(r => r.secure_url);
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      order: orderId,
      rating: Number(rating),
      feedback,
      images: imageUrls,
      timeReceived: new Date(timeReceived),
    });

    await review.populate('user', 'name');
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, avgRating: avgRating.toFixed(1), total: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Check if user can review a product
// @route   GET /api/reviews/can-review/:productId
// @access  Private
export const canReview = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find delivered orders containing this product
    const orders = await Order.find({
      user: req.user.id,
      status: 'Delivered',
      'items.product': productId,
    });

    if (orders.length === 0) {
      return res.json({ canReview: false, reason: 'No delivered orders for this product' });
    }

    // Check if already reviewed
    const reviewed = await Review.findOne({ product: productId, user: req.user.id });
    if (reviewed) {
      return res.json({ canReview: false, reason: 'Already reviewed' });
    }

    res.json({ canReview: true, orderId: orders[0]._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get all reviews (admin)
// @route GET /api/reviews/all
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name')
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc Delete a review (admin)
// @route DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};