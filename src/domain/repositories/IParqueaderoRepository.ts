import type { IParqueaderoAdministrativo, IParqueaderoRegistrado, IRegistrarParqueaderoDTO, IRenovarSuscripcionParqueaderoDTO } from '../types/parqueadero.types.js';

export interface IParqueaderoRepository {
    registrarConConfiguracion(datos: IRegistrarParqueaderoDTO): Promise<IParqueaderoRegistrado>;
    listarAdministrativos(): Promise<IParqueaderoAdministrativo[]>;
    cambiarEstado(parqueaderoId: number, estado: 'ACTIVO' | 'SUSPENDIDO', usuarioId: number, motivo: string): Promise<void>;
    renovarSuscripcion(parqueaderoId: number, usuarioId: number, datos: IRenovarSuscripcionParqueaderoDTO): Promise<number>;
    actualizarEstadosPorSuscripcion(): Promise<void>;
}