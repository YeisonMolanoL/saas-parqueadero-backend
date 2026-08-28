import type {
    IIntencionMensualidadAdministrativa,
    IListarTrazabilidadMensualidadDTO,
    INotificacionMensualidadAdministrativa,
    IPaginaTrazabilidad
} from '../types/clienteMensual.types.js';

export interface ITrazabilidadMensualidadRepository {
    listarIntenciones(parqueaderoId: number, filtros: IListarTrazabilidadMensualidadDTO): Promise<IPaginaTrazabilidad<IIntencionMensualidadAdministrativa>>;
    listarNotificaciones(parqueaderoId: number, filtros: IListarTrazabilidadMensualidadDTO): Promise<IPaginaTrazabilidad<INotificacionMensualidadAdministrativa>>;
}