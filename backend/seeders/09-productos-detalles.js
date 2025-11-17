'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Detalles para accesorios
    const detallesAccesoriosData = [
      {
        id: 1,
        producto_id: 1, // Brocha de 1"
        tamano: '1"',
        material: 'Cerda natural',
        peso: 0.08,
        fecha_creacion: new Date()
      },
      {
        id: 2,
        producto_id: 2, // Brocha de 2"
        tamano: '2"',
        material: 'Cerda natural',
        peso: 0.12,
        fecha_creacion: new Date()
      },
      {
        id: 3,
        producto_id: 3, // Rodillo de 9"
        tamano: '9"',
        material: 'Fibra sintética',
        peso: 0.25,
        fecha_creacion: new Date()
      },
      {
        id: 4,
        producto_id: 4, // Bandeja para Rodillo
        tamano: 'Estándar',
        material: 'Plástico ABS',
        peso: 0.15,
        fecha_creacion: new Date()
      },
      {
        id: 5,
        producto_id: 5, // Espátula 4"
        tamano: '4"',
        material: 'Acero inoxidable',
        peso: 0.18,
        fecha_creacion: new Date()
      }
    ];

    // Detalles para pinturas y barnices
    const detallesPinturaData = [
      {
        id: 1,
        producto_id: 9, // Pintura Látex Blanca
        duracion_anos: 5,
        cobertura_m2: 12.5,
        color: 'Blanco',
        codigo_color: '#FFFFFF',
        tipo_base: 'agua',
        acabado: 'mate',
        fecha_creacion: new Date()
      },
      {
        id: 2,
        producto_id: 10, // Pintura Látex Beige
        duracion_anos: 5,
        cobertura_m2: 12.5,
        color: 'Beige',
        codigo_color: '#F5F5DC',
        tipo_base: 'agua',
        acabado: 'mate',
        fecha_creacion: new Date()
      },
      {
        id: 3,
        producto_id: 11, // Pintura Acrílica Azul
        duracion_anos: 7,
        cobertura_m2: 15.0,
        color: 'Azul Cielo',
        codigo_color: '#87CEEB',
        tipo_base: 'agua',
        acabado: 'semi_mate',
        fecha_creacion: new Date()
      },
      {
        id: 4,
        producto_id: 12, // Pintura Aceite Roja
        duracion_anos: 8,
        cobertura_m2: 18.0,
        color: 'Rojo Intenso',
        codigo_color: '#FF0000',
        tipo_base: 'aceite',
        acabado: 'brillante',
        fecha_creacion: new Date()
      },
      {
        id: 5,
        producto_id: 13, // Barniz Sintético Brillante
        duracion_anos: 10,
        cobertura_m2: 20.0,
        color: 'Transparente',
        codigo_color: null,
        tipo_base: 'aceite',
        acabado: 'brillante',
        fecha_creacion: new Date()
      },
      {
        id: 6,
        producto_id: 14, // Barniz Acrílico Mate
        duracion_anos: 8,
        cobertura_m2: 18.0,
        color: 'Transparente',
        codigo_color: null,
        tipo_base: 'agua',
        acabado: 'mate',
        fecha_creacion: new Date()
      },
      {
        id: 7,
        producto_id: 15, // Barniz Marino
        duracion_anos: 12,
        cobertura_m2: 22.0,
        color: 'Transparente',
        codigo_color: null,
        tipo_base: 'aceite',
        acabado: 'brillante',
        fecha_creacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('productos_detalles_accesorio', detallesAccesoriosData, {
      ignoreDuplicates: true
    });

    await queryInterface.bulkInsert('productos_detalles_pintura', detallesPinturaData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('productos_detalles_accesorio', null, {});
    await queryInterface.bulkDelete('productos_detalles_pintura', null, {});
  }
};