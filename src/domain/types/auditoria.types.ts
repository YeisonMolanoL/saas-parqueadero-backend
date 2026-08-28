export interface IEventoAuditoria {
    id: number;
    usuarioId: number;
    usuarioNombre: string;
    tipoAccion: string;
    motivo?: string | undefined;
    detalles?: string | undefined;
    fecha: Date;
}

export interface IListarAuditoriaDTO {
    pagina: number;
    limite: number;
    tipoAccion?: string | undefined;
}

export interface IPaginaAuditoria {
    items: IEventoAuditoria[];
    total: number;
    pagina: number;
    limite: number;
}