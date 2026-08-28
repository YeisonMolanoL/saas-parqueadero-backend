import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { dbPool } from '../../infrastructure/database/mysql.config.js';

interface JwtPayload {
    usuarioId: number;
    parqueaderoId: number;
    rolId: number;
    rolNombre: 'SUPER_ADMIN' | 'ADMIN_PARQUEADERO' | 'OPERARIO' | 'CLIENTE';
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
        res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'secret_key';
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // Inyectamos los datos del usuario logueado en el objeto Request
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.rolNombre !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Esta operación requiere rol SUPER_ADMIN.' });
        return;
    }
    next();
};

type RolNombre = JwtPayload['rolNombre'];

interface ParqueaderoEstadoRow extends RowDataPacket {
    estado: 'PRUEBA_GRATUITA' | 'ACTIVO' | 'VENCIDO' | 'SUSPENDIDO';
    suscripcion_vigente: number;
    fecha_fin_prueba: Date | null;
}

export const requireRoles = (...rolesPermitidos: RolNombre[]) => (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !rolesPermitidos.includes(req.user.rolNombre)) {
        res.status(403).json({ error: 'No tienes permisos para realizar esta operación.' });
        return;
    }
    next();
};

export const requireParqueaderoOperativo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || req.user.parqueaderoId <= 0) {
        res.status(403).json({ error: 'La operación requiere un parqueadero asignado.' });
        return;
    }
    try {
        const [rows] = await dbPool.execute<ParqueaderoEstadoRow[]>(`
            SELECT parqueadero.estado, parqueadero.fecha_fin_prueba,
                   EXISTS (
                       SELECT 1
                       FROM suscripciones_parqueadero suscripcion
                       WHERE suscripcion.parqueadero_id = parqueadero.id
                         AND suscripcion.estado_pago = 'APROBADO'
                         AND suscripcion.fecha_vencimiento >= CURDATE()
                   ) AS suscripcion_vigente
            FROM parqueaderos parqueadero
            WHERE parqueadero.id = ?
            LIMIT 1
        `, [req.user.parqueaderoId]);
        const parqueadero = rows[0];
        const pruebaVigente = parqueadero?.estado === 'PRUEBA_GRATUITA'
            && parqueadero.fecha_fin_prueba !== null
            && new Date(parqueadero.fecha_fin_prueba) >= new Date();
        const puedeOperar = pruebaVigente
            || (parqueadero?.estado === 'ACTIVO' && parqueadero.suscripcion_vigente === 1);
        if (!puedeOperar) {
            res.status(403).json({ error: 'El parqueadero no está habilitado para operar.' });
            return;
        }
        next();
    } catch (error: unknown) {
        next(error);
    }
};