import type { Request, Response } from 'express';
import { GestionarCalendarioHabilUseCase } from '../../application/use-cases/GestionarCalendarioHabilUseCase.js';
import { MySQLCalendarioHabilRepository } from '../../infrastructure/repositories/MySQLCalendarioHabilRepository.js';

const useCase = new GestionarCalendarioHabilUseCase(new MySQLCalendarioHabilRepository());

export class CalendarioHabilController {
    static async listar(req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({ data: await useCase.listar(req.user!.parqueaderoId) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible consultar el calendario.' });
        }
    }

    static async agregar(req: Request, res: Response): Promise<void> {
        try {
            const diaNoHabil = await useCase.agregar(req.user!.parqueaderoId, String(req.body.fecha ?? ''), String(req.body.motivo ?? ''));
            res.status(201).json({ data: diaNoHabil });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible registrar el día no hábil.' });
        }
    }

    static async eliminar(req: Request, res: Response): Promise<void> {
        try {
            await useCase.eliminar(req.user!.parqueaderoId, Number(req.params.id));
            res.status(204).send();
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible eliminar el día no hábil.' });
        }
    }
}