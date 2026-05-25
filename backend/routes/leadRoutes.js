import express from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  convertLeadToClient,
} from '../controllers/leadController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all lead routes

router.route('/')
  .post(createLead)
  .get(getLeads);

router.route('/:id')
  .get(getLeadById)
  .put(updateLead)
  .delete(restrictTo('Admin', 'Manager'), deleteLead);

router.post('/:id/convert', convertLeadToClient);

export default router;
