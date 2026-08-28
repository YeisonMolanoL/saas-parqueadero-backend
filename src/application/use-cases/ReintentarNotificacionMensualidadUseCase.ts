import type { INotificacionMensualidadRepository } from '../../domain/repositories/INotificacionMensualidadRepository.js';

export class ReintentarNotificacionMensualidadUseCase {
    constructor(private readonly notificacionRepository: INotificacionMensualidadRepository) { }

    async ejecutar(notificacionId: number, parqueaderoId: number): Promise<void> {
        if (!Number.isInteger(notificacionId) || notificacionId <= 0) {
            throw new TypeError('El identificador de notificación no es válido.');
        }
        const reintentada = await this.notificacionRepository.reintentarFallo(notificacionId, parqueaderoId);
        if (!reintentada) {
            throw new Error('La notificación no existe, no pertenece al parqueadero o no está fallida.');
        }
    }
}