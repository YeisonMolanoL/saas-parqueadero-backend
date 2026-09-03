export interface IPeriodoMensualidad {
    fechaInicio: Date;
    fechaVencimiento: Date;
}

export const calcularPrimerPeriodoMensualidad = (fechaInicio: Date, diaPagoMensual: number): IPeriodoMensualidad => {
    validarDiaPago(diaPagoMensual);
    const fechaVencimiento = construirFechaDePago(
        fechaInicio.getFullYear(),
        fechaInicio.getMonth() + 1,
        diaPagoMensual
    );

    return { fechaInicio: normalizarFecha(fechaInicio), fechaVencimiento };
};

export const calcularPeriodoRenovado = (fechaVencimientoActual: Date, fechaPago: Date, diaPagoMensual: number): IPeriodoMensualidad => {
    const inicio = fechaVencimientoActual >= normalizarFecha(fechaPago)
        ? normalizarFecha(fechaVencimientoActual)
        : normalizarFecha(fechaPago);

    const fechaVencimiento = construirFechaDePago(inicio.getFullYear(), inicio.getMonth() + 1, diaPagoMensual);
    return { fechaInicio: inicio, fechaVencimiento };
};

const validarDiaPago = (diaPagoMensual: number): void => {
    if (!Number.isInteger(diaPagoMensual) || diaPagoMensual < 1 || diaPagoMensual > 30) {
        throw new Error('El día de pago mensual debe estar entre 1 y 30.');
    }
};

const construirFechaDePago = (anio: number, mes: number, dia: number): Date => {
    const fecha = new Date(anio, mes, 1);
    fecha.setDate(Math.min(dia, ultimoDiaDelMes(fecha)));
    return fecha;
};

const ultimoDiaDelMes = (fecha: Date): number => new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();

const normalizarFecha = (fecha: Date): Date => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());