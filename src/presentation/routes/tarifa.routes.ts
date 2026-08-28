import { Router } from 'express';
import { TarifaController } from '../controllers/TarifaController.js';
import { authenticateToken, requireParqueaderoOperativo, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken, requireParqueaderoOperativo);

router.get('/activa', requireRoles('ADMIN_PARQUEADERO', 'OPERARIO'), TarifaController.obtenerTarifaActiva);
router.post('/', requireRoles('ADMIN_PARQUEADERO'), TarifaController.crear);
router.put('/:id', requireRoles('ADMIN_PARQUEADERO'), TarifaController.actualizar);

export default router;