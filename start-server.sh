#!/bin/bash

# Script para iniciar el servidor del Sistema Paints
# Puerto: 3001

echo "🎨 Iniciando Sistema Paints..."
echo "================================"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

# Detener procesos anteriores en el puerto 3001
echo "🔄 Limpiando procesos anteriores..."
pkill -f "PORT=3001 node backend/server.js" 2>/dev/null
sleep 1

# Iniciar el servidor
echo "🚀 Iniciando servidor en puerto 3001..."
echo ""
PORT=3001 node backend/server.js
