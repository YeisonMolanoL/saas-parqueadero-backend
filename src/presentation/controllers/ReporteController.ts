import type { Request, Response } from 'express';
import { ConsultarReporteRecaudoUseCase } from '../../application/use-cases/ConsultarReporteRecaudoUseCase.js';
import { MySQLReporteRepository } from '../../infrastructure/repositories/MySQLReporteRepository.js';
import { ConsultarAuditoriaUseCase } from '../../application/use-cases/ConsultarAuditoriaUseCase.js';
import { MySQLAuditoriaRepository } from '../../infrastructure/repositories/MySQLAuditoriaRepository.js';

const useCase = new ConsultarReporteRecaudoUseCase(new MySQLReporteRepository());
const auditoriaUseCase = new ConsultarAuditoriaUseCase(new MySQLAuditoriaRepository());

export class ReporteController {
    static async recaudo(req: Request, res: Response): Promise<void> {
        try {
            const fechaInicio = typeof req.query.fechaInicio === 'string' ? req.query.fechaInicio : '';
            const fechaFin = typeof req.query.fechaFin === 'string' ? req.query.fechaFin : '';
            res.status(200).json({ data: await useCase.ejecutar(req.user!.parqueaderoId, { fechaInicio, fechaFin }) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible generar el reporte.' });
        }
    }

    static async auditoria(req: Request, res: Response): Promise<void> {
        try {
            const pagina = Number(req.query.pagina ?? 1);
            const limite = Number(req.query.limite ?? 20);
            const tipoAccion = typeof req.query.tipoAccion === 'string' ? req.query.tipoAccion : undefined;
            res.status(200).json({ data: await auditoriaUseCase.ejecutar(req.user!.parqueaderoId, { pagina, limite, tipoAccion }) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible consultar la auditoría.' });
        }
    }
}