import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
    listTemplates, getPlaceholders, getTemplate,
    createTemplate, updateTemplate, deleteTemplate,
    previewTemplate,
} from '../controllers/contractTemplateController.js';
import { downloadContractPDF } from '../controllers/contractTemplateController.js';

const router = Router();
const editorRoles = ['Admin', 'HR', 'FinanceOfficer'];

router.use(authenticate);
router.get('/placeholders', getPlaceholders);
router.get('/', listTemplates);
router.get('/:id', getTemplate);
router.post('/', requireRole(editorRoles), createTemplate);
router.patch('/:id', requireRole(editorRoles), updateTemplate);
router.delete('/:id', requireRole(editorRoles), deleteTemplate);
router.post('/:id/preview', requireRole(editorRoles), previewTemplate);

export { downloadContractPDF };
export default router;
