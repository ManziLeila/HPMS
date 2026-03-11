import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { listClients, getClientById, createClient, updateClient, deleteClient } from '../controllers/clientController.js';
import { listEmployeesByClient } from '../controllers/employeeController.js';
import {
  listClientContracts,
  getClientContractById,
  createClientContract,
  updateClientContract,
  deleteClientContract,
  downloadContractDocument,
} from '../controllers/clientContractController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, images, or Word documents allowed'));
  },
});

router.use(authenticate, requireRole(['HR', 'FinanceOfficer', 'ManagingDirector']));

router.get('/', listClients);
router.post('/', upload.single('contractDocument'), createClient);
router.get('/:clientId', getClientById);
router.put('/:clientId', updateClient);
router.delete('/:clientId', deleteClient);
router.get('/:clientId/employees', listEmployeesByClient);
router.get('/:clientId/contracts', listClientContracts);
router.post('/:clientId/contracts', upload.single('contractDocument'), createClientContract);
router.get('/:clientId/contracts/:contractId/download', downloadContractDocument);
router.get('/:clientId/contracts/:contractId', getClientContractById);
router.put('/:clientId/contracts/:contractId', upload.single('contractDocument'), updateClientContract);
router.delete('/:clientId/contracts/:contractId', deleteClientContract);

export default router;
