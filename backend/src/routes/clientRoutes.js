import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { listClients, getClientById, createClient, updateClient, deleteClient } from '../controllers/clientController.js';
import { listEmployeesByClient } from '../controllers/employeeController.js';
import {
  listClientContracts,
  getClientContractById,
  createClientContract,
  updateClientContract,
  deleteClientContract,
} from '../controllers/clientContractController.js';

const router = Router();

router.use(authenticate, requireRole(['Admin', 'HR', 'FinanceOfficer', 'ManagingDirector']));

router.get('/', listClients);
router.post('/', createClient);
router.get('/:clientId', getClientById);
router.put('/:clientId', updateClient);
router.delete('/:clientId', deleteClient);
router.get('/:clientId/employees', listEmployeesByClient);
router.get('/:clientId/contracts', listClientContracts);
router.post('/:clientId/contracts', createClientContract);
router.get('/:clientId/contracts/:contractId', getClientContractById);
router.put('/:clientId/contracts/:contractId', updateClientContract);
router.delete('/:clientId/contracts/:contractId', deleteClientContract);

export default router;
