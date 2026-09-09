import type { ITurnoRepository } from '../../domain/repositories/ITurnoRepository.js';
import type { ITurnoCaja, IAbrirTurnoDTO, IResumenVentasTurno, ITurnoHistorial } from '../../domain/types/turno.types.js';
import { dbPool } from '../database/mysql.config.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { TurnoCajaRow, VentasTurnoRow } from '../types/turno-mysql.types.js';

export class MySQLTurnoRepository implements ITurnoRepository {

    async buscarTurnoAbiertoPorUsuario(parqueaderoId: number, usuarioId: number): Promise<ITurnoCaja | null> {
        const query = `
      SELECT id, parqueadero_id, usuario_id, monto_inicial_base, 
             monto_efectivo_declarado, monto_efectivo_esperado, total_egresos_caja,
             diferencia_cuadre, fecha_apertura, fecha_cierre, estado
      FROM turnos_caja
      WHERE parqueadero_id = ? AND usuario_id = ? AND estado = 'ABIERTO'
      ORDER BY id DESC LIMIT 1
    `;
        const [rows] = await dbPool.execute<TurnoCajaRow[]>(query, [parqueaderoId, usuarioId]);
        const fila = rows[0];
        if (!fila) return null;

        return this.mapearTurno(fila);
    }

    async buscarPorId(turnoId: number, parqueaderoId: number): Promise<ITurnoCaja | null> {
        const query = `
      SELECT id, parqueadero_id, usuario_id, monto_inicial_base, 
             monto_efectivo_declarado, monto_efectivo_esperado, total_egresos_caja,
             diferencia_cuadre, fecha_apertura, fecha_cierre, estado
      FROM turnos_caja
      WHERE id = ? AND parqueadero_id = ?
      LIMIT 1
    `;
        const [rows] = await dbPool.execute<TurnoCajaRow[]>(query, [turnoId, parqueaderoId]);
        const fila = rows[0];
        if (!fila) return null;

        return this.mapearTurno(fila);
    }

    async abrirTurno(datos: IAbrirTurnoDTO): Promise<number> {
        const query = `
      INSERT INTO turnos_caja (
        parqueadero_id, usuario_id, monto_inicial_base, 
        total_egresos_caja, fecha_apertura, estado
      )
      VALUES (?, ?, ?, 0, NOW(), 'ABIERTO')
    `;

        const [result] = await dbPool.execute<ResultSetHeader>(query, [
            datos.parqueaderoId,
            datos.usuarioId,
            datos.montoInicialEfectivo
        ]);

        return result.insertId;
    }

    async actualizarBaseInicial(parqueaderoId: number, monto: number): Promise<void> {
        const [result] = await dbPool.execute<ResultSetHeader>(`
            UPDATE turnos_caja
            SET monto_inicial_base = ?
            WHERE parqueadero_id = ? AND estado = 'ABIERTO'
        `, [monto, parqueaderoId]);
        if (result.affectedRows !== 1) throw new Error('No hay un turno abierto para actualizar la base inicial.');
    }

    async listarHistorial(parqueaderoId: number): Promise<ITurnoHistorial[]> {
        const [rows] = await dbPool.execute<RowDataPacket[]>(`
            SELECT turno.id, turno.fecha_apertura, turno.fecha_cierre, usuario.nombre AS abierto_por,
                   turno.monto_inicial_base, turno.total_egresos_caja,
                   turno.monto_efectivo_declarado, turno.monto_efectivo_esperado,
                   turno.diferencia_cuadre, turno.estado,
                   COALESCE(ventas_ticket.ventas_efectivo, 0) AS ventas_efectivo_tickets,
                   COALESCE(ventas_mensualidad.ventas_efectivo, 0) AS ventas_efectivo_mensualidades
            FROM turnos_caja turno
            LEFT JOIN usuarios usuario ON usuario.id = turno.usuario_id
            LEFT JOIN (
                SELECT turno_salida_id, SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN total_pagado ELSE 0 END) AS ventas_efectivo
                FROM tickets
                WHERE estado = 'FINALIZADO'
                GROUP BY turno_salida_id
            ) ventas_ticket ON ventas_ticket.turno_salida_id = turno.id
            LEFT JOIN (
                SELECT turno_caja_id, SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN monto ELSE 0 END) AS ventas_efectivo
                FROM pagos_mensualidades
                GROUP BY turno_caja_id
            ) ventas_mensualidad ON ventas_mensualidad.turno_caja_id = turno.id
            WHERE turno.parqueadero_id = ?
            ORDER BY turno.fecha_apertura DESC, turno.id DESC
            LIMIT 50
        `, [parqueaderoId]);
        return rows.map((row) => {
            const ventasEfectivo = Number(row.ventas_efectivo_tickets ?? 0) + Number(row.ventas_efectivo_mensualidades ?? 0);
            const montoInicialBase = Number(row.monto_inicial_base);
            const totalEgresos = Number(row.total_egresos_caja);
            return {
                id: row.id,
                fechaApertura: new Date(row.fecha_apertura),
                fechaCierre: row.fecha_cierre ? new Date(row.fecha_cierre) : undefined,
                abiertoPor: row.abierto_por ?? undefined,
                montoInicialBase,
                totalEgresos,
                ventasEfectivo,
                efectivoEsperado: montoInicialBase + ventasEfectivo - totalEgresos,
                montoDeclarado: row.monto_efectivo_declarado !== null ? Number(row.monto_efectivo_declarado) : undefined,
                diferencia: row.diferencia_cuadre !== null ? Number(row.diferencia_cuadre) : undefined,
                estado: row.estado
            };
        });
    }

    async calcularVentasEfectivoTurno(turnoId: number): Promise<IResumenVentasTurno> {
        const query = `
      SELECT 
        SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN total_pagado ELSE 0 END) AS totalEfectivo,
        SUM(CASE WHEN metodo_pago != 'EFECTIVO' THEN total_pagado ELSE 0 END) AS totalOtros,
        COUNT(id) AS totalTickets
      FROM tickets
      WHERE turno_salida_id = ? AND estado = 'FINALIZADO'
    `;

        const [rows] = await dbPool.execute<VentasTurnoRow[]>(query, [turnoId]);
        const fila = rows[0];

        return {
            totalEfectivoRecaudado: Number(fila?.totalEfectivo ?? 0),
            totalOtrosMetodos: Number(fila?.totalOtros ?? 0),
            totalTicketsCobrados: Number(fila?.totalTickets ?? 0)
        };
    }

    async cerrarTurno(datos: {
        turnoId: number;
        efectivoReportado: number;
        efectivoCalculado: number;
        diferencia: number;
        observaciones?: string | undefined;
    }): Promise<void> {
        const query = `
      UPDATE turnos_caja
      SET fecha_cierre = NOW(),
          monto_efectivo_declarado = ?,
          monto_efectivo_esperado = ?,
          diferencia_cuadre = ?,
          estado = 'CERRADO'
      WHERE id = ? AND estado = 'ABIERTO'
    `;

        await dbPool.execute(query, [
            datos.efectivoReportado,
            datos.efectivoCalculado,
            datos.diferencia,
            datos.turnoId
        ]);
    }

    private mapearTurno(fila: TurnoCajaRow): ITurnoCaja {
        return {
            id: fila.id,
            parqueaderoId: fila.parqueadero_id,
            usuarioId: fila.usuario_id,
            fechaApertura: new Date(fila.fecha_apertura),
            fechaCierre: fila.fecha_cierre ? new Date(fila.fecha_cierre) : undefined,
            montoInicialEfectivo: Number(fila.monto_inicial_base),
            efectivoReportadoCierre: fila.monto_efectivo_declarado !== null ? Number(fila.monto_efectivo_declarado) : undefined,
            efectivoCalculadoSistema: fila.monto_efectivo_esperado !== null ? Number(fila.monto_efectivo_esperado) : 0,
            diferenciaCierre: fila.diferencia_cuadre !== null ? Number(fila.diferencia_cuadre) : 0,
            totalEgresosCaja: Number(fila.total_egresos_caja),
            estado: fila.estado
        };
    }
}