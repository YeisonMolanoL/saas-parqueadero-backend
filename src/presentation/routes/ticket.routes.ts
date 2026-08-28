import { Router } from 'express';
import { TicketController } from '../controllers/TicketController.js';
import { authenticateToken, requireParqueaderoOperativo, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta pública para consultar estado del ticket escaneando el QR
router.get('/qr/:codigoQr', TicketController.consultarPorQr);

// Rutas protegidas para el cajero
router.post('/salida', authenticateToken, requireParqueaderoOperativo, requireRoles('ADMIN_PARQUEADERO', 'OPERARIO'), TicketController.registrarSalida);
router.post('/anular', authenticateToken, requireParqueaderoOperativo, requireRoles('ADMIN_PARQUEADERO', 'OPERARIO'), TicketController.anularTicket);

export default router;