import type { TratamientoCliente } from '../types/clienteMensual.types.js';

export interface IContextoRenovacionMensualidad {
    clienteMensualId: number;
    parqueaderoId: number;
    nombreCliente: string;
    tratamiento?: TratamientoCliente | undefined;
    placa: string;
    telefono: string;
    fechaVencimiento: Date;
    monto: number;
}

export interface IConversacionMensualidadRepository {
    obtenerContextoVigente(telefono: string): Promise<IContextoRenovacionMensualidad | null>;
    registrarDecision(telefono: string, aceptaRenovar: boolean): Promise<IContextoRenovacionMensualidad | null>;
    reservarPagoPresencial(telefono: string, fechaExpiracion: Date): Promise<IContextoRenovacionMensualidad | null>;
    cancelarIntencion(telefono: string): Promise<IContextoRenovacionMensualidad | null>;
}