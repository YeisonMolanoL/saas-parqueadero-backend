import { Router } from 'express';
import { MiPerfilController } from '../controllers/MiPerfilController.js';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken, requireRoles('ADMIN_PARQUEADERO'));
router.get('/parqueadero', MiPerfilController.parqueaderoPropio);
router.patch('/parqueadero', MiPerfilController.actualizarParqueadero);
router.get('/administrador', MiPerfilController.administradorPropio);
router.patch('/administrador', MiPerfilController.actualizarAdministrador);
router.get('/planes', MiPerfilController.planes);
router.get('/pagos', MiPerfilController.pagos);
router.get('/turnos', MiPerfilController.turnos);
router.post('/suscripciones', MiPerfilController.mejorarPlan);

export default router;
