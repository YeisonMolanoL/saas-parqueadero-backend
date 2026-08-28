import { Router } from 'express';
import { SuperAdminParqueaderoController } from '../controllers/SuperAdminParqueaderoController.js';
import { SuperAdminPlanController } from '../controllers/SuperAdminPlanController.js';
import { authenticateToken, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken, requireSuperAdmin);
router.get('/parqueaderos', SuperAdminParqueaderoController.listar);
router.post('/parqueaderos', SuperAdminParqueaderoController.registrar);
router.post('/parqueaderos/:id/activar', SuperAdminParqueaderoController.activar);
router.post('/parqueaderos/:id/suspender', SuperAdminParqueaderoController.suspender);
router.post('/parqueaderos/:id/suscripciones', SuperAdminParqueaderoController.renovarSuscripcion);
router.get('/planes', SuperAdminPlanController.listar);
router.post('/planes', SuperAdminPlanController.crear);
router.put('/planes/:id', SuperAdminPlanController.actualizar);

export default router;