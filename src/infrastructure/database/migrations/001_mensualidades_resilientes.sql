CREATE TABLE
    intenciones_pago_mensualidades (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        parqueadero_id INT UNSIGNED NOT NULL,
        cliente_id INT UNSIGNED NOT NULL,
        fecha_vencimiento_ciclo DATE NOT NULL,
        canal ENUM ('FISICO', 'WHATSAPP') NOT NULL,
        metodo_pago ENUM (
            'EFECTIVO',
            'WOMPI_PSE',
            'WOMPI_TARJETA',
            'WOMPI_BRE_B',
            'NEQUI',
            'DAVIPLATA',
            'OTRO'
        ) NULL,
        monto DECIMAL(10, 2) NOT NULL,
        estado ENUM (
            'PENDIENTE_SELECCION',
            'PENDIENTE_PAGO_DIGITAL',
            'PENDIENTE_PAGO_PRESENCIAL',
            'PENDIENTE_VERIFICACION',
            'PAGADA',
            'RECHAZADA',
            'CANCELADA',
            'EXPIRADA'
        ) NOT NULL,
        referencia_externa VARCHAR(100) NULL,
        fecha_expiracion DATETIME NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parqueadero_id) REFERENCES parqueaderos (id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES clientes_mensuales (id) ON DELETE CASCADE,
        UNIQUE KEY uk_intencion_referencia_externa (referencia_externa),
        UNIQUE KEY uk_intencion_whatsapp_ciclo (cliente_id, fecha_vencimiento_ciclo, canal)
    );

CREATE TABLE
    notificaciones_mensualidades (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        parqueadero_id INT UNSIGNED NOT NULL,
        cliente_id INT UNSIGNED NOT NULL,
        fecha_vencimiento_ciclo DATE NOT NULL,
        tipo ENUM (
            'POR_VENCER_3_DIAS',
            'POR_VENCER_2_DIAS',
            'POR_VENCER_1_DIA',
            'VENCIDA_DIA_1',
            'VENCIDA_DIA_2',
            'VENCIDA_DIA_3',
            'VENCIDA_DIA_4',
            'VENCIDA_DIA_5',
            'RENOVADA'
        ) NOT NULL,
        estado_envio ENUM ('PENDIENTE', 'PROCESANDO', 'ENVIADO', 'FALLIDO') NOT NULL DEFAULT 'PENDIENTE',
        intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
        ultimo_error VARCHAR(500) NULL,
        bloqueado_en DATETIME NULL,
        enviado_en DATETIME NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parqueadero_id) REFERENCES parqueaderos (id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES clientes_mensuales (id) ON DELETE CASCADE,
        UNIQUE KEY uk_notificacion_mensualidad_ciclo (cliente_id, fecha_vencimiento_ciclo, tipo)
    );