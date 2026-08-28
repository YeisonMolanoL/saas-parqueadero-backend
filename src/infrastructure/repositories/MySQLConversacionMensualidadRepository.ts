import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../database/mysql.config.js';
import type { IContextoRenovacionMensualidad, IConversacionMensualidadRepository } from '../../domain/repositories/IConversacionMensualidadRepository.js';
import type { TratamientoCliente } from '../../domain/types/clienteMensual.types.js';

interface ContextoRenovacionRow extends RowDataPacket {
    cliente_id: number;
    parqueadero_id: number;
    nombre_propietario: string;
    tratamiento: TratamientoCliente | null;
    placa: string;
    telefono_whatsapp: string;
    fecha_vencimiento: Date;
    monto: number;
}

export class MySQLConversacionMensualidadRepository implements IConversacionMensualidadRepository {
    async obtenerContextoVigente(telefono: string): Promise<IContextoRenovacionMensualidad | null> {
        return this.buscarInvitacionVigente(telefono);
    }

    async registrarDecision(telefono: string, aceptaRenovar: boolean): Promise<IContextoRenovacionMensualidad | null> {
        const contexto = await this.buscarInvitacionVigente(telefono);
        if (!contexto) return null;

        const estado = aceptaRenovar ? 'PENDIENTE_SELECCION' : 'RECHAZADA';
        await dbPool.execute<ResultSetHeader>(`
            INSERT INTO intenciones_pago_mensualidades
                (parqueadero_id, cliente_id, fecha_vencimiento_ciclo, canal, monto, estado)
            VALUES (?, ?, ?, 'WHATSAPP', ?, ?)
            ON DUPLICATE KEY UPDATE estado = VALUES(estado), metodo_pago = NULL, fecha_expiracion = NULL
        `, [contexto.parqueaderoId, contexto.clienteMensualId, contexto.fechaVencimiento, contexto.monto, estado]);
        return contexto;
    }

    async reservarPagoPresencial(telefono: string, fechaExpiracion: Date): Promise<IContextoRenovacionMensualidad | null> {
        const contexto = await this.buscarInvitacionVigente(telefono);
        if (!contexto) return null;

        const [result] = await dbPool.execute<ResultSetHeader>(`
            UPDATE intenciones_pago_mensualidades
            SET estado = 'PENDIENTE_PAGO_PRESENCIAL', metodo_pago = 'EFECTIVO', fecha_expiracion = ?
            WHERE cliente_id = ? AND DATE(fecha_vencimiento_ciclo) = DATE(?) AND canal = 'WHATSAPP'
              AND estado = 'PENDIENTE_SELECCION'
        `, [fechaExpiracion, contexto.clienteMensualId, contexto.fechaVencimiento]);
        if (result.affectedRows === 1) return contexto;

        const [intenciones] = await dbPool.execute<RowDataPacket[]>(`
                        SELECT id
                        FROM intenciones_pago_mensualidades
                        WHERE cliente_id = ? AND DATE(fecha_vencimiento_ciclo) = DATE(?)
                            AND canal = 'WHATSAPP' AND estado = 'PENDIENTE_PAGO_PRESENCIAL'
                            AND fecha_expiracion >= NOW()
                        LIMIT 1
                `, [contexto.clienteMensualId, contexto.fechaVencimiento]);
        return intenciones[0] ? contexto : null;
    }

    async cancelarIntencion(telefono: string): Promise<IContextoRenovacionMensualidad | null> {
        const contexto = await this.buscarInvitacionVigente(telefono);
        if (!contexto) return null;
        const [result] = await dbPool.execute<ResultSetHeader>(`
            UPDATE intenciones_pago_mensualidades
            SET estado = 'CANCELADA'
            WHERE cliente_id = ? AND fecha_vencimiento_ciclo = ? AND canal = 'WHATSAPP'
              AND estado IN ('PENDIENTE_SELECCION', 'PENDIENTE_PAGO_PRESENCIAL')
        `, [contexto.clienteMensualId, contexto.fechaVencimiento]);
        return result.affectedRows === 1 ? contexto : null;
    }

    private async buscarInvitacionVigente(telefono: string): Promise<IContextoRenovacionMensualidad | null> {
        const [rows] = await dbPool.execute<ContextoRenovacionRow[]>(`
            SELECT cliente.id AS cliente_id, cliente.parqueadero_id, cliente.nombre_propietario, cliente.tratamiento, cliente.placa, cliente.telefono_whatsapp,
                   cliente.fecha_vencimiento, 0 AS monto
            FROM clientes_mensuales cliente
            INNER JOIN notificaciones_mensualidades notificacion
                ON notificacion.cliente_id = cliente.id
                AND notificacion.fecha_vencimiento_ciclo = cliente.fecha_vencimiento
                AND notificacion.tipo IN ('VENCIDA_DIA_1', 'VENCIDA_DIA_2', 'VENCIDA_DIA_3', 'VENCIDA_DIA_4', 'VENCIDA_DIA_5')
                AND notificacion.estado_envio = 'ENVIADO'
            WHERE REPLACE(REPLACE(cliente.telefono_whatsapp, '+', ''), ' ', '') = REPLACE(REPLACE(?, '+', ''), ' ', '')
              AND DATEDIFF(CURDATE(), cliente.fecha_vencimiento) BETWEEN 1 AND 5
            ORDER BY notificacion.enviado_en DESC
            LIMIT 1
        `, [telefono]);
        const row = rows[0];
        return row ? {
            clienteMensualId: row.cliente_id,
            parqueaderoId: row.parqueadero_id,
            nombreCliente: row.nombre_propietario,
            tratamiento: row.tratamiento ?? undefined,
            placa: row.placa,
            telefono: row.telefono_whatsapp,
            fechaVencimiento: new Date(row.fecha_vencimiento),
            monto: Number(row.monto)
        } : null;
    }
}