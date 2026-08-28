import type { IReporteRecaudo, IReporteRecaudoDTO } from '../types/reporte.types.js';

export interface IReporteRepository {
    obtenerRecaudo(parqueaderoId: number, rango: IReporteRecaudoDTO): Promise<IReporteRecaudo>;
}