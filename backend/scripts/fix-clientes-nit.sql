-- Script SQL para agregar columna NIT a clientes existentes

-- 1. Agregar columna NIT como nullable primero
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nit VARCHAR(20) NULL COMMENT 'NIT del cliente (CF para consumidor final)';

-- 2. Actualizar clientes sin NIT con valores únicos temporales
UPDATE clientes
SET nit = CONCAT('CF-', id)
WHERE nit IS NULL OR nit = '';

-- 3. Hacer la columna NOT NULL y UNIQUE
ALTER TABLE clientes MODIFY COLUMN nit VARCHAR(20) NOT NULL;
ALTER TABLE clientes ADD UNIQUE INDEX IF NOT EXISTS idx_clientes_nit (nit);
