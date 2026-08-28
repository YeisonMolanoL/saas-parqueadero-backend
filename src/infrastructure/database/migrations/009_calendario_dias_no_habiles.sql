CREATE TABLE
    dias_no_habiles_parqueadero (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        parqueadero_id INT UNSIGNED NOT NULL,
        fecha DATE NOT NULL,
        motivo VARCHAR(100) NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_dias_no_habiles_parqueadero FOREIGN KEY (parqueadero_id) REFERENCES parqueaderos (id) ON DELETE CASCADE,
        UNIQUE KEY uk_dias_no_habiles_parqueadero_fecha (parqueadero_id, fecha)
    );