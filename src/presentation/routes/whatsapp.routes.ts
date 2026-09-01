import { Router } from 'express';
import { authenticateToken, requireParqueaderoOperativo, requireRoles } from '../middlewares/auth.middleware.js';
import { WhatsAppConfigController } from '../controllers/WhatsAppConfigController.js';

const router = Router();

/**
 * GET /api/v1/whatsapp/qr
 * Obtiene el código QR para sincronizar WhatsApp
 * Requerido: ADMIN_PARQUEADERO
 */
router.get(
    '/qr',
    authenticateToken,
    requireParqueaderoOperativo,
    requireRoles('ADMIN_PARQUEADERO'),
    WhatsAppConfigController.obtenerQr
);

export default router;
