import type { IParqueaderoRepository } from '../../domain/repositories/IParqueaderoRepository.js';

export class ActualizarEstadosSaasUseCase {
    constructor(private readonly parqueaderoRepository: IParqueaderoRepository) { }

    async ejecutar(): Promise<void> {
        await this.parqueaderoRepository.actualizarEstadosPorSuscripcion();
    }
}