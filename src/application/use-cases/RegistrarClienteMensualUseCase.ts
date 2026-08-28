import type { IClienteMensualRepository } from '../../domain/repositories/IClienteMensualRepository.js';
import type { ITurnoRepository } from '../../domain/repositories/ITurnoRepository.js';
import type { ITarifaRepository } from '../../domain/repositories/ITarifaRepository.js';
import type { ICrearClienteMensualDTO } from '../../domain/types/clienteMensual.types.js';
import { calcularPrimerPeriodoMensualidad } from '../../domain/services/CalcularPeriodoMensualidad.js';

export class RegistrarClienteMensualUseCase {
    constructor(
        private readonly clienteRepository: IClienteMensualRepository,
        private readonly turnoRepository: ITurnoRepository,
        private readonly tarifaRepository: ITarifaRepository
    ) { }

    async ejecutar(usuarioId: number, dto: ICrearClienteMensualDTO) {
        if (!dto.placa?.trim() || !dto.nombreCliente?.trim() || !dto.telefono?.trim()) {
            throw new Error('La placa, el nombre y el teléfono de WhatsApp son requeridos.');
        }
        if (!['SR', 'SRA', 'NEUTRO'].includes(dto.tratamiento)) {
            throw new TypeError('El tratamiento debe ser SR, SRA o NEUTRO.');
        }

        const clienteExistente = await this.clienteRepository.buscarPorPlaca(dto.placa, dto.parqueaderoId);
        if (clienteExistente) {
            throw new Error(`Ya existe un cliente mensual activo asignado a la placa ${dto.placa.toUpperCase()}.`);
        }

        const turno = await this.turnoRepository.buscarTurnoAbiertoPorUsuario(dto.parqueaderoId, usuarioId);
        if (!turno) {
            throw new Error('Debes tener un turno de caja abierto para registrar una mensualidad.');
        }
        const tarifa = await this.tarifaRepository.buscarActivaPorParqueadero(dto.parqueaderoId);
        if (!tarifa) {
            throw new Error('No existe una tarifa mensual activa para este parqueadero.');
        }

        const fechaInicio = dto.fechaInicioContrato ? new Date(`${dto.fechaInicioContrato}T00:00:00`) : new Date();
        if (Number.isNaN(fechaInicio.getTime())) {
            throw new TypeError('La fecha de inicio de contrato no es válida.');
        }
        const diaPago = dto.diaPagoMensual ?? fechaInicio.getDate();
        const periodo = calcularPrimerPeriodoMensualidad(fechaInicio, diaPago);

        return this.clienteRepository.registrarClienteConPago({ ...dto, diaPagoMensual: diaPago }, turno.id, tarifa.precioMensualidad, periodo);
    }
}