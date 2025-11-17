// Configuración para seeders
module.exports = {
  // Datos de ubicaciones GPS de Guatemala
  sucursales: {
    'Pradera Chimaltenango': { lat: 14.6349, lng: -90.8188 },
    'Pradera Escuintla': { lat: 14.3058, lng: -90.7856 },
    'Las Américas Mazatenango': { lat: 14.5342, lng: -91.5036 },
    'La Trinidad Coatepeque': { lat: 14.7042, lng: -91.8656 },
    'Pradera Xela Quetzaltenango': { lat: 14.8344, lng: -91.5186 },
    'Centro Comercial Miraflores': { lat: 14.6118, lng: -90.5328 }
  },
  
  // Colores disponibles para pinturas
  colores: [
    { nombre: 'Blanco', codigo: '#FFFFFF' },
    { nombre: 'Negro', codigo: '#000000' },
    { nombre: 'Rojo', codigo: '#FF0000' },
    { nombre: 'Azul', codigo: '#0000FF' },
    { nombre: 'Verde', codigo: '#008000' },
    { nombre: 'Amarillo', codigo: '#FFFF00' },
    { nombre: 'Gris', codigo: '#808080' },
    { nombre: 'Beige', codigo: '#F5F5DC' },
    { nombre: 'Café', codigo: '#8B4513' },
    { nombre: 'Celeste', codigo: '#87CEEB' },
    { nombre: 'Verde Oliva', codigo: '#808000' },
    { nombre: 'Naranja', codigo: '#FFA500' }
  ],

  // Usuarios por defecto
  usuarios: {
    admin: {
      password: 'admin123',
      email: 'admin@paints.com'
    },
    digitador: {
      password: 'digitador123',
      email: 'digitador@paints.com'
    },
    cajero: {
      password: 'cajero123', 
      email: 'cajero@paints.com'
    },
    gerente: {
      password: 'gerente123',
      email: 'gerente@paints.com'
    }
  }
};