import type { INotificacionMensualidadPendiente } from '../types/clienteMensual.types.js';

export interface INotificacionMensualidadRepository {
    crearNotificacionesDelDia(): Promise<void>;
    obtenerPendientes(limite: number): Promise<INotificacionMensualidadPendiente[]>;
    reclamarParaEnvio(notificacionId: number): Promise<boolean>;
    registrarEnvioExitoso(notificacionId: number): Promise<void>;
    registrarFalloEnvio(notificacionId: number, mensajeError: string): Promise<void>;
    reintentarFallo(notificacionId: number, parqueaderoId: number): Promise<boolean>;
}