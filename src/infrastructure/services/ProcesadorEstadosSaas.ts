import type { ActualizarEstadosSaasUseCase } from '../../application/use-cases/ActualizarEstadosSaasUseCase.js';

export class ProcesadorEstadosSaas {
    private ejecutando = false;

    constructor(
        private readonly actualizarEstadosSaasUseCase: ActualizarEstadosSaasUseCase,
        private readonly intervaloMilisegundos: number
    ) { }

    iniciar(): void {
        void this.ejecutar();
        setInterval(() => void this.ejecutar(), this.intervaloMilisegundos);
    }

    private async ejecutar(): Promise<void> {
        if (this.ejecutando) return;
        this.ejecutando = true;
        try {
            await this.actualizarEstadosSaasUseCase.ejecutar();
        } catch (error: unknown) {
            console.error('Error al actualizar estados SaaS:', error);
        } finally {
            this.ejecutando = false;
        }
    }
}