import type { IResultadoTiempo } from '../../types/tarifa.types.js';

export class ValidadorTiempoEstancia {
    /**
     * Calcula el tiempo de estancia y las horas a cobrar.
     * 
     * IMPORTANTE: El tiempo de gracia NO afecta el cálculo del cobro.
     * El tiempo de gracia es el período que tiene el usuario DESPUÉS de pagar
     * para salir físicamente del parqueadero.
     * 
     * El cobro se calcula desde el momento de la entrada hasta el momento del pago (salida).
     */
    static evaluar(fechaEntrada: Date | string, fechaSalida: Date | string, minutosGracia: number): IResultadoTiempo {
        const entrada = new Date(fechaEntrada);
        const salida = new Date(fechaSalida);

        const diffMs = salida.getTime() - entrada.getTime();
        const minutosTotales = Math.max(0, Math.ceil(diffMs / (1000 * 60)));

        // Siempre se cobra desde el primer minuto
        // Se redondea hacia arriba por horas completas
        const horasACobrar = Math.ceil(minutosTotales / 60);

        return {
            minutosTotales,
            horasACobrar,
            esTiempoGracia: false // El tiempo de gracia es post-pago, no afecta el cobro
        };
    }
}