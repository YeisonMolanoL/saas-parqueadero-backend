import type { IParqueaderoRepository } from '../../domain/repositories/IParqueaderoRepository.js';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.js';
import type { IPlanSaasRepository } from '../../domain/repositories/IPlanSaasRepository.js';
import type { IParqueaderoDetalle, IRenovarSuscripcionParqueaderoDTO } from '../../domain/types/parqueadero.types.js';
import type { IPlanSaas } from '../../domain/types/planSaas.types.js';
import type { IActualizarAdministradorPropioDTO, IActualizarParqueaderoPropioDTO, IAdministradorPropio, ISuscripcionMembresia } from '../../domain/types/miPerfil.types.js';

const METODOS_PAGO = ['WOMPI_PSE', 'WOMPI_TARJETA', 'WOMPI_BRE_B', 'NEQUI', 'TRANSFERENCIA'] as const;

export class GestionarMiPerfilUseCase {
    constructor(
        private readonly parqueaderoRepository: IParqueaderoRepository,
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly planRepository: IPlanSaasRepository
    ) { }

    async obtenerParqueaderoPropio(parqueaderoId: number): Promise<IParqueaderoDetalle> {
        this.validarParqueadero(parqueaderoId);
        const detalle = await this.parqueaderoRepository.obtenerDetalle(parqueaderoId);
        if (!detalle) throw new Error('El parqueadero no existe.');
        return detalle;
    }

    async listarPlanes(): Promise<IPlanSaas[]> {
        return this.planRepository.listar();
    }

    async listarPagos(parqueaderoId: number): Promise<ISuscripcionMembresia[]> {
        this.validarParqueadero(parqueaderoId);
        return this.parqueaderoRepository.listarSuscripciones(parqueaderoId);
    }

    async actualizarParqueaderoPropio(parqueaderoId: number, datos: IActualizarParqueaderoPropioDTO): Promise<void> {
        this.validarParqueadero(parqueaderoId);
        if (!datos.nombreComercial?.trim() || !datos.ciudad?.trim() || !datos.direccion?.trim() || !datos.telefonoContacto?.trim()) {
            throw new TypeError('Los datos del parqueadero son requeridos.');
        }
        await this.parqueaderoRepository.actualizarDatosPropios(parqueaderoId, {
            nombreComercial: datos.nombreComercial.trim(),
            ciudad: datos.ciudad.trim(),
            direccion: datos.direccion.trim(),
            telefonoContacto: datos.telefonoContacto.trim()
        });
    }

    async obtenerAdministradorPropio(parqueaderoId: number, usuarioId: number): Promise<IAdministradorPropio> {
        this.validarParqueadero(parqueaderoId);
        this.validarUsuario(usuarioId);
        const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
        if (!usuario?.id || usuario.parqueaderoId !== parqueaderoId || usuario.rolNombre !== 'ADMIN_PARQUEADERO') {
            throw new Error('No fue posible consultar los datos del administrador.');
        }
        return {
            id: usuario.id,
            nombre: usuario.nombre,
            documentoId: usuario.documentoId,
            telefono: usuario.telefono,
            email: usuario.email ?? undefined,
            estado: usuario.estado
        };
    }

    async actualizarAdministradorPropio(parqueaderoId: number, usuarioId: number, datos: IActualizarAdministradorPropioDTO): Promise<IAdministradorPropio> {
        this.validarParqueadero(parqueaderoId);
        this.validarUsuario(usuarioId);
        if (!datos.nombre?.trim() || !datos.telefono?.trim()) {
            throw new TypeError('El nombre y el teléfono son requeridos.');
        }
        const email = datos.email?.trim() || undefined;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new TypeError('El correo electrónico no es válido.');
        }
        await this.usuarioRepository.actualizarDatosPropios(usuarioId, parqueaderoId, {
            nombre: datos.nombre.trim(),
            telefono: datos.telefono.trim(),
            email
        });
        return this.obtenerAdministradorPropio(parqueaderoId, usuarioId);
    }

    async mejorarPlan(parqueaderoId: number, usuarioId: number, datos: IRenovarSuscripcionParqueaderoDTO): Promise<number> {
        this.validarParqueadero(parqueaderoId);
        this.validarUsuario(usuarioId);
        if (!Number.isInteger(datos.planId) || datos.planId <= 0) throw new TypeError('El plan no es válido.');
        if (!(METODOS_PAGO as readonly string[]).includes(datos.metodoPago)) throw new TypeError('El método de pago no es válido.');
        if (!datos.transaccionId?.trim()) throw new TypeError('La referencia de transacción es requerida.');
        return this.parqueaderoRepository.renovarSuscripcion(parqueaderoId, usuarioId, {
            planId: datos.planId,
            metodoPago: datos.metodoPago,
            transaccionId: datos.transaccionId.trim()
        });
    }

    private validarParqueadero(parqueaderoId: number): void {
        if (!Number.isInteger(parqueaderoId) || parqueaderoId <= 0) {
            throw new TypeError('La operación requiere un parqueadero asignado.');
        }
    }

    private validarUsuario(usuarioId: number): void {
        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            throw new TypeError('La operación requiere un usuario válido.');
        }
    }
}
