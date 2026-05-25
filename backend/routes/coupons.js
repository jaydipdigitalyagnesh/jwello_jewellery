import express from 'express';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

const coupons = [
  { code: 'Jwello10', type: 'percentage', value: 10, minOrder: 999, active: true },
  { code: 'WELCOME15', type: 'percentage', value: 15, minOrder: 1499, active: true },
  { code: 'FLAT500', type: 'fixed', value: 500, minOrder: 5000, active: true },
];
router.get('/validate/:code', (req, res) => {
  const coupon = coupons.find(c => c.code === req.params.code.toUpperCase() && c.active);
  if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
  res.json({ success: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value, minOrder: coupon.minOrder } });
});
router.get('/', adminAuth, (req, res) => res.json({ success: true, coupons }));
export default router;
