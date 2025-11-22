# Instrucciones para Implementar el Logo de la Empresa

## Ubicación del Logo

Coloca el archivo del logo de tu empresa en esta carpeta:
```
/frontend/assets/images/logo.png
```

## Requisitos del Logo

- **Formato:** PNG o JPG (se recomienda PNG para transparencia)
- **Dimensiones recomendadas:** 200x200 píxeles o similar (proporcional)
- **Nombre del archivo:** `logo.png` (obligatorio)
- **Tamaño máximo:** 500KB

## Pasos para Implementar

1. **Guarda tu logo** como `logo.png` en la carpeta `/frontend/assets/images/`

2. **El logo aparecerá automáticamente en:**
   - PDFs de cotización (cotizacion.html)
   - PDFs de carrito (carrito.html)
   - Encabezado de las páginas públicas

3. **Si tu logo tiene un nombre diferente o formato diferente:**
   - Renombra el archivo a `logo.png`
   - O modifica el código en los siguientes archivos:
     - `/frontend/assets/js/pages/cotizacion.js` (línea donde se carga la imagen en el PDF)
     - `/frontend/assets/js/pages/carrito.js` (línea donde se carga la imagen en el PDF)

## Ejemplo de Código

El logo se agrega automáticamente a los PDFs. Si el archivo `logo.png` existe, se mostrará en la parte superior del PDF. Si no existe, se mostrará solo el texto "PAINTS".

## Notas Importantes

- Si cambias el nombre o formato del logo, asegúrate de actualizar las referencias en el código
- El logo debe ser de alta calidad para verse bien en los PDFs
- Mantén el archivo lo más pequeño posible sin perder calidad para mejorar los tiempos de carga
