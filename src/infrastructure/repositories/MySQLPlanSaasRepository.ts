import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../database/mysql.config.js';
import type { IPlanSaasRepository } from '../../domain/repositories/IPlanSaasRepository.js';
import type { IActualizarPlanSaasDTO, ICrearPlanSaasDTO, IPlanSaas } from '../../domain/types/planSaas.types.js';

interface PlanSaasRow extends RowDataPacket {
    id: number;
    nombre: string;
    precio_mensual: number;
    limite_motos: number;
    soporta_whatsapp: number;
    soporta_pagos_digitales: number;
}

export class MySQLPlanSaasRepository implements IPlanSaasRepository {
    async listar(): Promise<IPlanSaas[]> {
        const [rows] = await dbPool.execute<PlanSaasRow[]>(`
            SELECT id, nombre, precio_mensual, limite_motos, soporta_whatsapp, soporta_pagos_digitales
            FROM planes_saas ORDER BY precio_mensual ASC
        `);
        return rows.map((row) => this.mapear(row));
    }

    async crear(datos: ICrearPlanSaasDTO): Promise<IPlanSaas> {
        const [result] = await dbPool.execute<ResultSetHeader>(`
            INSERT INTO planes_saas (nombre, precio_mensual, limite_motos, soporta_whatsapp, soporta_pagos_digitales)
            VALUES (?, ?, ?, ?, ?)
        `, [datos.nombre.trim(), datos.precioMensual, datos.limiteMotos, datos.soportaWhatsapp ? 1 : 0, datos.soportaPagosDigitales ? 1 : 0]);
        return this.obtenerPorId(result.insertId);
    }

    async actualizar(id: number, datos: IActualizarPlanSaasDTO): Promise<IPlanSaas> {
        const [result] = await dbPool.execute<ResultSetHeader>(`
            UPDATE planes_saas
            SET nombre = ?, precio_mensual = ?, limite_motos = ?, soporta_whatsapp = ?, soporta_pagos_digitales = ?
            WHERE id = ?
        `, [datos.nombre.trim(), datos.precioMensual, datos.limiteMotos, datos.soportaWhatsapp ? 1 : 0, datos.soportaPagosDigitales ? 1 : 0, id]);
        if (result.affectedRows !== 1) throw new Error('El plan no existe.');
        return this.obtenerPorId(id);
    }

    private async obtenerPorId(id: number): Promise<IPlanSaas> {
        const [rows] = await dbPool.execute<PlanSaasRow[]>(`
            SELECT id, nombre, precio_mensual, limite_motos, soporta_whatsapp, soporta_pagos_digitales
            FROM planes_saas WHERE id = ? LIMIT 1
        `, [id]);
        const row = rows[0];
        if (!row) throw new Error('No fue posible recuperar el plan.');
        return this.mapear(row);
    }

    private mapear(row: PlanSaasRow): IPlanSaas {
        return {
            id: row.id,
            nombre: row.nombre,
            precioMensual: Number(row.precio_mensual),
            limiteMotos: row.limite_motos,
            soportaWhatsapp: row.soporta_whatsapp === 1,
            soportaPagosDigitales: row.soporta_pagos_digitales === 1
        };
    }
}