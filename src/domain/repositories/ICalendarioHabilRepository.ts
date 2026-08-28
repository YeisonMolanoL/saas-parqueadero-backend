export interface IDiaNoHabil {
    id: number;
    fecha: string;
    motivo: string;
}

export interface ICalendarioHabilRepository {
    listar(parqueaderoId: number): Promise<IDiaNoHabil[]>;
    agregar(parqueaderoId: number, fecha: string, motivo: string): Promise<IDiaNoHabil>;
    eliminar(parqueaderoId: number, diaNoHabilId: number): Promise<void>;
    calcularFechaPagoPresencial(parqueaderoId: number, fechaBase: Date, horasPlazo: number): Promise<Date>;
}