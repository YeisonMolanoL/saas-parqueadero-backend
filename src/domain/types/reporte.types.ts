import type { MetodoPagoMensualidad } from './clienteMensual.types.js';

export interface IReporteRecaudoDTO {
    fechaInicio: string;
    fechaFin: string;
}

export interface IRecaudoPorMetodo {
    metodoPago: MetodoPagoMensualidad;
    totalOcasional: number;
    totalMensualidad: number;
    total: number;
}

export interface IReporteRecaudo {
    fechaInicio: string;
    fechaFin: string;
    totalOcasional: number;
    totalMensualidades: number;
    totalRecaudado: number;
    porMetodo: IRecaudoPorMetodo[];
}