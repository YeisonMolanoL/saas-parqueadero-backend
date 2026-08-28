import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql, { type RowDataPacket } from 'mysql2/promise';

dotenv.config();

interface MigrationRow extends RowDataPacket {
    nombre: string;
    checksum: string;
}

const migrationsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../src/infrastructure/database/migrations');
const migrationDatabase = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'parqueadero_saas_db',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true,
    timezone: '-05:00',
    dateStrings: true
});

const ejecutar = async (): Promise<void> => {
    const connection = await migrationDatabase;
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL UNIQUE,
                checksum CHAR(64) NOT NULL,
                aplicado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        const [lockRows] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK('saas_parqueadero_migrations', 60) AS lock_acquired");
        if (lockRows[0]?.lock_acquired !== 1) {
            throw new Error('No fue posible adquirir el bloqueo de migraciones.');
        }

        const archivos = (await readdir(migrationsDirectory))
            .filter((archivo) => archivo.endsWith('.sql'))
            .sort();
        const [aplicadas] = await connection.query<MigrationRow[]>('SELECT nombre, checksum FROM schema_migrations');
        const historial = new Map(aplicadas.map((migracion) => [migracion.nombre, migracion.checksum]));

        for (const archivo of archivos) {
            const contenido = await readFile(join(migrationsDirectory, archivo), 'utf8');
            const checksum = createHash('sha256').update(contenido).digest('hex');
            const checksumAnterior = historial.get(archivo);
            if (checksumAnterior === checksum) continue;
            if (checksumAnterior) {
                throw new Error(`La migración ${archivo} fue modificada después de aplicarse.`);
            }

            await connection.query(contenido);
            await connection.execute(
                'INSERT INTO schema_migrations (nombre, checksum) VALUES (?, ?)',
                [archivo, checksum]
            );
            console.log(`Migración aplicada: ${archivo}`);
        }
    } finally {
        await connection.query("SELECT RELEASE_LOCK('saas_parqueadero_migrations')");
        await connection.end();
    }
};

ejecutar().catch((error: unknown) => {
    console.error('Error al ejecutar migraciones:', error);
    process.exitCode = 1;
});
