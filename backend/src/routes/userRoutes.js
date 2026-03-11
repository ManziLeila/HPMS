import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { createUser, listUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = Router();

router.use(authenticate, requireRole(['HR', 'ManagingDirector']));
router.get('/', listUsers);
router.post('/', createUser);
router.get('/:userId', getUser);
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);

export default router;
