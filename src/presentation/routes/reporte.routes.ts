import { Router } from 'express';
import { ReporteController } from '../controllers/ReporteController.js';
import { authenticateToken, requireParqueaderoOperativo, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken, requireParqueaderoOperativo, requireRoles('ADMIN_PARQUEADERO'));
router.get('/recaudo', ReporteController.recaudo);
router.get('/auditoria', ReporteController.auditoria);

export default router;