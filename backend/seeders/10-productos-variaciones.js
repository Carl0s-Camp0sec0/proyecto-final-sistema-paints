'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const variacionesData = [
      // Variaciones para accesorios (solo unidad)
      { producto_id: 1, unidad_medida_id: 1, precio_venta: 25.00, codigo_variacion: 'BRO-1-UND', activo: true },
      { producto_id: 2, unidad_medida_id: 1, precio_venta: 35.00, codigo_variacion: 'BRO-2-UND', activo: true },
      { producto_id: 3, unidad_medida_id: 1, precio_venta: 45.00, codigo_variacion: 'ROD-9-UND', activo: true },
      { producto_id: 4, unidad_medida_id: 1, precio_venta: 15.00, codigo_variacion: 'BAN-STD-UND', activo: true },
      { producto_id: 5, unidad_medida_id: 1, precio_venta: 20.00, codigo_variacion: 'ESP-4-UND', activo: true },

      // Variaciones para solventes (diferentes medidas)
      // Aguarrás Mineral
      { producto_id: 6, unidad_medida_id: 2, precio_venta: 15.00, codigo_variacion: 'AGU-1/32', activo: true }, // 1/32 galón
      { producto_id: 6, unidad_medida_id: 3, precio_venta: 28.00, codigo_variacion: 'AGU-1/16', activo: true }, // 1/16 galón
      { producto_id: 6, unidad_medida_id: 4, precio_venta: 52.00, codigo_variacion: 'AGU-1/8', activo: true },  // 1/8 galón
      { producto_id: 6, unidad_medida_id: 5, precio_venta: 95.00, codigo_variacion: 'AGU-1/4', activo: true },  // 1/4 galón
      { producto_id: 6, unidad_medida_id: 6, precio_venta: 180.00, codigo_variacion: 'AGU-1/2', activo: true }, // 1/2 galón

      // Solvente Limpiador
      { producto_id: 7, unidad_medida_id: 2, precio_venta: 18.00, codigo_variacion: 'LIM-1/32', activo: true },
      { producto_id: 7, unidad_medida_id: 3, precio_venta: 34.00, codigo_variacion: 'LIM-1/16', activo: true },
      { producto_id: 7, unidad_medida_id: 4, precio_venta: 65.00, codigo_variacion: 'LIM-1/8', activo: true },
      { producto_id: 7, unidad_medida_id: 5, precio_venta: 125.00, codigo_variacion: 'LIM-1/4', activo: true },
      { producto_id: 7, unidad_medida_id: 6, precio_venta: 240.00, codigo_variacion: 'LIM-1/2', activo: true },

      // Gas Diluyente
      { producto_id: 8, unidad_medida_id: 2, precio_venta: 20.00, codigo_variacion: 'GAS-1/32', activo: true },
      { producto_id: 8, unidad_medida_id: 3, precio_venta: 38.00, codigo_variacion: 'GAS-1/16', activo: true },
      { producto_id: 8, unidad_medida_id: 4, precio_venta: 72.00, codigo_variacion: 'GAS-1/8', activo: true },
      { producto_id: 8, unidad_medida_id: 5, precio_venta: 140.00, codigo_variacion: 'GAS-1/4', activo: true },
      { producto_id: 8, unidad_medida_id: 6, precio_venta: 270.00, codigo_variacion: 'GAS-1/2', activo: true },

      // Variaciones para pinturas (todas las medidas incluyendo galón y cubeta)
      // Pintura Látex Blanca
      { producto_id: 9, unidad_medida_id: 7, precio_venta: 25.00, codigo_variacion: 'LAT-BLA-1/32', activo: true },
      { producto_id: 9, unidad_medida_id: 8, precio_venta: 48.00, codigo_variacion: 'LAT-BLA-1/16', activo: true },
      { producto_id: 9, unidad_medida_id: 9, precio_venta: 90.00, codigo_variacion: 'LAT-BLA-1/8', activo: true },
      { producto_id: 9, unidad_medida_id: 10, precio_venta: 175.00, codigo_variacion: 'LAT-BLA-1/4', activo: true },
      { producto_id: 9, unidad_medida_id: 11, precio_venta: 340.00, codigo_variacion: 'LAT-BLA-1/2', activo: true },
      { producto_id: 9, unidad_medida_id: 12, precio_venta: 650.00, codigo_variacion: 'LAT-BLA-1GL', activo: true },
      { producto_id: 9, unidad_medida_id: 13, precio_venta: 3000.00, codigo_variacion: 'LAT-BLA-CUB', activo: true },

      // Pintura Látex Beige
      { producto_id: 10, unidad_medida_id: 7, precio_venta: 25.00, codigo_variacion: 'LAT-BEI-1/32', activo: true },
      { producto_id: 10, unidad_medida_id: 8, precio_venta: 48.00, codigo_variacion: 'LAT-BEI-1/16', activo: true },
      { producto_id: 10, unidad_medida_id: 9, precio_venta: 90.00, codigo_variacion: 'LAT-BEI-1/8', activo: true },
      { producto_id: 10, unidad_medida_id: 10, precio_venta: 175.00, codigo_variacion: 'LAT-BEI-1/4', activo: true },
      { producto_id: 10, unidad_medida_id: 11, precio_venta: 340.00, codigo_variacion: 'LAT-BEI-1/2', activo: true },
      { producto_id: 10, unidad_medida_id: 12, precio_venta: 650.00, codigo_variacion: 'LAT-BEI-1GL', activo: true },
      { producto_id: 10, unidad_medida_id: 13, precio_venta: 3000.00, codigo_variacion: 'LAT-BEI-CUB', activo: true },

      // Pintura Acrílica Azul
      { producto_id: 11, unidad_medida_id: 7, precio_venta: 30.00, codigo_variacion: 'ACR-AZU-1/32', activo: true },
      { producto_id: 11, unidad_medida_id: 8, precio_venta: 57.00, codigo_variacion: 'ACR-AZU-1/16', activo: true },
      { producto_id: 11, unidad_medida_id: 9, precio_venta: 110.00, codigo_variacion: 'ACR-AZU-1/8', activo: true },
      { producto_id: 11, unidad_medida_id: 10, precio_venta: 210.00, codigo_variacion: 'ACR-AZU-1/4', activo: true },
      { producto_id: 11, unidad_medida_id: 11, precio_venta: 400.00, codigo_variacion: 'ACR-AZU-1/2', activo: true },
      { producto_id: 11, unidad_medida_id: 12, precio_venta: 780.00, codigo_variacion: 'ACR-AZU-1GL', activo: true },
      { producto_id: 11, unidad_medida_id: 13, precio_venta: 3600.00, codigo_variacion: 'ACR-AZU-CUB', activo: true },

      // Pintura Aceite Roja
      { producto_id: 12, unidad_medida_id: 7, precio_venta: 35.00, codigo_variacion: 'ACE-ROJ-1/32', activo: true },
      { producto_id: 12, unidad_medida_id: 8, precio_venta: 67.00, codigo_variacion: 'ACE-ROJ-1/16', activo: true },
      { producto_id: 12, unidad_medida_id: 9, precio_venta: 130.00, codigo_variacion: 'ACE-ROJ-1/8', activo: true },
      { producto_id: 12, unidad_medida_id: 10, precio_venta: 250.00, codigo_variacion: 'ACE-ROJ-1/4', activo: true },
      { producto_id: 12, unidad_medida_id: 11, precio_venta: 480.00, codigo_variacion: 'ACE-ROJ-1/2', activo: true },
      { producto_id: 12, unidad_medida_id: 12, precio_venta: 920.00, codigo_variacion: 'ACE-ROJ-1GL', activo: true },
      { producto_id: 12, unidad_medida_id: 13, precio_venta: 4200.00, codigo_variacion: 'ACE-ROJ-CUB', activo: true },

      // Variaciones para barnices
      // Barniz Sintético Brillante
      { producto_id: 13, unidad_medida_id: 14, precio_venta: 40.00, codigo_variacion: 'SIN-BRI-1/32', activo: true },
      { producto_id: 13, unidad_medida_id: 15, precio_venta: 76.00, codigo_variacion: 'SIN-BRI-1/16', activo: true },
      { producto_id: 13, unidad_medida_id: 16, precio_venta: 148.00, codigo_variacion: 'SIN-BRI-1/8', activo: true },
      { producto_id: 13, unidad_medida_id: 17, precio_venta: 290.00, codigo_variacion: 'SIN-BRI-1/4', activo: true },
      { producto_id: 13, unidad_medida_id: 18, precio_venta: 560.00, codigo_variacion: 'SIN-BRI-1/2', activo: true },

      // Barniz Acrílico Mate
      { producto_id: 14, unidad_medida_id: 14, precio_venta: 38.00, codigo_variacion: 'ACR-MAT-1/32', activo: true },
      { producto_id: 14, unidad_medida_id: 15, precio_venta: 72.00, codigo_variacion: 'ACR-MAT-1/16', activo: true },
      { producto_id: 14, unidad_medida_id: 16, precio_venta: 140.00, codigo_variacion: 'ACR-MAT-1/8', activo: true },
      { producto_id: 14, unidad_medida_id: 17, precio_venta: 275.00, codigo_variacion: 'ACR-MAT-1/4', activo: true },
      { producto_id: 14, unidad_medida_id: 18, precio_venta: 530.00, codigo_variacion: 'ACR-MAT-1/2', activo: true },

      // Barniz Marino
      { producto_id: 15, unidad_medida_id: 14, precio_venta: 55.00, codigo_variacion: 'MAR-BRI-1/32', activo: true },
      { producto_id: 15, unidad_medida_id: 15, precio_venta: 105.00, codigo_variacion: 'MAR-BRI-1/16', activo: true },
      { producto_id: 15, unidad_medida_id: 16, precio_venta: 205.00, codigo_variacion: 'MAR-BRI-1/8', activo: true },
      { producto_id: 15, unidad_medida_id: 17, precio_venta: 400.00, codigo_variacion: 'MAR-BRI-1/4', activo: true },
      { producto_id: 15, unidad_medida_id: 18, precio_venta: 780.00, codigo_variacion: 'MAR-BRI-1/2', activo: true }
    ];

    // Insertar en lotes para evitar problemas de memoria
    const batchSize = 20;
    for (let i = 0; i < variacionesData.length; i += batchSize) {
      const batch = variacionesData.slice(i, i + batchSize).map((item, index) => ({
        id: i + index + 1,
        ...item,
        fecha_creacion: new Date()
      }));
      
      await queryInterface.bulkInsert('productos_variaciones', batch, {
        ignoreDuplicates: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('productos_variaciones', null, {});
  }
};