import type { IPlanSaasRepository } from '../../domain/repositories/IPlanSaasRepository.js';
import type { IActualizarPlanSaasDTO, ICrearPlanSaasDTO, IPlanSaas } from '../../domain/types/planSaas.types.js';

export class GestionarPlanSaasUseCase {
    constructor(private readonly planRepository: IPlanSaasRepository) { }

    async listar(): Promise<IPlanSaas[]> {
        return this.planRepository.listar();
    }

    async crear(datos: ICrearPlanSaasDTO): Promise<IPlanSaas> {
        this.validar(datos);
        return this.planRepository.crear(datos);
    }

    async actualizar(id: number, datos: IActualizarPlanSaasDTO): Promise<IPlanSaas> {
        if (!Number.isInteger(id) || id <= 0) throw new TypeError('El identificador del plan no es válido.');
        this.validar(datos);
        return this.planRepository.actualizar(id, datos);
    }

    private validar(datos: ICrearPlanSaasDTO): void {
        if (!datos.nombre.trim()) throw new TypeError('El nombre del plan es requerido.');
        if (!Number.isFinite(datos.precioMensual) || datos.precioMensual < 0) throw new TypeError('El precio mensual no es válido.');
        if (!Number.isInteger(datos.limiteMotos) || datos.limiteMotos < 1) throw new TypeError('El límite de motos debe ser mayor a cero.');
    }
}