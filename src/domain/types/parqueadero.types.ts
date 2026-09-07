export interface IRegistrarParqueaderoInput {
    nombreComercial: string;
    nitDocumento: string;
    ciudad: string;
    direccion: string;
    telefonoContacto: string;
    planId: number;
    nombreAdministrador: string;
    documentoAdministrador: string;
    telefonoAdministrador: string;
    emailAdministrador?: string | undefined;
    pinAdministrador: string;
}

export interface IRegistrarParqueaderoDTO extends Omit<IRegistrarParqueaderoInput, 'pinAdministrador'> {
    pinAdministradorHash: string;
}

export interface IParqueaderoRegistrado {
    parqueaderoId: number;
    administradorId: number;
    suscripcionId: number;
}

export interface IParqueaderoAdministrativo {
    id: number;
    nombreComercial: string;
    nitDocumento: string;
    ciudad: string;
    estado: 'PRUEBA_GRATUITA' | 'ACTIVO' | 'VENCIDO' | 'SUSPENDIDO';
    planNombre?: string | undefined;
    suscripcionVence?: Date | undefined;
    estadoPago?: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO' | undefined;
}

export interface IParqueaderoDetalle extends IParqueaderoAdministrativo {
    direccion: string;
    telefonoContacto: string;
    fechaFinPrueba?: Date | undefined;
    creadoEn?: Date | undefined;
    administrador?: {
        id: number;
        nombre: string;
        documentoId: string;
        telefono: string;
        email?: string | undefined;
        estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
    } | undefined;
    suscripcion?: {
        id: number;
        planId: number;
        planNombre: string;
        fechaInicio: Date;
        fechaVencimiento: Date;
        montoPagado: number;
        metodoPago: IRenovarSuscripcionParqueaderoDTO['metodoPago'];
        transaccionId: string;
        estadoPago: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
    } | undefined;
}

export interface IRenovarSuscripcionParqueaderoDTO {
    planId: number;
    metodoPago: 'WOMPI_PSE' | 'WOMPI_TARJETA' | 'WOMPI_BRE_B' | 'NEQUI' | 'TRANSFERENCIA';
    transaccionId: string;
}