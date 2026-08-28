import type { ICalendarioHabilRepository, IDiaNoHabil } from '../../domain/repositories/ICalendarioHabilRepository.js';

export class GestionarCalendarioHabilUseCase {
    constructor(private readonly calendarioRepository: ICalendarioHabilRepository) { }

    async listar(parqueaderoId: number): Promise<IDiaNoHabil[]> {
        return this.calendarioRepository.listar(parqueaderoId);
    }

    async agregar(parqueaderoId: number, fecha: string, motivo: string): Promise<IDiaNoHabil> {
        const fechaValida = new Date(`${fecha}T00:00:00`);
        if (Number.isNaN(fechaValida.getTime())) throw new TypeError('La fecha no es válida.');
        if (!motivo.trim()) throw new TypeError('El motivo es requerido.');
        return this.calendarioRepository.agregar(parqueaderoId, fecha, motivo);
    }

    async eliminar(parqueaderoId: number, diaNoHabilId: number): Promise<void> {
        if (!Number.isInteger(diaNoHabilId) || diaNoHabilId <= 0) throw new TypeError('El identificador no es válido.');
        await this.calendarioRepository.eliminar(parqueaderoId, diaNoHabilId);
    }
}