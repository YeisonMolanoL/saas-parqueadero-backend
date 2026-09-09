import { Router } from 'express';
import { TurnoController } from '../controllers/TurnoController.js';
import { authenticateToken, requireParqueaderoOperativo, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken, requireParqueaderoOperativo);

router.get('/actual', requireRoles('ADMIN_PARQUEADERO', 'OPERARIO'), TurnoController.consultarEstadoActual);
router.post('/abrir', requireRoles('ADMIN_PARQUEADERO'), TurnoController.abrirTurno);
router.post('/cerrar', requireRoles('ADMIN_PARQUEADERO'), TurnoController.cerrarTurno);
router.patch('/actual/base', requireRoles('ADMIN_PARQUEADERO'), TurnoController.actualizarBase);

export default router;
