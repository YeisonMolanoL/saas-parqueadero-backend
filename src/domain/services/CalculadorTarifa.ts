import type { IResultadoCalculoTarifa, ITarifaConfig } from '../types/tarifa.types.js';
import { ValidadorTiempoEstancia } from './tarifa/ValidadorTiempoEstancia.js';
import { ValidadorNocturno } from './tarifa/ValidadorNocturno.js';
import { RecargoStrategyFactory } from './tarifa/RecargoStrategyFactory.js';

export class CalculadorTarifa {
    /**
     * Calcula el cobro total del ticket.
     * 
     * El tiempo de gracia (minutosGracia) NO afecta el cálculo del cobro.
     * Se cobra desde el primer minuto de estancia.
     * El tiempo de gracia es post-pago: es el período que tiene el usuario
     * para salir físicamente del parqueadero después de pagar.
     */
    static calcular(fechaEntrada: Date, fechaSalida: Date, tarifa: ITarifaConfig): IResultadoCalculoTarifa {
        // 1. Evaluar tiempo (SRP) - siempre se cobra
        const tiempo = ValidadorTiempoEstancia.evaluar(fechaEntrada, fechaSalida, tarifa.minutosGracia);

        const subtotalBase = tiempo.horasACobrar * tarifa.precioBaseHora;

        // 2. Evaluar recargo nocturno (SRP)
        const aplicoNocturno = ValidadorNocturno.aplica(
            fechaEntrada,
            fechaSalida,
            tarifa.horaInicioNocturna,
            tarifa.horaFinNocturna,
            tiempo.minutosTotales
        );

        let recargoNocturnoAplicado = 0;
        if (aplicoNocturno) {
            const estrategia = RecargoStrategyFactory.obtenerEstrategia(tarifa.tipoRecargoNocturno);
            recargoNocturnoAplicado = estrategia.calcular(subtotalBase, tarifa.valorRecargoNocturno);
        }

        const totalAPagar = subtotalBase + recargoNocturnoAplicado;

        return {
            minutosTotales: tiempo.minutosTotales,
            horasACobrar: tiempo.horasACobrar,
            subtotalBase,
            aplicoNocturno,
            recargoNocturnoAplicado,
            totalAPagar,
            esTiempoGracia: false
        };
    }
}