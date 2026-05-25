import express from 'express';
import {
  createFollowUp,
  getLeadFollowUps,
  getMyFollowUps,
  updateFollowUp,
  deleteFollowUp,
} from '../controllers/followUpController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all follow-up routes

router.route('/')
  .post(createFollowUp);

router.get('/my', getMyFollowUps);
router.get('/lead/:leadId', getLeadFollowUps);

router.route('/:id')
  .put(updateFollowUp)
  .delete(restrictTo('Admin', 'Manager'), deleteFollowUp);

export default router;
