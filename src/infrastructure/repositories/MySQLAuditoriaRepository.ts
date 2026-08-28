import type { RowDataPacket } from 'mysql2';
import { dbPool } from '../database/mysql.config.js';
import type { IAuditoriaRepository } from '../../domain/repositories/IAuditoriaRepository.js';
import type { IListarAuditoriaDTO, IPaginaAuditoria } from '../../domain/types/auditoria.types.js';

interface AuditoriaRow extends RowDataPacket {
    id: number;
    usuario_id: number;
    usuario_nombre: string;
    tipo_accion: string;
    motivo: string | null;
    detalles: string | null;
    fecha: Date;
}

export class MySQLAuditoriaRepository implements IAuditoriaRepository {
    async listar(parqueaderoId: number, filtros: IListarAuditoriaDTO): Promise<IPaginaAuditoria> {
        const pagina = Number.isInteger(filtros.pagina) && filtros.pagina > 0 ? filtros.pagina : 1;
        const limite = Number.isInteger(filtros.limite) && filtros.limite > 0 ? Math.min(filtros.limite, 100) : 20;
        const desplazamiento = (pagina - 1) * limite;
        const tipoAccion = filtros.tipoAccion?.trim() ?? '';
        const [rows] = await dbPool.execute<AuditoriaRow[]>(`
            SELECT auditoria.id, auditoria.usuario_id, usuario.nombre AS usuario_nombre,
                   auditoria.tipo_accion, auditoria.motivo, auditoria.detalles, auditoria.fecha
            FROM auditoria_eventos auditoria
            INNER JOIN usuarios usuario ON usuario.id = auditoria.usuario_id
            WHERE auditoria.parqueadero_id = ?
              AND (? = '' OR auditoria.tipo_accion = ?)
            ORDER BY auditoria.fecha DESC, auditoria.id DESC
            LIMIT ${limite} OFFSET ${desplazamiento}
        `, [parqueaderoId, tipoAccion, tipoAccion]);
        const [conteo] = await dbPool.execute<RowDataPacket[]>(`
            SELECT COUNT(*) AS total
            FROM auditoria_eventos
            WHERE parqueadero_id = ? AND (? = '' OR tipo_accion = ?)
        `, [parqueaderoId, tipoAccion, tipoAccion]);
        return {
            items: rows.map((row) => ({
                id: row.id,
                usuarioId: row.usuario_id,
                usuarioNombre: row.usuario_nombre,
                tipoAccion: row.tipo_accion,
                motivo: row.motivo ?? undefined,
                detalles: row.detalles ?? undefined,
                fecha: new Date(row.fecha)
            })),
            total: Number(conteo[0]?.total ?? 0),
            pagina,
            limite
        };
    }
}