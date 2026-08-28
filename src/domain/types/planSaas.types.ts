export interface IPlanSaas {
    id: number;
    nombre: string;
    precioMensual: number;
    limiteMotos: number;
    soportaWhatsapp: boolean;
    soportaPagosDigitales: boolean;
}

export interface ICrearPlanSaasDTO {
    nombre: string;
    precioMensual: number;
    limiteMotos: number;
    soportaWhatsapp: boolean;
    soportaPagosDigitales: boolean;
}

export interface IActualizarPlanSaasDTO extends ICrearPlanSaasDTO { }