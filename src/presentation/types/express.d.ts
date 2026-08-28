declare namespace Express {
    export interface Request {
        user?: {
            usuarioId: number;
            parqueaderoId: number;
            rolId: number;
            rolNombre: 'SUPER_ADMIN' | 'ADMIN_PARQUEADERO' | 'OPERARIO' | 'CLIENTE';
        };
    }
}