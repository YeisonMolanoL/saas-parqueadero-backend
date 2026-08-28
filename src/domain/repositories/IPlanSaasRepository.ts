import type { IActualizarPlanSaasDTO, ICrearPlanSaasDTO, IPlanSaas } from '../types/planSaas.types.js';

export interface IPlanSaasRepository {
    listar(): Promise<IPlanSaas[]>;
    crear(datos: ICrearPlanSaasDTO): Promise<IPlanSaas>;
    actualizar(id: number, datos: IActualizarPlanSaasDTO): Promise<IPlanSaas>;
}