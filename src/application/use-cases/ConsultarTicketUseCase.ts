import type { ITicketDetalle, ITicketRepository } from '../../domain/repositories/ITicketRepository.js';
import { CalculadorTarifa } from '../../domain/services/CalculadorTarifa.js';

export class ConsultarTicketUseCase {
    constructor(private ticketRepository: ITicketRepository) { }

    async ejecutarPorQr(codigoQr: string) {
        const ticket = await this.ticketRepository.buscarTicketPorQr(codigoQr);
        if (!ticket) throw new Error('Ticket no encontrado o código QR inválido.');
        return this.mapearRespuesta(ticket);
    }

    async ejecutarPorPlaca(parqueaderoId: number, placa: string) {
        const ticketActivo = await this.ticketRepository.buscarTicketActivoPorPlaca(parqueaderoId, placa.trim().toUpperCase());
        if (!ticketActivo?.id) throw new Error('No hay un ticket activo para esa placa en este parqueadero.');

        const ticket = await this.ticketRepository.buscarTicketPorId(ticketActivo.id, parqueaderoId);
        if (!ticket) throw new Error('No hay un ticket activo para esa placa en este parqueadero.');

        return this.mapearRespuesta(ticket);
    }

    private mapearRespuesta(ticket: ITicketDetalle) {
        const fechaSalidaSimulada = ticket.fechaSalida || new Date();
        const calculo = CalculadorTarifa.calcular(ticket.fechaEntrada, fechaSalidaSimulada, ticket.tarifa);

        return {
            ticketId: ticket.id,
            parqueaderoId: ticket.parqueaderoId,
            codigoQr: ticket.codigoQr,
            placa: ticket.placa,
            telefonoWhatsapp: ticket.telefonoWhatsapp,
            observacionesDanos: ticket.observacionesDanos,
            fechaEntrada: ticket.fechaEntrada,
            fechaSalida: ticket.fechaSalida || null,
            estado: ticket.estado,
            calculoActual: calculo
        };
    }
}