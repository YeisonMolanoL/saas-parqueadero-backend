import type { Request, Response } from 'express';
import { GestionarConfiguracionMensualidadUseCase } from '../../application/use-cases/GestionarConfiguracionMensualidadUseCase.js';
import { MySQLConfiguracionMensualidadRepository } from '../../infrastructure/repositories/MySQLConfiguracionMensualidadRepository.js';

const useCase = new GestionarConfiguracionMensualidadUseCase(new MySQLConfiguracionMensualidadRepository());

export class ConfiguracionMensualidadController {
    static async obtener(req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({ data: await useCase.obtener(req.user!.parqueaderoId) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible consultar la configuración.' });
        }
    }

    static async actualizar(req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({ data: await useCase.actualizar(req.user!.parqueaderoId, req.body) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible actualizar la configuración.' });
        }
    }
}