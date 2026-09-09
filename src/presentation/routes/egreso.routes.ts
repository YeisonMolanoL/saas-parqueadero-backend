import { Router } from 'express';
import { EgresoController } from '../controllers/EgresoController.js';
import { authenticateToken, requireParqueaderoOperativo, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken, requireParqueaderoOperativo);

router.post('/', requireRoles('ADMIN_PARQUEADERO'), EgresoController.registrar);
router.get('/turno/:turnoId', requireRoles('ADMIN_PARQUEADERO', 'OPERARIO'), EgresoController.listarPorTurno);

export default router;
