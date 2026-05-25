import express from 'express';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/stats', adminAuth, async (req, res) => {
  res.json({ success: true, stats: {
    revenue: 4820500, orders: 1284, customers: 3471, products: 890,
    pendingOrders: 48, lowStock: 98, todayRevenue: 128500, todayOrders: 34
  }});
});
router.get('/revenue', adminAuth, async (req, res) => {
  const monthly = [180,240,195,310,285,420,380,510,460,590,520,680].map((v,i)=>({ month:i+1, revenue: v*1000 }));
  res.json({ success: true, monthly });
});
router.get('/top-products', adminAuth, async (req, res) => {
  res.json({ success: true, products: [
    { name:'Diamond Solitaire Ring', sales:320, revenue:14720000 },
    { name:'Emerald Pendant Set', sales:218, revenue:6976000 },
    { name:'Diamond Tennis Bracelet', sales:142, revenue:12070000 },
    { name:'Antique Gold Necklace', sales:98, revenue:5096000 },
  ]});
});
export default router;
