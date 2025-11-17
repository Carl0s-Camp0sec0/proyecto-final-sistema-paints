'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const productosData = [
      // ACCESORIOS
      {
        id: 1,
        categoria_id: 1, // Accesorios
        nombre: 'Brocha de 1"',
        marca: 'Pincel Pro',
        descripcion: 'Brocha de cerda natural de 1 pulgada, ideal para detalles',
        codigo_producto: 'ACC-BRO-001',
        precio_base: 25.00,
        descuento_porcentaje: 0,
        stock_minimo: 50,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 2,
        categoria_id: 1,
        nombre: 'Brocha de 2"',
        marca: 'Pincel Pro',
        descripcion: 'Brocha de cerda natural de 2 pulgadas',
        codigo_producto: 'ACC-BRO-002',
        precio_base: 35.00,
        descuento_porcentaje: 0,
        stock_minimo: 40,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 3,
        categoria_id: 1,
        nombre: 'Rodillo de 9"',
        marca: 'RodilloMax',
        descripcion: 'Rodillo de 9 pulgadas con mango incluido',
        codigo_producto: 'ACC-ROD-001',
        precio_base: 45.00,
        descuento_porcentaje: 5.00,
        stock_minimo: 30,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 4,
        categoria_id: 1,
        nombre: 'Bandeja para Rodillo',
        marca: 'PaintTools',
        descripcion: 'Bandeja plástica para rodillo, fácil limpieza',
        codigo_producto: 'ACC-BAN-001',
        precio_base: 15.00,
        descuento_porcentaje: 0,
        stock_minimo: 25,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 5,
        categoria_id: 1,
        nombre: 'Espátula 4"',
        marca: 'ToolMaster',
        descripcion: 'Espátula de acero inoxidable de 4 pulgadas',
        codigo_producto: 'ACC-ESP-001',
        precio_base: 20.00,
        descuento_porcentaje: 0,
        stock_minimo: 20,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },

      // SOLVENTES
      {
        id: 6,
        categoria_id: 2, // Solventes
        nombre: 'Aguarrás Mineral',
        marca: 'ChemClean',
        descripcion: 'Aguarrás mineral puro para limpieza de brochas',
        codigo_producto: 'SOL-AGU-001',
        precio_base: 15.00, // Precio base por 1/32 galón
        descuento_porcentaje: 0,
        stock_minimo: 100,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 7,
        categoria_id: 2,
        nombre: 'Solvente Limpiador',
        marca: 'CleanMax',
        descripcion: 'Solvente multiuso para limpieza de herramientas',
        codigo_producto: 'SOL-LIM-001',
        precio_base: 18.00,
        descuento_porcentaje: 0,
        stock_minimo: 80,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 8,
        categoria_id: 2,
        nombre: 'Gas Diluyente',
        marca: 'ThinnerPro',
        descripcion: 'Gas diluyente para pinturas base aceite',
        codigo_producto: 'SOL-GAS-001',
        precio_base: 20.00,
        descuento_porcentaje: 0,
        stock_minimo: 60,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },

      // PINTURAS
      {
        id: 9,
        categoria_id: 3, // Pinturas
        nombre: 'Pintura Látex Blanca',
        marca: 'ColorMax',
        descripcion: 'Pintura látex lavable, acabado mate',
        codigo_producto: 'PIN-LAT-001',
        precio_base: 25.00, // Precio base por 1/32 galón
        descuento_porcentaje: 10.00,
        stock_minimo: 200,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 10,
        categoria_id: 3,
        nombre: 'Pintura Látex Beige',
        marca: 'ColorMax',
        descripcion: 'Pintura látex lavable, acabado mate, color beige',
        codigo_producto: 'PIN-LAT-002',
        precio_base: 25.00,
        descuento_porcentaje: 10.00,
        stock_minimo: 150,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 11,
        categoria_id: 3,
        nombre: 'Pintura Acrílica Azul',
        marca: 'AcrylicPro',
        descripcion: 'Pintura acrílica de alta calidad, color azul cielo',
        codigo_producto: 'PIN-ACR-001',
        precio_base: 30.00,
        descuento_porcentaje: 5.00,
        stock_minimo: 120,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 12,
        categoria_id: 3,
        nombre: 'Pintura Aceite Roja',
        marca: 'OilPaint',
        descripcion: 'Pintura base aceite, rojo intenso',
        codigo_producto: 'PIN-ACE-001',
        precio_base: 35.00,
        descuento_porcentaje: 0,
        stock_minimo: 80,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },

      // BARNICES
      {
        id: 13,
        categoria_id: 4, // Barnices
        nombre: 'Barniz Sintético Brillante',
        marca: 'ShineCoat',
        descripcion: 'Barniz sintético transparente, acabado brillante',
        codigo_producto: 'BAR-SIN-001',
        precio_base: 40.00,
        descuento_porcentaje: 0,
        stock_minimo: 60,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 14,
        categoria_id: 4,
        nombre: 'Barniz Acrílico Mate',
        marca: 'AcrylicShield',
        descripcion: 'Barniz acrílico al agua, acabado mate',
        codigo_producto: 'BAR-ACR-001',
        precio_base: 38.00,
        descuento_porcentaje: 0,
        stock_minimo: 50,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 15,
        categoria_id: 4,
        nombre: 'Barniz Marino',
        marca: 'MarineCoat',
        descripcion: 'Barniz especial resistente a la humedad',
        codigo_producto: 'BAR-MAR-001',
        precio_base: 55.00,
        descuento_porcentaje: 0,
        stock_minimo: 40,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('productos', productosData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('productos', null, {});
  }
};