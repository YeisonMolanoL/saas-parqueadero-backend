import type { IConversacionMensualidadRepository } from '../../domain/repositories/IConversacionMensualidadRepository.js';
import type { ICalendarioHabilRepository } from '../../domain/repositories/ICalendarioHabilRepository.js';
import type { IConfiguracionMensualidadRepository } from '../../domain/repositories/IConfiguracionMensualidadRepository.js';
import type { IWhatsAppService } from '../../domain/services/IWhatsAppService.js';

export class ProcesarRespuestaMensualidadUseCase {
    constructor(
        private readonly conversacionRepository: IConversacionMensualidadRepository,
        private readonly configuracionRepository: IConfiguracionMensualidadRepository,
        private readonly calendarioHabilRepository: ICalendarioHabilRepository,
        private readonly whatsappService: IWhatsAppService
    ) { }

    async ejecutar(telefono: string, texto: string): Promise<boolean> {
        const respuesta = normalizarRespuesta(texto);
        if (respuesta === 'SI' || respuesta === 'NO') {
            const contexto = await this.conversacionRepository.registrarDecision(telefono, respuesta === 'SI');
            if (!contexto) {
                console.warn(`No hay una invitación de mensualidad vigente para la respuesta de ${telefono}.`);
                return false;
            }
            if (respuesta === 'SI') {
                await this.whatsappService.enviarMenuRenovacionMensualidad(contexto);
            } else {
                await this.whatsappService.enviarConfirmacionRechazoRenovacion(contexto.telefono, contexto.placa);
            }
            return true;
        }

        if (respuesta === 'EFECTIVO') {
            const contextoPendiente = await this.conversacionRepository.obtenerContextoVigente(telefono);
            if (!contextoPendiente) {
                console.warn(`No hay una selección de renovación mensual vigente para ${telefono}.`);
                return false;
            }
            const configuracion = await this.configuracionRepository.obtener(contextoPendiente.parqueaderoId);
            const fechaLimite = await this.calendarioHabilRepository.calcularFechaPagoPresencial(
                contextoPendiente.parqueaderoId,
                new Date(),
                configuracion.horasPlazoPagoPresencial
            );
            const contexto = await this.conversacionRepository.reservarPagoPresencial(telefono, fechaLimite);
            if (!contexto) {
                console.warn(`No hay una selección de renovación mensual vigente para ${telefono}.`);
                return false;
            }
            await this.whatsappService.enviarInstruccionPagoPresencial({ ...contexto, fechaLimite });
            return true;
        }

        if (respuesta === 'CANCELAR') {
            const contexto = await this.conversacionRepository.cancelarIntencion(telefono);
            if (!contexto) return false;
            await this.whatsappService.enviarConfirmacionCancelacionRenovacion(contexto.telefono, contexto.placa);
            return true;
        }

        return false;
    }
}

const normalizarRespuesta = (texto: string): 'SI' | 'NO' | 'EFECTIVO' | 'CANCELAR' | 'OTRA' => {
    const valor = texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (valor === 'si' || valor === 's') return 'SI';
    if (valor === 'no' || valor === 'n') return 'NO';
    if (valor === '1' || valor === 'efectivo') return 'EFECTIVO';
    if (valor === '0' || valor === 'cancelar') return 'CANCELAR';
    return 'OTRA';
};