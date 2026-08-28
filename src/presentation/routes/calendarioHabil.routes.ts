import { Router } from 'express';
import { CalendarioHabilController } from '../controllers/CalendarioHabilController.js';
import { authenticateToken, requireParqueaderoOperativo, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken, requireParqueaderoOperativo, requireRoles('ADMIN_PARQUEADERO'));
router.get('/', CalendarioHabilController.listar);
router.post('/', CalendarioHabilController.agregar);
router.delete('/:id', CalendarioHabilController.eliminar);

export default router;