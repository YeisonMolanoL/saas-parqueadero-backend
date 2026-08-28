ALTER TABLE clientes_mensuales
DROP INDEX usuario_id,
DROP INDEX idx_cron_vencimientos,
DROP COLUMN estado_notificacion,
ADD INDEX idx_clientes_mensuales_vencimiento (fecha_vencimiento, estado);

ALTER TABLE pagos_mensualidades MODIFY COLUMN turno_caja_id INT UNSIGNED NULL,
ADD COLUMN periodo_pagado_inicio DATE NULL AFTER canal,
ADD COLUMN periodo_pagado_fin DATE NULL AFTER periodo_pagado_inicio,
ADD COLUMN idempotency_key VARCHAR(64) NULL AFTER transaccion_id;

UPDATE pagos_mensualidades
SET
    periodo_pagado_inicio = DATE (fecha_pago),
    periodo_pagado_fin = DATE (fecha_pago),
    idempotency_key = CONCAT ('legado-', id)
WHERE
    periodo_pagado_inicio IS NULL;

ALTER TABLE pagos_mensualidades MODIFY COLUMN periodo_pagado_inicio DATE NOT NULL,
MODIFY COLUMN periodo_pagado_fin DATE NOT NULL,
MODIFY COLUMN idempotency_key VARCHAR(64) NOT NULL,
ADD UNIQUE KEY uk_pagos_mensualidades_idempotencia (idempotency_key),
ADD UNIQUE KEY uk_pagos_mensualidades_periodo (cliente_id, periodo_pagado_inicio),
ADD CONSTRAINT fk_pagos_mensualidades_turno FOREIGN KEY (turno_caja_id) REFERENCES turnos_caja (id);

ALTER TABLE intenciones_pago_mensualidades
ADD COLUMN pago_mensualidad_id INT UNSIGNED NULL AFTER referencia_externa,
ADD CONSTRAINT fk_intenciones_pago_mensualidad_pago FOREIGN KEY (pago_mensualidad_id) REFERENCES pagos_mensualidades (id),
ADD INDEX idx_intenciones_pago_mensualidad_estado (estado, fecha_expiracion);

ALTER TABLE notificaciones_mensualidades ADD INDEX idx_notificaciones_mensuales_pendientes (estado_envio, intentos, creado_en);