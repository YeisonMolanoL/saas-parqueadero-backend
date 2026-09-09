import type { ITurnoRepository } from '../../domain/repositories/ITurnoRepository.js';

export class ActualizarBaseTurnoUseCase {
    constructor(private turnoRepository: ITurnoRepository) { }

    async ejecutar(parqueaderoId: number, montoInicialEfectivo: number): Promise<number> {
        if (!Number.isInteger(parqueaderoId) || parqueaderoId <= 0) {
            throw new TypeError('La operación requiere un parqueadero asignado.');
        }
        if (!Number.isFinite(montoInicialEfectivo) || montoInicialEfectivo < 0) {
            throw new TypeError('La base inicial no es válida.');
        }
        await this.turnoRepository.actualizarBaseInicial(parqueaderoId, montoInicialEfectivo);
        return montoInicialEfectivo;
    }
}
