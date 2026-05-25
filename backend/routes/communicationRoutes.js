import express from 'express';
import {
  createCommunication,
  getLeadCommunications,
} from '../controllers/communicationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all communication routes

router.route('/')
  .post(createCommunication);

router.get('/lead/:leadId', getLeadCommunications);

export default router;
