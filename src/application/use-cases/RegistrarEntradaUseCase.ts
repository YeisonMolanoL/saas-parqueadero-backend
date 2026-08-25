import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import type { ITicketRepository, IRegistroEntradaDTO } from '../../domain/repositories/ITicketRepository.js';
import type { IWhatsAppService } from '../../domain/services/IWhatsAppService.js';

export class RegistrarEntradaUseCase {
    constructor(
        private ticketRepository: ITicketRepository,
        private whatsappService?: IWhatsAppService
    ) { }

    async ejecutar(data: IRegistroEntradaDTO) {


        const placaLimpia = data.placa.trim().toUpperCase();

        // 1. Verificar si el operario tiene un turno de caja abierto
        const turnoIngresoId = await this.ticketRepository.buscarTurnoAbierto(data.parqueaderoId, data.usuarioIngresoId);
        if (!turnoIngresoId) {
            throw new Error('Debes abrir un turno de caja antes de registrar entradas de vehículos.');
        }

        // 2. Verificar si ya existe un ticket ACTIVO para esta placa
        const ticketActivo = await this.ticketRepository.buscarTicketActivoPorPlaca(data.parqueaderoId, placaLimpia);
        if (ticketActivo) {
            throw new Error(`La moto con placa ${placaLimpia} ya tiene una entrada activa registrada.`);
        }

        // 3. Verificar que haya tarifa configurada
        const tarifaId = await this.ticketRepository.obtenerTarifaVigente(data.parqueaderoId);
        if (!tarifaId) {
            throw new Error('No hay una tarifa activa configurada para este parqueadero.');
        }

        // 4. Generar token UUID v4 y Código QR
        const codigoQrToken = uuidv4();
        const qrImageBase64 = await QRCode.toDataURL(codigoQrToken);
        const fechaEntrada = new Date();

        // 5. Crear el ticket en la BDD
        const ticketId = await this.ticketRepository.crearTicket({
            parqueaderoId: data.parqueaderoId,
            codigoQr: codigoQrToken,
            placa: placaLimpia,
            telefonoWhatsapp: data.telefonoWhatsapp,
            observacionesDanos: data.observacionesDanos,
            turnoIngresoId
        });
        const nombreParqueadero = await this.ticketRepository.obtenerNombreParqueadero(data.parqueaderoId);

        // 6. Notificar por whatsapp en segundo plano
        if (data.telefonoWhatsapp && this.whatsappService) {
            this.whatsappService.enviarMenuPrincipal({
                telefono: data.telefonoWhatsapp,
                placa: placaLimpia,
                fechaEntrada: fechaEntrada,
                ticketId: ticketId,
                nombreParqueadero: nombreParqueadero
            }).then((exito: boolean) => {
                if (!exito) console.log('⚠️ No se pudo entregar el mensaje por WhatsApp.');
            }).catch((err: unknown) => console.error('❌ Error crítico al enviar por Baileys:', err));
        }

        // 7. Retorno unificado para Express
        return {
            ticketId,
            placa: placaLimpia,
            fechaEntrada,
            codigoQrToken,
            qrImageBase64,
            telefonoWhatsapp: data.telefonoWhatsapp || null
        };
    }
}