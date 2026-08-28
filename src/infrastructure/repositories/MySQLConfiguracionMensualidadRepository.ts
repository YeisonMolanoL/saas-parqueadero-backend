import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { dbPool } from '../database/mysql.config.js';
import type { IConfiguracionMensualidadRepository } from '../../domain/repositories/IConfiguracionMensualidadRepository.js';
import type { IActualizarConfiguracionMensualidadDTO, IConfiguracionMensualidad } from '../../domain/types/configuracionMensualidad.types.js';

interface ConfiguracionMensualidadRow extends RowDataPacket {
    parqueadero_id: number;
    dias_gracia: number;
    dias_aviso_previo: number;
    dias_aviso_vencido: number;
    hora_envio_whatsapp: string;
    horas_plazo_pago_presencial: number;
    whatsapp_habilitado: number;
}

export class MySQLConfiguracionMensualidadRepository implements IConfiguracionMensualidadRepository {
    async obtener(parqueaderoId: number): Promise<IConfiguracionMensualidad> {
        await dbPool.execute(`
            INSERT IGNORE INTO configuracion_mensualidades (parqueadero_id)
            VALUES (?)
        `, [parqueaderoId]);
        const [rows] = await dbPool.execute<ConfiguracionMensualidadRow[]>(`
            SELECT parqueadero_id, dias_gracia, dias_aviso_previo, dias_aviso_vencido,
                   hora_envio_whatsapp, horas_plazo_pago_presencial, whatsapp_habilitado
            FROM configuracion_mensualidades
            WHERE parqueadero_id = ?
        `, [parqueaderoId]);
        const row = rows[0];
        if (!row) throw new Error('No fue posible obtener la configuración de mensualidades.');
        return this.mapear(row);
    }

    async actualizar(parqueaderoId: number, datos: IActualizarConfiguracionMensualidadDTO): Promise<IConfiguracionMensualidad> {
        await this.obtener(parqueaderoId);
        const [result] = await dbPool.execute<ResultSetHeader>(`
            UPDATE configuracion_mensualidades
            SET dias_gracia = ?, dias_aviso_previo = ?, dias_aviso_vencido = ?,
                hora_envio_whatsapp = ?, horas_plazo_pago_presencial = ?, whatsapp_habilitado = ?
            WHERE parqueadero_id = ?
        `, [
            datos.diasGracia,
            datos.diasAvisoPrevio,
            datos.diasAvisoVencido,
            datos.horaEnvioWhatsapp,
            datos.horasPlazoPagoPresencial,
            datos.whatsappHabilitado ? 1 : 0,
            parqueaderoId
        ]);
        if (result.affectedRows !== 1) throw new Error('No fue posible actualizar la configuración de mensualidades.');
        return this.obtener(parqueaderoId);
    }

    private mapear(row: ConfiguracionMensualidadRow): IConfiguracionMensualidad {
        return {
            parqueaderoId: row.parqueadero_id,
            diasGracia: row.dias_gracia,
            diasAvisoPrevio: row.dias_aviso_previo,
            diasAvisoVencido: row.dias_aviso_vencido,
            horaEnvioWhatsapp: row.hora_envio_whatsapp,
            horasPlazoPagoPresencial: row.horas_plazo_pago_presencial,
            whatsappHabilitado: row.whatsapp_habilitado === 1
        };
    }
}