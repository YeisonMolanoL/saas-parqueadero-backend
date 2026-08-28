import type { RowDataPacket } from 'mysql2';
import { dbPool } from '../database/mysql.config.js';
import type { IReporteRepository } from '../../domain/repositories/IReporteRepository.js';
import type { IRecaudoPorMetodo, IReporteRecaudo, IReporteRecaudoDTO } from '../../domain/types/reporte.types.js';

interface RecaudoRow extends RowDataPacket {
    metodo_pago: IRecaudoPorMetodo['metodoPago'];
    total_ocasional: number;
    total_mensualidad: number;
}

export class MySQLReporteRepository implements IReporteRepository {
    async obtenerRecaudo(parqueaderoId: number, rango: IReporteRecaudoDTO): Promise<IReporteRecaudo> {
        const [rows] = await dbPool.execute<RecaudoRow[]>(`
            SELECT metodo_pago, SUM(total_ocasional) AS total_ocasional, SUM(total_mensualidad) AS total_mensualidad
            FROM (
                SELECT metodo_pago, total_pagado AS total_ocasional, 0 AS total_mensualidad
                FROM tickets
                WHERE parqueadero_id = ? AND estado = 'FINALIZADO'
                  AND DATE(fecha_salida) BETWEEN ? AND ? AND metodo_pago IS NOT NULL
                UNION ALL
                SELECT metodo_pago, 0 AS total_ocasional, monto AS total_mensualidad
                FROM pagos_mensualidades
                WHERE parqueadero_id = ? AND DATE(fecha_pago) BETWEEN ? AND ?
            ) recaudos
            GROUP BY metodo_pago
            ORDER BY metodo_pago ASC
        `, [parqueaderoId, rango.fechaInicio, rango.fechaFin, parqueaderoId, rango.fechaInicio, rango.fechaFin]);
        const porMetodo = rows.map((row) => {
            const totalOcasional = Number(row.total_ocasional);
            const totalMensualidad = Number(row.total_mensualidad);
            return { metodoPago: row.metodo_pago, totalOcasional, totalMensualidad, total: totalOcasional + totalMensualidad };
        });
        const totalOcasional = porMetodo.reduce((total, row) => total + row.totalOcasional, 0);
        const totalMensualidades = porMetodo.reduce((total, row) => total + row.totalMensualidad, 0);
        return { fechaInicio: rango.fechaInicio, fechaFin: rango.fechaFin, totalOcasional, totalMensualidades, totalRecaudado: totalOcasional + totalMensualidades, porMetodo };
    }
}