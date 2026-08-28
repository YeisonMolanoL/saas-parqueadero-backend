import type { IAuditoriaRepository } from '../../domain/repositories/IAuditoriaRepository.js';
import type { IListarAuditoriaDTO, IPaginaAuditoria } from '../../domain/types/auditoria.types.js';

export class ConsultarAuditoriaUseCase {
    constructor(private readonly auditoriaRepository: IAuditoriaRepository) { }

    async ejecutar(parqueaderoId: number, filtros: IListarAuditoriaDTO): Promise<IPaginaAuditoria> {
        return this.auditoriaRepository.listar(parqueaderoId, filtros);
    }
}