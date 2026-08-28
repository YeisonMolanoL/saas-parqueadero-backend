CREATE TABLE
    configuracion_mensualidades (
        parqueadero_id INT UNSIGNED NOT NULL PRIMARY KEY,
        dias_gracia TINYINT UNSIGNED NOT NULL DEFAULT 3,
        dias_aviso_previo TINYINT UNSIGNED NOT NULL DEFAULT 3,
        dias_aviso_vencido TINYINT UNSIGNED NOT NULL DEFAULT 5,
        hora_envio_whatsapp TIME NOT NULL DEFAULT '09:00:00',
        horas_plazo_pago_presencial TINYINT UNSIGNED NOT NULL DEFAULT 24,
        whatsapp_habilitado BOOLEAN NOT NULL DEFAULT TRUE,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_configuracion_mensualidades_parqueadero FOREIGN KEY (parqueadero_id) REFERENCES parqueaderos (id) ON DELETE CASCADE,
        CONSTRAINT chk_configuracion_mensualidades_gracia CHECK (dias_gracia BETWEEN 0 AND 5),
        CONSTRAINT chk_configuracion_mensualidades_previo CHECK (dias_aviso_previo BETWEEN 0 AND 3),
        CONSTRAINT chk_configuracion_mensualidades_vencido CHECK (dias_aviso_vencido BETWEEN 1 AND 5),
        CONSTRAINT chk_configuracion_mensualidades_plazo CHECK (horas_plazo_pago_presencial BETWEEN 1 AND 72)
    );