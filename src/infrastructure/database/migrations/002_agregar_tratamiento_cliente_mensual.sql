ALTER TABLE clientes_mensuales
ADD COLUMN tratamiento ENUM ('SR', 'SRA', 'NEUTRO') NULL AFTER nombre_propietario;