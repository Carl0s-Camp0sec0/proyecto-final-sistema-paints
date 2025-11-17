const fs = require('fs').promises;
const path = require('path');

class AuditMiddleware {
  // Middleware para registrar acciones del usuario
  static async registrarAccion(accion, descripcion = '') {
    return async (req, res, next) => {
      // Guardar información original
      const originalSend = res.send;
      const originalJson = res.json;
      
      // Datos de la acción
      const datosAuditoria = {
        timestamp: new Date().toISOString(),
        usuario_id: req.usuario?.id || null,
        usuario_email: req.usuario?.email || null,
        usuario_rol: req.usuario?.rol || null,
        accion,
        descripcion,
        ip: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent') || null,
        metodo: req.method,
        url: req.originalUrl,
        body: AuditMiddleware.sanitizarDatos(req.body),
        params: req.params,
        query: req.query
      };

      // Interceptar respuesta para obtener código de estado
      res.send = function(body) {
        datosAuditoria.status_code = res.statusCode;
        datosAuditoria.success = res.statusCode < 400;
        AuditMiddleware.guardarLog(datosAuditoria);
        originalSend.call(this, body);
      };

      res.json = function(body) {
        datosAuditoria.status_code = res.statusCode;
        datosAuditoria.success = res.statusCode < 400;
        datosAuditoria.response_body = AuditMiddleware.sanitizarDatos(body);
        AuditMiddleware.guardarLog(datosAuditoria);
        originalJson.call(this, body);
      };

      next();
    };
  }

  // Sanitizar datos sensibles
  static sanitizarDatos(datos) {
    if (!datos || typeof datos !== 'object') return datos;

    const copia = JSON.parse(JSON.stringify(datos));
    const camposSensibles = ['password', 'password_hash', 'token', 'authorization'];

    const sanitizar = (obj) => {
      for (const key in obj) {
        if (camposSensibles.some(campo => key.toLowerCase().includes(campo))) {
          obj[key] = '[REDACTADO]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizar(obj[key]);
        }
      }
    };

    sanitizar(copia);
    return copia;
  }

  // Guardar log en archivo
  static async guardarLog(datos) {
    try {
      const fechaArchivo = new Date().toISOString().split('T')[0];
      const nombreArchivo = `audit_${fechaArchivo}.log`;
      const rutaArchivo = path.join(process.cwd(), 'logs', nombreArchivo);

      // Crear directorio logs si no existe
      await fs.mkdir(path.dirname(rutaArchivo), { recursive: true });

      const linea = JSON.stringify(datos) + '\n';
      await fs.appendFile(rutaArchivo, linea);

    } catch (error) {
      console.error('Error guardando log de auditoría:', error);
    }
  }

  // Middleware específicos por acción
  static login() {
    return AuditMiddleware.registrarAccion('LOGIN', 'Intento de inicio de sesión');
  }

  static logout() {
    return AuditMiddleware.registrarAccion('LOGOUT', 'Cierre de sesión');
  }

  static crearProducto() {
    return AuditMiddleware.registrarAccion('CREAR_PRODUCTO', 'Creación de producto');
  }

  static actualizarProducto() {
    return AuditMiddleware.registrarAccion('ACTUALIZAR_PRODUCTO', 'Actualización de producto');
  }

  static eliminarProducto() {
    return AuditMiddleware.registrarAccion('ELIMINAR_PRODUCTO', 'Eliminación de producto');
  }

  static crearFactura() {
    return AuditMiddleware.registrarAccion('CREAR_FACTURA', 'Creación de factura');
  }

  static anularFactura() {
    return AuditMiddleware.registrarAccion('ANULAR_FACTURA', 'Anulación de factura');
  }

  static ajustarStock() {
    return AuditMiddleware.registrarAccion('AJUSTAR_STOCK', 'Ajuste de inventario');
  }
}

module.exports = AuditMiddleware;