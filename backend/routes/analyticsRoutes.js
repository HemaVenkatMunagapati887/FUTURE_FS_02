import express from 'express';
import { getDashboardAnalytics, getLeadTimeline } from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all analytics routes

router.get('/dashboard', getDashboardAnalytics);
router.get('/timeline/:leadId', getLeadTimeline);

export default router;
