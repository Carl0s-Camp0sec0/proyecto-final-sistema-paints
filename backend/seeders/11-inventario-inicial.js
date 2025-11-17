'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Generar inventario para cada sucursal y cada variación de producto
    const inventarioData = [];
    
    // Rangos de stock por tipo de producto
    const stockRangos = {
      accesorios: { min: 20, max: 100 },
      solventes: { min: 30, max: 150 },
      pinturas: { min: 50, max: 200 },
      barnices: { min: 25, max: 80 }
    };

    // Mapeo de productos a categorías
    const productoCategorias = {
      1: 'accesorios', 2: 'accesorios', 3: 'accesorios', 4: 'accesorios', 5: 'accesorios',
      6: 'solventes', 7: 'solventes', 8: 'solventes',
      9: 'pinturas', 10: 'pinturas', 11: 'pinturas', 12: 'pinturas',
      13: 'barnices', 14: 'barnices', 15: 'barnices'
    };

    // Función para generar stock aleatorio
    function generarStock(categoria) {
      const rango = stockRangos[categoria];
      return Math.floor(Math.random() * (rango.max - rango.min + 1)) + rango.min;
    }

    let id = 1;

    // Para cada sucursal (1-6)
    for (let sucursalId = 1; sucursalId <= 6; sucursalId++) {
      // Para cada producto que tiene variaciones
      const productosConVariaciones = [
        // Accesorios (solo unidad)
        { producto_id: 1, unidad_medida_id: 1 },
        { producto_id: 2, unidad_medida_id: 1 },
        { producto_id: 3, unidad_medida_id: 1 },
        { producto_id: 4, unidad_medida_id: 1 },
        { producto_id: 5, unidad_medida_id: 1 },

        // Solventes (5 medidas cada uno)
        ...Array.from({length: 5}, (_, i) => ({ producto_id: 6, unidad_medida_id: i + 2 })),
        ...Array.from({length: 5}, (_, i) => ({ producto_id: 7, unidad_medida_id: i + 2 })),
        ...Array.from({length: 5}, (_, i) => ({ producto_id: 8, unidad_medida_id: i + 2 })),

        // Pinturas (7 medidas cada una)
        ...Array.from({length: 7}, (_, i) => ({ producto_id: 9, unidad_medida_id: i + 7 })),
        ...Array.from({length: 7}, (_, i) => ({ producto_id: 10, unidad_medida_id: i + 7 })),
        ...Array.from({length: 7}, (_, i) => ({ producto_id: 11, unidad_medida_id: i + 7 })),
        ...Array.from({length: 7}, (_, i) => ({ producto_id: 12, unidad_medida_id: i + 7 })),

        // Barnices (5 medidas cada uno)
        ...Array.from({length: 5}, (_, i) => ({ producto_id: 13, unidad_medida_id: i + 14 })),
        ...Array.from({length: 5}, (_, i) => ({ producto_id: 14, unidad_medida_id: i + 14 })),
        ...Array.from({length: 5}, (_, i) => ({ producto_id: 15, unidad_medida_id: i + 14 }))
      ];

      for (const item of productosConVariaciones) {
        const categoria = productoCategorias[item.producto_id];
        const stock = generarStock(categoria);
        
        // Agregar algo de variación entre sucursales
        const variacionSucursal = Math.floor(Math.random() * 21) - 10; // -10 a +10
        const stockFinal = Math.max(0, stock + variacionSucursal);
        
        inventarioData.push({
          id: id++,
          sucursal_id: sucursalId,
          producto_id: item.producto_id,
          unidad_medida_id: item.unidad_medida_id,
          stock_actual: stockFinal,
          stock_reservado: Math.floor(Math.random() * 5), // 0-4 reservado
          fecha_actualizacion: new Date()
        });
      }
    }

    // Insertar en lotes para mejor rendimiento
    const batchSize = 50;
    for (let i = 0; i < inventarioData.length; i += batchSize) {
      const batch = inventarioData.slice(i, i + batchSize);
      await queryInterface.bulkInsert('inventario_sucursal', batch, {
        ignoreDuplicates: true
      });
    }

    console.log(` Inventario inicial creado: ${inventarioData.length} registros`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('inventario_sucursal', null, {});
  }
};