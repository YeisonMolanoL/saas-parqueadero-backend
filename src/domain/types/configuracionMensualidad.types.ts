export interface IConfiguracionMensualidad {
    parqueaderoId: number;
    diasGracia: number;
    diasAvisoPrevio: number;
    diasAvisoVencido: number;
    horaEnvioWhatsapp: string;
    horasPlazoPagoPresencial: number;
    whatsappHabilitado: boolean;
}

export interface IActualizarConfiguracionMensualidadDTO {
    diasGracia: number;
    diasAvisoPrevio: number;
    diasAvisoVencido: number;
    horaEnvioWhatsapp: string;
    horasPlazoPagoPresencial: number;
    whatsappHabilitado: boolean;
}