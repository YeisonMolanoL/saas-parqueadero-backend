import type { IReporteRepository } from '../../domain/repositories/IReporteRepository.js';
import type { IReporteRecaudo, IReporteRecaudoDTO } from '../../domain/types/reporte.types.js';

export class ConsultarReporteRecaudoUseCase {
    constructor(private readonly reporteRepository: IReporteRepository) { }

    async ejecutar(parqueaderoId: number, rango: IReporteRecaudoDTO): Promise<IReporteRecaudo> {
        const inicio = new Date(`${rango.fechaInicio}T00:00:00`);
        const fin = new Date(`${rango.fechaFin}T00:00:00`);
        if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || inicio > fin) throw new TypeError('El rango de fechas no es válido.');
        const dias = Math.floor((fin.getTime() - inicio.getTime()) / 86_400_000);
        if (dias > 366) throw new TypeError('El rango máximo permitido es de 366 días.');
        return this.reporteRepository.obtenerRecaudo(parqueaderoId, rango);
    }
}