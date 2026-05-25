import express from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployeePerformance,
  toggleEmployeeStatus,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all employee routes

router.route('/')
  .post(restrictTo('Admin'), createEmployee)
  .get(restrictTo('Admin', 'Manager'), getEmployees);

router.get('/performance', restrictTo('Admin', 'Manager'), getEmployeePerformance);
router.put('/:id/toggle', restrictTo('Admin'), toggleEmployeeStatus);

router.route('/:id')
  .put(restrictTo('Admin'), updateEmployee)
  .delete(restrictTo('Admin'), deleteEmployee);

export default router;
