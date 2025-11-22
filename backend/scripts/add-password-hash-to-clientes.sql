-- Migración: Agregar campo password_hash a tabla clientes
-- Fecha: 2025-11-22
-- Descripción: Agrega el campo password_hash para permitir autenticación de clientes

USE paints_db;

-- Agregar columna password_hash a la tabla clientes
ALTER TABLE clientes
ADD COLUMN password_hash VARCHAR(255) NULL
COMMENT 'Hash de la contraseña para autenticación del cliente'
AFTER email;

-- Verificar que la columna fue agregada correctamente
DESCRIBE clientes;

SELECT 'Migración completada: Campo password_hash agregado a tabla clientes' AS mensaje;
