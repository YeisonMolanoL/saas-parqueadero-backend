import type { EnviarNotificacionesMensualidadUseCase } from '../../application/use-cases/EnviarNotificacionesMensualidadUseCase.js';

export class ProcesadorNotificacionesMensualidad {
    private ejecutando = false;
    private ultimaEjecucion?: Date | undefined;

    constructor(
        private readonly enviarNotificacionesUseCase: EnviarNotificacionesMensualidadUseCase,
        private readonly intervaloMilisegundos: number
    ) { }

    iniciar(): void {
        void this.ejecutar();
        setInterval(() => void this.ejecutar(), this.intervaloMilisegundos);
    }

    obtenerUltimaEjecucion(): Date | undefined {
        return this.ultimaEjecucion;
    }

    private async ejecutar(): Promise<void> {
        if (this.ejecutando) {
            return;
        }

        this.ejecutando = true;
        try {
            await this.enviarNotificacionesUseCase.ejecutar();
            this.ultimaEjecucion = new Date();
        } catch (error: unknown) {
            console.error('Error al procesar notificaciones de mensualidades:', error);
        } finally {
            this.ejecutando = false;
        }
    }
}