import type { Request, Response } from 'express';
import { GestionarMiPerfilUseCase } from '../../application/use-cases/GestionarMiPerfilUseCase.js';
import { MySQLParqueaderoRepository } from '../../infrastructure/repositories/MySQLParqueaderoRepository.js';
import { MySQLUsuarioRepository } from '../../infrastructure/repositories/MySQLUsuarioRepository.js';
import { MySQLPlanSaasRepository } from '../../infrastructure/repositories/MySQLPlanSaasRepository.js';
import { MySQLTurnoRepository } from '../../infrastructure/repositories/MySQLTurnoRepository.js';
import type { IActualizarAdministradorPropioDTO, IActualizarParqueaderoPropioDTO } from '../../domain/types/miPerfil.types.js';
import type { IRenovarSuscripcionParqueaderoDTO } from '../../domain/types/parqueadero.types.js';

const useCase = new GestionarMiPerfilUseCase(
    new MySQLParqueaderoRepository(),
    new MySQLUsuarioRepository(),
    new MySQLPlanSaasRepository(),
    new MySQLTurnoRepository()
);

export class MiPerfilController {
    static async parqueaderoPropio(req: Request, res: Response): Promise<void> {
        try {
            const parqueaderoId = MiPerfilController.parqueaderoId(req);
            res.status(200).json({ data: await useCase.obtenerParqueaderoPropio(parqueaderoId) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible consultar el parqueadero.' });
        }
    }

    static async actualizarParqueadero(req: Request, res: Response): Promise<void> {
        try {
            const parqueaderoId = MiPerfilController.parqueaderoId(req);
            await useCase.actualizarParqueaderoPropio(parqueaderoId, req.body as IActualizarParqueaderoPropioDTO);
            res.status(200).json({ mensaje: 'Datos del parqueadero actualizados.' });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible actualizar el parqueadero.' });
        }
    }

    static async administradorPropio(req: Request, res: Response): Promise<void> {
        try {
            const parqueaderoId = MiPerfilController.parqueaderoId(req);
            res.status(200).json({ data: await useCase.obtenerAdministradorPropio(parqueaderoId, req.user!.usuarioId) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible consultar los datos del administrador.' });
        }
    }

    static async actualizarAdministrador(req: Request, res: Response): Promise<void> {
        try {
            const parqueaderoId = MiPerfilController.parqueaderoId(req);
            const administrador = await useCase.actualizarAdministradorPropio(
                parqueaderoId,
                req.user!.usuarioId,
                req.body as IActualizarAdministradorPropioDTO
            );
            res.status(200).json({ mensaje: 'Datos personales actualizados.', data: administrador });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible actualizar los datos personales.' });
        }
    }

    static async planes(_req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({ data: await useCase.listarPlanes() });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible listar los planes.' });
        }
    }

    static async pagos(req: Request, res: Response): Promise<void> {
        try {
            const parqueaderoId = MiPerfilController.parqueaderoId(req);
            res.status(200).json({ data: await useCase.listarPagos(parqueaderoId) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible consultar el historial de pagos.' });
        }
    }

    static async turnos(req: Request, res: Response): Promise<void> {
        try {
            const parqueaderoId = MiPerfilController.parqueaderoId(req);
            res.status(200).json({ data: await useCase.listarTurnos(parqueaderoId) });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible consultar el historial de turnos.' });
        }
    }

    static async mejorarPlan(req: Request, res: Response): Promise<void> {
        try {
            const parqueaderoId = MiPerfilController.parqueaderoId(req);
            const suscripcionId = await useCase.mejorarPlan(
                parqueaderoId,
                req.user!.usuarioId,
                req.body as IRenovarSuscripcionParqueaderoDTO
            );
            res.status(201).json({ mensaje: 'Plan actualizado correctamente.', data: { suscripcionId } });
        } catch (error: unknown) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'No fue posible mejorar el plan.' });
        }
    }

    private static parqueaderoId(req: Request): number {
        const parqueaderoId = req.user?.parqueaderoId ?? 0;
        if (!Number.isInteger(parqueaderoId) || parqueaderoId <= 0) {
            throw new TypeError('La operación requiere un parqueadero asignado.');
        }
        return parqueaderoId;
    }
}
