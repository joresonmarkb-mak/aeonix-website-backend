import Product from '../model/product.model.js';
import cloudinary, { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Get all products (with filter, sort, pagination)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
 try {
  const { brand, category, minPrice, maxPrice, sort, page = 1, limit } = req.query;

 const filter = {};
if (brand) filter.brand = { $regex: brand, $options: 'i' };
if (category) filter.category = category;
if (req.query.isNewArrival) filter.isNewArrival = req.query.isNewArrival === 'true';
if (req.query.condition) filter.condition = req.query.condition;
if (req.query.movement) filter['specifications.movement'] = { $regex: req.query.movement, $options: 'i' };
if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
if (req.query.inStock === 'false') filter.stock = 0;
if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
if (minPrice || maxPrice) {
  filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);
}

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const skip = limit ? (Number(page) - 1) * Number(limit) : 0;
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit ? Number(limit) : 0); // 0 = no limit

  res.json({
    products,
    page: Number(page),
    totalPages: limit ? Math.ceil(total / Number(limit)) : 1,
    total,
  });
}catch (err) {
    res.status(500).json({ message: err.message });
  }
  
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }).limit(6);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin only ──────────────────────────────────────────────

// @desc    Create a product (with image upload)
// @route   POST /api/products
// @access  Admin
export const createProduct = async (req, res) => {
  try {
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );
      imageUrls = uploads.map((result) => result.secure_url);
    }

    const product = await Product.create({
      ...req.body,
      images: imageUrls,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a product (with optional new images)
// @route   PUT /api/products/:id
// @access  Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const url of product.images) {
        const publicId = url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload new images
      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );
      req.body.images = uploads.map((result) => result.secure_url);
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a product (and its Cloudinary images)
// @route   DELETE /api/products/:id
// @access  Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Delete images from Cloudinary
    for (const url of product.images) {
      const publicId = url.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};