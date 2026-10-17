import { Router } from 'express';
import {
  getBills,
  getBillsSummary,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  deleteBillsByCompany,
} from '../controllers/bill.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: Router = Router();

// All bill operations require authenticated broker identity
router.use(authenticate);

// Dashboard summary aggregation endpoint
router.get('/summary', getBillsSummary);

// Company cascade helper endpoint
router.delete('/company/:companyId', deleteBillsByCompany);

// Standard CRUD endpoints
router.get('/', getBills);
router.get('/:id', getBillById);
router.post('/', createBill);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);

export default router;
