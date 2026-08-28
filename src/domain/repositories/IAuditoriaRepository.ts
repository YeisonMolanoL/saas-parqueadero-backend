import type { IListarAuditoriaDTO, IPaginaAuditoria } from '../types/auditoria.types.js';

export interface IAuditoriaRepository {
    listar(parqueaderoId: number, filtros: IListarAuditoriaDTO): Promise<IPaginaAuditoria>;
}