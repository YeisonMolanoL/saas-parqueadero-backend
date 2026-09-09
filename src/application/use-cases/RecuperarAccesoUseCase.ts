import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import type { IUsuario, IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.js';
import type { IWhatsAppService } from '../../domain/services/IWhatsAppService.js';

const VIGENCIA_MINUTOS = 10;

interface SolicitarCodigoInput {
    documentoId: string;
    telefono: string;
}

interface ConfirmarRestablecimientoInput {
    documentoId: string;
    telefono: string;
    codigo: string;
    nuevoPin: string;
}

export class RecuperarAccesoUseCase {
    constructor(
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly whatsAppService: IWhatsAppService
    ) { }

    async solicitarCodigo(datos: SolicitarCodigoInput): Promise<void> {
        const documentoId = datos.documentoId.trim();
        const telefono = this.normalizarTelefono(datos.telefono);

        if (!documentoId || !telefono) {
            throw new TypeError('Documento y teléfono son requeridos.');
        }

        // Se busca la cuenta por documento (sin parqueadero específico). Si no existe, no se revela información.
        const cuentas = await this.usuarioRepository.buscarCuentasActivasPorDocumento(documentoId);
        const superAdmin = await this.usuarioRepository.buscarSuperAdminPorDocumento(documentoId);
        const candidatas = superAdmin ? [...cuentas, superAdmin] : cuentas;
        const cuenta = candidatas.find((u) => this.normalizarTelefono(u.telefono) === telefono)
            ?? candidatas.find((u) => u.rolNombre === 'ADMIN_PARQUEADERO')
            ?? candidatas[0];

        if (!cuenta || this.normalizarTelefono(cuenta.telefono) !== telefono) {
            // No se revela si la cuenta existe: mismo mensaje genérico de éxito para evitar enumeración.
            return;
        }

        const codigo = String(randomInt(100000, 1000000));
        const expiraEn = new Date(Date.now() + VIGENCIA_MINUTOS * 60_000);
        const codigoHash = await bcrypt.hash(codigo, 10);

        await this.usuarioRepository.guardarCodigoRecuperacion(cuenta.id!, codigoHash, expiraEn);

        if (!this.whatsAppService.estaConectado()) {
            throw new Error('El servicio de WhatsApp no está conectado. Inténtalo de nuevo más tarde.');
        }

        await this.whatsAppService.enviarCodigoRecuperacion({
            telefono,
            nombre: cuenta.nombre,
            codigo,
            minutosValidez: VIGENCIA_MINUTOS
        });
    }

    async confirmarRestablecimiento(datos: ConfirmarRestablecimientoInput): Promise<void> {
        const documentoId = datos.documentoId.trim();
        const telefono = this.normalizarTelefono(datos.telefono);
        const codigo = datos.codigo.trim();
        const nuevoPin = datos.nuevoPin.trim();

        if (!documentoId || !telefono || !codigo || !nuevoPin) {
            throw new TypeError('Todos los campos son requeridos.');
        }
        if (!/^\d{4,8}$/.test(nuevoPin)) {
            throw new TypeError('El PIN debe tener entre 4 y 8 dígitos.');
        }

        const cuentas = await this.usuarioRepository.buscarCuentasActivasPorDocumento(documentoId);
        const superAdmin = await this.usuarioRepository.buscarSuperAdminPorDocumento(documentoId);
        const candidatas = superAdmin ? [...cuentas, superAdmin] : cuentas;
        const cuenta = candidatas.find((u) => this.normalizarTelefono(u.telefono) === telefono);

        if (!cuenta || !cuenta.id) {
            throw new Error('No se encontró una cuenta que coincida con los datos ingresados.');
        }

        // Se valida en la base de datos todo el estado del código (vigente y no consumido).
        const codigoValido = await this.verificarCodigo(cuenta, codigo);
        if (!codigoValido) {
            throw new Error('El código es inválido o ha expirado. Solicita uno nuevo.');
        }

        if (codigo === nuevoPin) {
            throw new Error('El nuevo PIN no puede ser igual al código de verificación.');
        }

        const pinHash = await bcrypt.hash(nuevoPin, 10);
        await this.usuarioRepository.restablecerPin(cuenta.id, pinHash);
    }

    private async verificarCodigo(usuario: IUsuario, codigo: string): Promise<boolean> {
        const fila = await this.usuarioRepository.leerCodigoRecuperacion(usuario.id!);
        if (!fila?.codigoHash) return false;
        if (fila.consumido === 1) return false;
        if (!fila.expiracion || new Date(fila.expiracion) < new Date()) return false;
        return bcrypt.compare(codigo, fila.codigoHash);
    }

    private normalizarTelefono(telefono: string): string {
        const limpio = telefono.replace(/\D/g, '');
        return limpio.startsWith('57') && limpio.length === 12
            ? limpio.substring(2)
            : limpio;
    }
}