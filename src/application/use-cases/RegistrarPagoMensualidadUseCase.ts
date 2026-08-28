import type { IClienteMensualRepository } from '../../domain/repositories/IClienteMensualRepository.js';
import type { ITurnoRepository } from '../../domain/repositories/ITurnoRepository.js';
import type { ITarifaRepository } from '../../domain/repositories/ITarifaRepository.js';
import type { IRegistrarPagoMensualidadDTO } from '../../domain/types/clienteMensual.types.js';
import { calcularPeriodoRenovado } from '../../domain/services/CalcularPeriodoMensualidad.js';

export class RegistrarPagoMensualidadUseCase {
    constructor(
        private readonly clienteRepository: IClienteMensualRepository,
        private readonly turnoRepository: ITurnoRepository,
        private readonly tarifaRepository: ITarifaRepository
    ) { }

    async ejecutar(usuarioId: number, dto: IRegistrarPagoMensualidadDTO) {
        // 1. Validar que el cliente exista
        const cliente = await this.clienteRepository.buscarPorId(dto.clienteMensualId, dto.parqueaderoId);
        if (!cliente) {
            throw new Error('El cliente mensual especificado no existe.');
        }

        if (dto.canal === 'FISICO') {
            const turno = await this.turnoRepository.buscarTurnoAbiertoPorUsuario(dto.parqueaderoId, usuarioId);
            if (!turno) {
                throw new Error('Debes tener un turno de caja abierto para registrar el cobro físico de mensualidad.');
            }
            dto.turnoCajaId = turno.id;
        }

        const tarifa = await this.tarifaRepository.buscarActivaPorParqueadero(dto.parqueaderoId);
        if (!tarifa) {
            throw new Error('No existe una tarifa mensual activa para este parqueadero.');
        }

        const periodo = calcularPeriodoRenovado(cliente.fechaVencimiento, new Date(), cliente.diaPagoMensual);
        return this.clienteRepository.renovarConPago({
            ...dto,
            monto: tarifa.precioMensualidad,
            periodoPagadoInicio: periodo.fechaInicio,
            periodoPagadoFin: periodo.fechaVencimiento,
            cicloRenovado: cliente.fechaVencimiento
        }, periodo);
    }
}