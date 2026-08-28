ALTER TABLE parqueaderos
ADD COLUMN fecha_fin_prueba DATE NULL AFTER telefono_contacto;

UPDATE parqueaderos
SET
    fecha_fin_prueba = DATE_ADD (creado_en, INTERVAL 30 DAY)
WHERE
    estado = 'PRUEBA_GRATUITA'
    AND fecha_fin_prueba IS NULL;