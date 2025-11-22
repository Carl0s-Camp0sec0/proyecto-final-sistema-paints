'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const facturasData = [];
    const detallesData = [];
    const pagosData = [];

    // Configuración
    const diasHistorico = 60; // Generar facturas de los últimos 60 días
    const facturasMin = 3; // Mínimo de facturas por día
    const facturasMax = 8; // Máximo de facturas por día

    // IDs disponibles
    const sucursales = [1, 2, 3, 4, 5, 6];
    const clientes = [1, 2, 3, 4, 5, 6, 7, 8];
    const usuarios = [1, 2, 3]; // Usuarios del seeder
    const mediosPago = [1, 2, 3, 4]; // Efectivo, Cheque, Tarjeta, Transferencia

    // Productos con precios (basados en el seeder de productos)
    const productos = [
      { id: 1, precio: 25.00, unidad_medida_id: 1 },   // Brocha 1"
      { id: 2, precio: 35.00, unidad_medida_id: 1 },   // Brocha 2"
      { id: 3, precio: 45.00, unidad_medida_id: 1 },   // Rodillo 9"
      { id: 4, precio: 55.00, unidad_medida_id: 1 },   // Espátula
      { id: 5, precio: 15.00, unidad_medida_id: 1 },   // Lija
      { id: 6, precio: 350.00, unidad_medida_id: 2 },  // Pintura Látex GL
      { id: 7, precio: 95.00, unidad_medida_id: 3 },   // Pintura Látex L
      { id: 8, precio: 420.00, unidad_medida_id: 2 },  // Pintura Aceite GL
      { id: 9, precio: 110.00, unidad_medida_id: 3 },  // Pintura Aceite L
      { id: 10, precio: 280.00, unidad_medida_id: 2 }, // Thinner GL
      { id: 11, precio: 75.00, unidad_medida_id: 3 },  // Thinner L
      { id: 12, precio: 320.00, unidad_medida_id: 2 }, // Barniz GL
      { id: 13, precio: 85.00, unidad_medida_id: 3 },  // Barniz L
      { id: 14, precio: 180.00, unidad_medida_id: 2 }, // Sellador GL
      { id: 15, precio: 50.00, unidad_medida_id: 3 }   // Sellador L
    ];

    let facturaId = 1;
    let detalleId = 1;
    let pagoId = 1;
    let correlativosPorSerie = {
      1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1
    };

    // Generar facturas para cada día
    for (let dia = diasHistorico; dia >= 0; dia--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - dia);
      fecha.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60), 0, 0);

      // Número aleatorio de facturas por día
      const numFacturas = Math.floor(Math.random() * (facturasMax - facturasMin + 1)) + facturasMin;

      for (let f = 0; f < numFacturas; f++) {
        const sucursal_id = sucursales[Math.floor(Math.random() * sucursales.length)];
        const cliente_id = clientes[Math.floor(Math.random() * clientes.length)];
        const usuario_id = usuarios[Math.floor(Math.random() * usuarios.length)];
        const serie_factura_id = sucursal_id; // Serie corresponde a sucursal

        // Calcular correlativo para esta serie
        const numero_correlativo = correlativosPorSerie[serie_factura_id]++;

        // Determinar letra de serie (A para todas las sucursales según seeder)
        const letra_serie = 'A';

        // Determinar número de productos en la factura (1-5)
        const numProductos = Math.floor(Math.random() * 5) + 1;

        let subtotal = 0;
        const detallesFactura = [];

        // Generar detalles de la factura
        for (let p = 0; p < numProductos; p++) {
          const producto = productos[Math.floor(Math.random() * productos.length)];
          const cantidad = Math.floor(Math.random() * 5) + 1; // 1-5 unidades
          const precio_unitario = producto.precio;
          const descuento_porcentaje = Math.random() < 0.2 ? 5 : 0; // 20% de chance de descuento
          const subtotal_linea = cantidad * precio_unitario * (1 - descuento_porcentaje / 100);

          subtotal += subtotal_linea;

          detallesFactura.push({
            id: detalleId++,
            factura_id: facturaId,
            producto_id: producto.id,
            unidad_medida_id: producto.unidad_medida_id,
            cantidad: cantidad,
            precio_unitario: precio_unitario,
            descuento_porcentaje: descuento_porcentaje,
            subtotal: Number(subtotal_linea.toFixed(2)),
            fecha_creacion: fecha
          });
        }

        // Calcular descuento e impuestos
        const descuento_factura = Math.random() < 0.1 ? subtotal * 0.05 : 0; // 10% de chance de descuento adicional
        const impuestos = 0; // Sin impuestos por ahora
        const total = subtotal - descuento_factura + impuestos;

        // Crear factura
        facturasData.push({
          id: facturaId,
          numero_correlativo: numero_correlativo,
          letra_serie: letra_serie,
          serie_factura_id: serie_factura_id,
          cliente_id: cliente_id,
          sucursal_id: sucursal_id,
          usuario_id: usuario_id,
          cotizacion_id: null,
          subtotal: Number(subtotal.toFixed(2)),
          descuento: Number(descuento_factura.toFixed(2)),
          impuestos: Number(impuestos.toFixed(2)),
          total: Number(total.toFixed(2)),
          estado: 'activa',
          fecha_anulacion: null,
          motivo_anulacion: null,
          observaciones: null,
          fecha_creacion: fecha
        });

        // Agregar detalles a la lista principal
        detallesData.push(...detallesFactura);

        // Crear pago(s) para la factura
        // 80% pagos únicos, 20% pagos combinados
        if (Math.random() < 0.8) {
          // Pago único
          const medio_pago_id = mediosPago[Math.floor(Math.random() * mediosPago.length)];
          pagosData.push({
            id: pagoId++,
            factura_id: facturaId,
            medio_pago_id: medio_pago_id,
            monto: Number(total.toFixed(2)),
            referencia: medio_pago_id === 2 ? `CHQ-${Math.floor(Math.random() * 10000)}` : null,
            observaciones: null,
            fecha_creacion: fecha
          });
        } else {
          // Pago combinado (2 medios de pago)
          const monto1 = Number((total * 0.6).toFixed(2));
          const monto2 = Number((total - monto1).toFixed(2));

          pagosData.push({
            id: pagoId++,
            factura_id: facturaId,
            medio_pago_id: mediosPago[0], // Efectivo
            monto: monto1,
            referencia: null,
            observaciones: null,
            fecha_creacion: fecha
          });

          pagosData.push({
            id: pagoId++,
            factura_id: facturaId,
            medio_pago_id: mediosPago[2], // Tarjeta
            monto: monto2,
            referencia: `TRX-${Math.floor(Math.random() * 100000)}`,
            observaciones: null,
            fecha_creacion: fecha
          });
        }

        facturaId++;
      }
    }

    // Insertar datos en la base de datos
    await queryInterface.bulkInsert('facturas', facturasData, {
      ignoreDuplicates: true
    });

    await queryInterface.bulkInsert('facturas_detalle', detallesData, {
      ignoreDuplicates: true
    });

    await queryInterface.bulkInsert('facturas_pagos', pagosData, {
      ignoreDuplicates: true
    });

    console.log(`✅ Seeder ejecutado exitosamente:`);
    console.log(`   - ${facturasData.length} facturas creadas`);
    console.log(`   - ${detallesData.length} detalles de factura creados`);
    console.log(`   - ${pagosData.length} pagos creados`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('facturas_pagos', null, {});
    await queryInterface.bulkDelete('facturas_detalle', null, {});
    await queryInterface.bulkDelete('facturas', null, {});
  }
};
