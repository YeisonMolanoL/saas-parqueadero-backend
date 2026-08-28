import { Router } from 'express';
import { TurnoController } from '../controllers/TurnoController.js';
import { authenticateToken, requireParqueaderoOperativo, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken, requireParqueaderoOperativo, requireRoles('ADMIN_PARQUEADERO', 'OPERARIO'));

router.get('/actual', TurnoController.consultarEstadoActual);
router.post('/abrir', TurnoController.abrirTurno);
router.post('/cerrar', TurnoController.cerrarTurno);

export default router;