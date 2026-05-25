import express from 'express';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/products/'),
  filename: (req, file, cb) => cb(null, `product-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/products — Public (with filters, pagination, sort)
router.get('/', async (req, res) => {
  try {
    const { category, metal, minPrice, maxPrice, search, sort, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (metal) query.metal = metal;
    if (minPrice || maxPrice) query.price = {};
    if (minPrice) query.price.$gte = +minPrice;
    if (maxPrice) query.price.$lte = +maxPrice;
    if (search) query.$text = { $search: search };

    const sortObj = sort === 'price_asc' ? { price: 1 }
      : sort === 'price_desc' ? { price: -1 }
        : sort === 'newest' ? { createdAt: -1 }
          : sort === 'popular' ? { salesCount: -1 }
            : { isFeatured: -1, createdAt: -1 };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(+limit).select('-__v'),
      Product.countDocuments(query)
    ]);

    res.json({ success: true, products, total, pages: Math.ceil(total / limit), page: +page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  const products = await Product.find({ isActive: true, isFeatured: true }).limit(8);
  res.json({ success: true, products });
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// POST /api/products — Admin only
router.post('/', async (req, res) => {
  try {
    const images = req.files?.map(f => `/uploads/products/${f.filename}`) || [];
    const product = await Product.create({ ...req.body, images });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id — Admin only
router.put('/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// DELETE /api/products/:id — Admin only
router.delete('/:id', async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Product deactivated' });
});

export default router;