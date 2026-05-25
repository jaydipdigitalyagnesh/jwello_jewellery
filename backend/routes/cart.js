import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET cart
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id).populate('cart.product');
  res.json({ success: true, cart: user?.cart || [] });
});

// POST add to cart
router.post('/add', auth, async (req, res) => {
  const { productId, quantity = 1, metal, size } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  let user = await User.findById(req.user.id);
  const existingIndex = user.cart?.findIndex(i => i.product.toString() === productId && i.metal === metal && i.size === size);
  if (existingIndex >= 0) {
    user.cart[existingIndex].quantity += quantity;
  } else {
    user.cart = user.cart || [];
    user.cart.push({ product: productId, quantity, metal, size });
  }
  await user.save();
  res.json({ success: true, message: 'Added to cart', cart: user.cart });
});

// DELETE remove from cart
router.delete('/remove/:itemId', auth, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $pull: { cart: { _id: req.params.itemId } } });
  res.json({ success: true, message: 'Item removed from cart' });
});

// DELETE clear cart
router.delete('/clear', auth, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { cart: [] });
  res.json({ success: true, message: 'Cart cleared' });
});

export default router;

// ─────────────────────────────────
// routes/wishlist.js (stub)
// ─────────────────────────────────
// GET    /api/wishlist       — get wishlist
// POST   /api/wishlist/add   — add product
// DELETE /api/wishlist/:id   — remove product

// routes/coupons.js (stub)
// GET  /api/coupons/validate/:code — check if coupon is valid (public)
// POST /api/coupons         — create coupon (admin)
// GET  /api/coupons         — list coupons (admin)
// PUT  /api/coupons/:id     — update coupon (admin)
// DEL  /api/coupons/:id     — delete coupon (admin)

// routes/reviews.js (stub)
// GET  /api/reviews/:productId — get reviews for product
// POST /api/reviews            — add review (auth)
// PUT  /api/reviews/:id        — edit review (auth + own)
// DEL  /api/reviews/:id        — delete review (admin or own)

// routes/users.js (stub)
// GET  /api/users/profile  — get profile (auth)
// PUT  /api/users/profile  — update profile (auth)
// GET  /api/users          — list users (admin)
// PUT  /api/users/:id      — update user (admin)

// routes/categories.js (stub)
// GET  /api/categories        — list all categories
// POST /api/categories        — create (admin)
// PUT  /api/categories/:id    — update (admin)
// DEL  /api/categories/:id    — delete (admin)

// routes/admin.js (stub)
// GET /api/admin/stats         — dashboard stats
// GET /api/admin/revenue       — revenue chart data
// GET /api/admin/top-products  — top selling products
