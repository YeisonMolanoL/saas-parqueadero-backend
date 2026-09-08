export interface IActualizarParqueaderoPropioDTO {
    nombreComercial: string;
    ciudad: string;
    direccion: string;
    telefonoContacto: string;
}

export interface IActualizarAdministradorPropioDTO {
    nombre: string;
    telefono: string;
    email?: string | undefined;
}

export interface IAdministradorPropio {
    id: number;
    nombre: string;
    documentoId: string;
    telefono: string;
    email?: string | undefined;
    estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
}

export interface ISuscripcionMembresia {
    id: number;
    planId: number;
    planNombre: string;
    fechaInicio: Date;
    fechaVencimiento: Date;
    montoPagado: number;
    metodoPago: 'WOMPI_PSE' | 'WOMPI_TARJETA' | 'WOMPI_BRE_B' | 'NEQUI' | 'TRANSFERENCIA';
    transaccionId: string;
    estadoPago: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
}
