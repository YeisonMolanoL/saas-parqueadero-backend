import type { IActualizarConfiguracionMensualidadDTO, IConfiguracionMensualidad } from '../types/configuracionMensualidad.types.js';

export interface IConfiguracionMensualidadRepository {
    obtener(parqueaderoId: number): Promise<IConfiguracionMensualidad>;
    actualizar(parqueaderoId: number, datos: IActualizarConfiguracionMensualidadDTO): Promise<IConfiguracionMensualidad>;
}