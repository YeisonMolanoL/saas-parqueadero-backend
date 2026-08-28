import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import { dbPool } from '../database/mysql.config.js';
import type { IParqueaderoRepository } from '../../domain/repositories/IParqueaderoRepository.js';
import type { IParqueaderoAdministrativo, IParqueaderoRegistrado, IRegistrarParqueaderoDTO, IRenovarSuscripcionParqueaderoDTO } from '../../domain/types/parqueadero.types.js';

interface PlanRow extends RowDataPacket {
    id: number;
    precio_mensual: number;
}

interface RolRow extends RowDataPacket {
    id: number;
}

export class MySQLParqueaderoRepository implements IParqueaderoRepository {
    async actualizarEstadosPorSuscripcion(): Promise<void> {
        await dbPool.execute(`
            UPDATE parqueaderos parqueadero
            LEFT JOIN suscripciones_parqueadero suscripcion
                ON suscripcion.id = (
                    SELECT ultima.id
                    FROM suscripciones_parqueadero ultima
                    WHERE ultima.parqueadero_id = parqueadero.id
                      AND ultima.estado_pago = 'APROBADO'
                    ORDER BY ultima.fecha_vencimiento DESC, ultima.id DESC
                    LIMIT 1
                )
            SET parqueadero.estado = 'VENCIDO'
                        WHERE (parqueadero.estado = 'ACTIVO'
                            AND (suscripcion.id IS NULL OR suscripcion.fecha_vencimiento < CURDATE()))
                             OR (parqueadero.estado = 'PRUEBA_GRATUITA'
                            AND parqueadero.fecha_fin_prueba < CURDATE())
        `);
    }

    async cambiarEstado(parqueaderoId: number, estado: 'ACTIVO' | 'SUSPENDIDO', usuarioId: number, motivo: string): Promise<void> {
        const connection = await dbPool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.execute<ResultSetHeader>(`
                UPDATE parqueaderos SET estado = ? WHERE id = ?
            `, [estado, parqueaderoId]);
            if (result.affectedRows !== 1) throw new Error('El parqueadero no existe.');
            await this.registrarAuditoria(connection, parqueaderoId, usuarioId, `${estado}_PARQUEADERO`, motivo);
            await connection.commit();
        } catch (error: unknown) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async renovarSuscripcion(parqueaderoId: number, usuarioId: number, datos: IRenovarSuscripcionParqueaderoDTO): Promise<number> {
        const connection = await dbPool.getConnection();
        try {
            await connection.beginTransaction();
            const [existentes] = await connection.execute<RowDataPacket[]>(`
                SELECT id FROM suscripciones_parqueadero WHERE transaccion_id = ? LIMIT 1
            `, [datos.transaccionId]);
            if (existentes[0]) {
                await connection.commit();
                return existentes[0].id as number;
            }
            const plan = await this.obtenerPlan(connection, datos.planId);
            const [parqueaderos] = await connection.execute<RowDataPacket[]>(`
                SELECT id FROM parqueaderos WHERE id = ? FOR UPDATE
            `, [parqueaderoId]);
            if (!parqueaderos[0]) throw new Error('El parqueadero no existe.');
            const [ultimas] = await connection.execute<RowDataPacket[]>(`
                SELECT fecha_vencimiento FROM suscripciones_parqueadero
                WHERE parqueadero_id = ? ORDER BY fecha_vencimiento DESC, id DESC LIMIT 1
            `, [parqueaderoId]);
            const fechaInicio = ultimas[0]?.fecha_vencimiento ?? new Date();
            const [suscripcion] = await connection.execute<ResultSetHeader>(`
                INSERT INTO suscripciones_parqueadero (
                    parqueadero_id, plan_id, fecha_inicio, fecha_vencimiento, monto_pagado,
                    metodo_pago, transaccion_id, estado_pago
                ) VALUES (?, ?, GREATEST(DATE(?), CURDATE()), DATE_ADD(GREATEST(DATE(?), CURDATE()), INTERVAL 1 MONTH), ?, ?, ?, 'APROBADO')
            `, [parqueaderoId, plan.id, fechaInicio, fechaInicio, plan.precio_mensual, datos.metodoPago, datos.transaccionId.trim()]);
            await connection.execute(`UPDATE parqueaderos SET estado = 'ACTIVO' WHERE id = ?`, [parqueaderoId]);
            await this.registrarAuditoria(connection, parqueaderoId, usuarioId, 'RENOVACION_SUSCRIPCION_SAAS', `Suscripción ${suscripcion.insertId}`);
            await connection.commit();
            return suscripcion.insertId;
        } catch (error: unknown) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async listarAdministrativos(): Promise<IParqueaderoAdministrativo[]> {
        const [rows] = await dbPool.execute<RowDataPacket[]>(`
            SELECT parqueadero.id, parqueadero.nombre_comercial, parqueadero.nit_documento,
                   parqueadero.ciudad, parqueadero.estado, plan.nombre AS plan_nombre,
                   suscripcion.fecha_vencimiento, suscripcion.estado_pago
            FROM parqueaderos parqueadero
            LEFT JOIN suscripciones_parqueadero suscripcion
                ON suscripcion.id = (
                    SELECT ultima.id
                    FROM suscripciones_parqueadero ultima
                    WHERE ultima.parqueadero_id = parqueadero.id
                    ORDER BY ultima.fecha_vencimiento DESC, ultima.id DESC
                    LIMIT 1
                )
            LEFT JOIN planes_saas plan ON plan.id = suscripcion.plan_id
            ORDER BY parqueadero.nombre_comercial ASC
        `);
        return rows.map((row) => ({
            id: row.id,
            nombreComercial: row.nombre_comercial,
            nitDocumento: row.nit_documento,
            ciudad: row.ciudad,
            estado: row.estado,
            planNombre: row.plan_nombre ?? undefined,
            suscripcionVence: row.fecha_vencimiento ? new Date(row.fecha_vencimiento) : undefined,
            estadoPago: row.estado_pago ?? undefined
        }));
    }

    async registrarConConfiguracion(datos: IRegistrarParqueaderoDTO): Promise<IParqueaderoRegistrado> {
        const connection = await dbPool.getConnection();
        try {
            await connection.beginTransaction();
            const plan = await this.obtenerPlan(connection, datos.planId);
            const rolAdministrador = await this.obtenerRolAdministrador(connection);
            const [parqueadero] = await connection.execute<ResultSetHeader>(`
                INSERT INTO parqueaderos (nombre_comercial, nit_documento, ciudad, direccion, telefono_contacto, fecha_fin_prueba, estado)
                VALUES (?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'PRUEBA_GRATUITA')
            `, [datos.nombreComercial.trim(), datos.nitDocumento.trim(), datos.ciudad.trim(), datos.direccion.trim(), datos.telefonoContacto.trim()]);
            const parqueaderoId = parqueadero.insertId;

            await connection.execute(`INSERT INTO branding_parqueaderos (parqueadero_id) VALUES (?)`, [parqueaderoId]);
            await connection.execute(`INSERT INTO configuracion_mensualidades (parqueadero_id) VALUES (?)`, [parqueaderoId]);
            await connection.execute(`INSERT INTO tarifas (parqueadero_id) VALUES (?)`, [parqueaderoId]);
            const [administrador] = await connection.execute<ResultSetHeader>(`
                INSERT INTO usuarios (parqueadero_id, rol_id, nombre, documento_id, telefono, email, pin_hash, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
            `, [parqueaderoId, rolAdministrador.id, datos.nombreAdministrador.trim(), datos.documentoAdministrador.trim(), datos.telefonoAdministrador.trim(), datos.emailAdministrador?.trim() ?? null, datos.pinAdministradorHash]);
            const [suscripcion] = await connection.execute<ResultSetHeader>(`
                INSERT INTO suscripciones_parqueadero (
                    parqueadero_id, plan_id, fecha_inicio, fecha_vencimiento, monto_pagado,
                    metodo_pago, transaccion_id, estado_pago
                ) VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, 'TRANSFERENCIA', ?, 'PENDIENTE')
            `, [parqueaderoId, plan.id, plan.precio_mensual, `REGISTRO-${parqueaderoId}`]);
            await connection.commit();
            return { parqueaderoId, administradorId: administrador.insertId, suscripcionId: suscripcion.insertId };
        } catch (error: unknown) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    private async obtenerPlan(connection: PoolConnection, planId: number): Promise<PlanRow> {
        const [rows] = await connection.execute<PlanRow[]>(`SELECT id, precio_mensual FROM planes_saas WHERE id = ? LIMIT 1`, [planId]);
        if (!rows[0]) throw new Error('El plan seleccionado no existe.');
        return rows[0];
    }

    private async obtenerRolAdministrador(connection: PoolConnection): Promise<RolRow> {
        const [rows] = await connection.execute<RolRow[]>(`SELECT id FROM roles WHERE nombre = 'ADMIN_PARQUEADERO' LIMIT 1`);
        if (!rows[0]) throw new Error('No existe el rol ADMIN_PARQUEADERO.');
        return rows[0];
    }

    private async registrarAuditoria(connection: PoolConnection, parqueaderoId: number, usuarioId: number, tipoAccion: string, motivo: string): Promise<void> {
        await connection.execute(`
            INSERT INTO auditoria_eventos (parqueadero_id, usuario_id, tipo_accion, motivo)
            VALUES (?, ?, ?, ?)
        `, [parqueaderoId, usuarioId, tipoAccion, motivo]);
    }
}