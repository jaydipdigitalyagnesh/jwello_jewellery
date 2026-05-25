import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// POST /api/orders — Create order (logged in user)
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'No items in order' });

    // Validate and compute total
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      subtotal += product.price * item.quantity;
      orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity, metal: item.metal, size: item.size });
    }

    const gst = Math.round(subtotal * 0.03);
    const shipping = subtotal >= 2999 ? 0 : 199;
    let discount = 0;
    // Apply coupon logic here...

    const total = subtotal + gst + shipping - discount;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal, gst, shipping, discount, total,
      status: 'pending'
    });

    // Decrement stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity, salesCount: item.quantity } });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/my — User's own orders
router.get('/my', auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).populate('items.product', 'name images');
  res.json({ success: true, orders });
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Access denied' });
  res.json({ success: true, order });
});

// GET /api/orders — Admin: all orders
router.get('/', adminAuth, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).populate('user', 'name email'),
    Order.countDocuments(query)
  ]);
  res.json({ success: true, orders, total, pages: Math.ceil(total/limit) });
});

// PUT /api/orders/:id/status — Admin update status
router.put('/:id/status', adminAuth, async (req, res) => {
  const { status, trackingNumber } = req.body;
  const validStatuses = ['pending','processing','shipped','delivered','cancelled','returned'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });

  const order = await Order.findByIdAndUpdate(req.params.id, { status, ...(trackingNumber && { trackingNumber }) }, { new: true });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
});

export default router;
