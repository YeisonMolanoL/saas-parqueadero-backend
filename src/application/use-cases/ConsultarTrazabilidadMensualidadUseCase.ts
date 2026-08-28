import type { ITrazabilidadMensualidadRepository } from '../../domain/repositories/ITrazabilidadMensualidadRepository.js';
import type {
    IIntencionMensualidadAdministrativa,
    IListarTrazabilidadMensualidadDTO,
    INotificacionMensualidadAdministrativa,
    IPaginaTrazabilidad
} from '../../domain/types/clienteMensual.types.js';

export class ConsultarTrazabilidadMensualidadUseCase {
    constructor(private readonly trazabilidadRepository: ITrazabilidadMensualidadRepository) { }

    async intenciones(parqueaderoId: number, filtros: IListarTrazabilidadMensualidadDTO): Promise<IPaginaTrazabilidad<IIntencionMensualidadAdministrativa>> {
        return this.trazabilidadRepository.listarIntenciones(parqueaderoId, filtros);
    }

    async notificaciones(parqueaderoId: number, filtros: IListarTrazabilidadMensualidadDTO): Promise<IPaginaTrazabilidad<INotificacionMensualidadAdministrativa>> {
        return this.trazabilidadRepository.listarNotificaciones(parqueaderoId, filtros);
    }
}