import bcrypt from 'bcryptjs';
import type { IUsuario, IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.js';

interface IRegistrarOperarioInput {
    nombre: string;
    documentoId: string;
    telefono: string;
    email?: string | undefined;
    pin: string;
}

export class GestionarOperarioUseCase {
    constructor(private readonly usuarioRepository: IUsuarioRepository) { }

    async listar(parqueaderoId: number): Promise<IUsuario[]> {
        return this.usuarioRepository.listarPorParqueadero(parqueaderoId);
    }

    async registrar(parqueaderoId: number, administradorId: number, datos: IRegistrarOperarioInput): Promise<IUsuario> {
        if (!datos.nombre.trim() || !datos.documentoId.trim() || !datos.telefono.trim()) throw new TypeError('Nombre, documento y teléfono son requeridos.');
        if (!/^\d{4,8}$/.test(datos.pin)) throw new TypeError('El PIN debe tener entre 4 y 8 dígitos.');
        const existente = await this.usuarioRepository.buscarPorDocumento(parqueaderoId, datos.documentoId.trim());
        if (existente) throw new Error('Ya existe un usuario con ese documento en el parqueadero.');
        const pinHash = await bcrypt.hash(datos.pin, 10);
        return this.usuarioRepository.registrarOperario(parqueaderoId, administradorId, { ...datos, pinHash });
    }

    async cambiarEstado(parqueaderoId: number, administradorId: number, operarioId: number, estado: 'ACTIVO' | 'INACTIVO', motivo: string): Promise<void> {
        if (!motivo.trim()) throw new TypeError('El motivo es requerido.');
        await this.usuarioRepository.cambiarEstadoOperario(parqueaderoId, operarioId, administradorId, estado, motivo.trim());
    }
}