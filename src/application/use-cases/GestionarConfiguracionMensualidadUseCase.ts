import type { IConfiguracionMensualidadRepository } from '../../domain/repositories/IConfiguracionMensualidadRepository.js';
import type { IActualizarConfiguracionMensualidadDTO, IConfiguracionMensualidad } from '../../domain/types/configuracionMensualidad.types.js';

export class GestionarConfiguracionMensualidadUseCase {
    constructor(private readonly configuracionRepository: IConfiguracionMensualidadRepository) { }

    async obtener(parqueaderoId: number): Promise<IConfiguracionMensualidad> {
        return this.configuracionRepository.obtener(parqueaderoId);
    }

    async actualizar(parqueaderoId: number, datos: IActualizarConfiguracionMensualidadDTO): Promise<IConfiguracionMensualidad> {
        this.validar(datos);
        return this.configuracionRepository.actualizar(parqueaderoId, datos);
    }

    private validar(datos: IActualizarConfiguracionMensualidadDTO): void {
        if (!Number.isInteger(datos.diasGracia) || datos.diasGracia < 0 || datos.diasGracia > 5) throw new TypeError('Los días de gracia deben estar entre 0 y 5.');
        if (!Number.isInteger(datos.diasAvisoPrevio) || datos.diasAvisoPrevio < 0 || datos.diasAvisoPrevio > 3) throw new TypeError('Los días de aviso previo deben estar entre 0 y 3.');
        if (!Number.isInteger(datos.diasAvisoVencido) || datos.diasAvisoVencido < 1 || datos.diasAvisoVencido > 5) throw new TypeError('Los días de aviso vencido deben estar entre 1 y 5.');
        if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(datos.horaEnvioWhatsapp)) throw new TypeError('La hora de envío debe usar formato HH:mm o HH:mm:ss.');
        if (!Number.isInteger(datos.horasPlazoPagoPresencial) || datos.horasPlazoPagoPresencial < 1 || datos.horasPlazoPagoPresencial > 72) throw new TypeError('El plazo presencial debe estar entre 1 y 72 horas.');
    }
}