import type { RowDataPacket } from 'mysql2';
import { dbPool } from '../database/mysql.config.js';
import type { ITrazabilidadMensualidadRepository } from '../../domain/repositories/ITrazabilidadMensualidadRepository.js';
import type {
    IIntencionMensualidadAdministrativa,
    IListarTrazabilidadMensualidadDTO,
    INotificacionMensualidadAdministrativa,
    IPaginaTrazabilidad
} from '../../domain/types/clienteMensual.types.js';

export class MySQLTrazabilidadMensualidadRepository implements ITrazabilidadMensualidadRepository {
    async listarIntenciones(parqueaderoId: number, filtros: IListarTrazabilidadMensualidadDTO): Promise<IPaginaTrazabilidad<IIntencionMensualidadAdministrativa>> {
        const paginacion = this.obtenerPaginacion(filtros);
        const estado = filtros.estado?.trim() ?? '';
        const clienteId = filtros.clienteMensualId ?? null;
        const [rows] = await dbPool.execute<RowDataPacket[]>(`
            SELECT intencion.id, intencion.cliente_id, cliente.placa, intencion.monto, intencion.canal,
                   intencion.metodo_pago, intencion.estado, intencion.fecha_expiracion,
                   intencion.pago_mensualidad_id, intencion.creado_en
            FROM intenciones_pago_mensualidades intencion
            INNER JOIN clientes_mensuales cliente ON cliente.id = intencion.cliente_id
            WHERE intencion.parqueadero_id = ?
              AND (? IS NULL OR intencion.cliente_id = ?)
              AND (? = '' OR intencion.estado = ?)
            ORDER BY intencion.creado_en DESC, intencion.id DESC
            LIMIT ${paginacion.limite} OFFSET ${paginacion.desplazamiento}
        `, [parqueaderoId, clienteId, clienteId, estado, estado]);
        const total = await this.contar('intenciones_pago_mensualidades', parqueaderoId, clienteId, estado);
        return {
            items: rows.map((row) => ({
                id: row.id,
                clienteMensualId: row.cliente_id,
                placa: row.placa,
                monto: Number(row.monto),
                canal: row.canal,
                metodoPago: row.metodo_pago ?? undefined,
                estado: row.estado,
                fechaExpiracion: row.fecha_expiracion ? new Date(row.fecha_expiracion) : undefined,
                pagoMensualidadId: row.pago_mensualidad_id ?? undefined,
                creadoEn: new Date(row.creado_en)
            })),
            total,
            pagina: paginacion.pagina,
            limite: paginacion.limite
        };
    }

    async listarNotificaciones(parqueaderoId: number, filtros: IListarTrazabilidadMensualidadDTO): Promise<IPaginaTrazabilidad<INotificacionMensualidadAdministrativa>> {
        const paginacion = this.obtenerPaginacion(filtros);
        const estado = filtros.estado?.trim() ?? '';
        const clienteId = filtros.clienteMensualId ?? null;
        const [rows] = await dbPool.execute<RowDataPacket[]>(`
            SELECT notificacion.id, notificacion.cliente_id, cliente.placa, notificacion.tipo,
                   notificacion.estado_envio, notificacion.intentos, notificacion.ultimo_error,
                   notificacion.enviado_en, notificacion.creado_en
            FROM notificaciones_mensualidades notificacion
            INNER JOIN clientes_mensuales cliente ON cliente.id = notificacion.cliente_id
            WHERE notificacion.parqueadero_id = ?
              AND (? IS NULL OR notificacion.cliente_id = ?)
              AND (? = '' OR notificacion.estado_envio = ?)
            ORDER BY notificacion.creado_en DESC, notificacion.id DESC
            LIMIT ${paginacion.limite} OFFSET ${paginacion.desplazamiento}
        `, [parqueaderoId, clienteId, clienteId, estado, estado]);
        const total = await this.contar('notificaciones_mensualidades', parqueaderoId, clienteId, estado, 'estado_envio');
        return {
            items: rows.map((row) => ({
                id: row.id,
                clienteMensualId: row.cliente_id,
                placa: row.placa,
                tipo: row.tipo,
                estadoEnvio: row.estado_envio,
                intentos: row.intentos,
                ultimoError: row.ultimo_error ?? undefined,
                enviadoEn: row.enviado_en ? new Date(row.enviado_en) : undefined,
                creadoEn: new Date(row.creado_en)
            })),
            total,
            pagina: paginacion.pagina,
            limite: paginacion.limite
        };
    }

    private obtenerPaginacion(filtros: IListarTrazabilidadMensualidadDTO): { pagina: number; limite: number; desplazamiento: number } {
        const pagina = Number.isInteger(filtros.pagina) && filtros.pagina > 0 ? filtros.pagina : 1;
        const limite = Number.isInteger(filtros.limite) && filtros.limite > 0 ? Math.min(filtros.limite, 100) : 20;
        return { pagina, limite, desplazamiento: (pagina - 1) * limite };
    }

    private async contar(tabla: 'intenciones_pago_mensualidades' | 'notificaciones_mensualidades', parqueaderoId: number, clienteId: number | null, estado: string, columnaEstado = 'estado'): Promise<number> {
        const [rows] = await dbPool.execute<RowDataPacket[]>(`
            SELECT COUNT(*) AS total FROM ${tabla}
            WHERE parqueadero_id = ? AND (? IS NULL OR cliente_id = ?)
              AND (? = '' OR ${columnaEstado} = ?)
        `, [parqueaderoId, clienteId, clienteId, estado, estado]);
        return Number(rows[0]?.total ?? 0);
    }
}