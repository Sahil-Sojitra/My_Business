import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/company.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: Router = Router();

// All company operations require authenticated broker identity
router.use(authenticate);

router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
