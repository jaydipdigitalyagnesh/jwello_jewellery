import express from 'express';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

const cats = [
  { slug:'rings', name:'Rings', icon:'💍', count:240 },
  { slug:'necklaces', name:'Necklaces', icon:'📿', count:180 },
  { slug:'earrings', name:'Earrings', icon:'✨', count:320 },
  { slug:'bracelets', name:'Bracelets', icon:'⌚', count:150 },
  { slug:'bangles', name:'Bangles', icon:'⭕', count:90 },
  { slug:'pendants', name:'Pendants', icon:'🏅', count:110 },
];
router.get('/', (req, res) => res.json({ success: true, categories: cats }));
export default router;
