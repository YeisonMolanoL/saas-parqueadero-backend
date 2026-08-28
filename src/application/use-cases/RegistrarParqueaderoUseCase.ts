import bcrypt from 'bcryptjs';
import type { IParqueaderoRepository } from '../../domain/repositories/IParqueaderoRepository.js';
import type { IParqueaderoAdministrativo, IParqueaderoRegistrado, IRegistrarParqueaderoInput, IRenovarSuscripcionParqueaderoDTO } from '../../domain/types/parqueadero.types.js';

export class RegistrarParqueaderoUseCase {
    constructor(private readonly parqueaderoRepository: IParqueaderoRepository) { }

    async ejecutar(datos: IRegistrarParqueaderoInput): Promise<IParqueaderoRegistrado> {
        this.validar(datos);
        const pinAdministradorHash = await bcrypt.hash(datos.pinAdministrador, 10);
        return this.parqueaderoRepository.registrarConConfiguracion({ ...datos, pinAdministradorHash });
    }

    async listar(): Promise<IParqueaderoAdministrativo[]> {
        return this.parqueaderoRepository.listarAdministrativos();
    }

    async cambiarEstado(parqueaderoId: number, usuarioId: number, estado: 'ACTIVO' | 'SUSPENDIDO', motivo: string): Promise<void> {
        if (!motivo.trim()) throw new TypeError('El motivo es requerido.');
        await this.parqueaderoRepository.cambiarEstado(parqueaderoId, estado, usuarioId, motivo.trim());
    }

    async renovarSuscripcion(parqueaderoId: number, usuarioId: number, datos: IRenovarSuscripcionParqueaderoDTO): Promise<number> {
        if (!Number.isInteger(datos.planId) || datos.planId <= 0) throw new TypeError('El plan no es válido.');
        if (!datos.transaccionId.trim()) throw new TypeError('La referencia de transacción es requerida.');
        return this.parqueaderoRepository.renovarSuscripcion(parqueaderoId, usuarioId, datos);
    }

    private validar(datos: IRegistrarParqueaderoInput): void {
        if (!datos.nombreComercial.trim() || !datos.nitDocumento.trim() || !datos.ciudad.trim() || !datos.direccion.trim()) {
            throw new TypeError('Los datos comerciales del parqueadero son requeridos.');
        }
        if (!datos.nombreAdministrador.trim() || !datos.documentoAdministrador.trim() || !datos.telefonoAdministrador.trim()) {
            throw new TypeError('Los datos del administrador son requeridos.');
        }
        if (!Number.isInteger(datos.planId) || datos.planId <= 0) {
            throw new TypeError('El plan seleccionado no es válido.');
        }
        if (!/^\d{4,8}$/.test(datos.pinAdministrador)) {
            throw new TypeError('El PIN del administrador debe tener entre 4 y 8 dígitos.');
        }
    }
}