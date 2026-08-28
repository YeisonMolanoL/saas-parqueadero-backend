CREATE TABLE
    IF NOT EXISTS suscripciones_parqueadero (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        parqueadero_id INT UNSIGNED NOT NULL,
        plan_id TINYINT UNSIGNED NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_vencimiento DATE NOT NULL,
        monto_pagado DECIMAL(10, 2) UNSIGNED NOT NULL,
        metodo_pago ENUM (
            'WOMPI_PSE',
            'WOMPI_TARJETA',
            'WOMPI_BRE_B',
            'NEQUI',
            'TRANSFERENCIA'
        ) NOT NULL,
        transaccion_id VARCHAR(100) NOT NULL,
        estado_pago ENUM ('APROBADO', 'PENDIENTE', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_suscripcion_parqueadero FOREIGN KEY (parqueadero_id) REFERENCES parqueaderos (id),
        CONSTRAINT fk_suscripcion_plan FOREIGN KEY (plan_id) REFERENCES planes_saas (id),
        UNIQUE KEY uk_suscripcion_transaccion (transaccion_id),
        INDEX idx_suscripcion_parqueadero_vencimiento (parqueadero_id, fecha_vencimiento)
    );