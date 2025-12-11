const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const NGINX_CONFIG_PATH = path.join(__dirname, '../nginx/default.conf');
const BLUE_CONFIG = path.join(__dirname, '../nginx/blue.conf');
const GREEN_CONFIG = path.join(__dirname, '../nginx/green.conf');

function getCurrentColor() {
  try {
    const content = fs.readFileSync(NGINX_CONFIG_PATH, 'utf8');
    if (content.includes('app_blue')) return 'blue';
    if (content.includes('app_green')) return 'green';
  } catch (e) {
    return 'blue'; // Default
  }
  return 'blue'; 
}

async function deployWithFailure() {
  const currentColor = getCurrentColor();
  const nextColor = currentColor === 'blue' ? 'green' : 'blue';
  
  console.log(`[DEPLOY] 🚀 Iniciando Despliegue...`);
  console.log(`[DEPLOY] Color Activo: ${currentColor.toUpperCase()}`);
  console.log(`[DEPLOY] Objetivo de Despliegue: ${nextColor.toUpperCase()}`);

  // 1. Simulate Deployment
  console.log(`[DEPLOY] 📦 Levantando contenedor ${nextColor}...`);
  // In a real scenario we would run docker-compose up, here we simulate it
  await new Promise(r => setTimeout(r, 1000));
  console.log(`[DEPLOY] Contenedor ${nextColor} iniciado.`);

  // 2. Health Check
  console.log(`[DEPLOY] 🏥 Ejecutando Health Check en ${nextColor}...`);
  await new Promise(r => setTimeout(r, 2000)); 
  
  // SIMULATE FAILURE
  console.error(`[DEPLOY] ❌ ERROR: Health Check falló en ${nextColor}. (HTTP 500)`);
  console.log(`[DEPLOY] ⚠️  Detectada falla crítica en la nueva versión.`);

  // 3. Rollback Logic
  console.log(`[DEPLOY] 🔄 Iniciando ROLLBACK automático...`);
  console.log(`[DEPLOY] 🛑 Deteniendo contenedor defectuoso (${nextColor})...`);
  await new Promise(r => setTimeout(r, 1000));
  
  console.log(`[DEPLOY] ✅ Rollback completado.`);
  console.log(`[DEPLOY] 🛡️  El tráfico NO se ha modificado. Sigue apuntando a ${currentColor.toUpperCase()}.`);
  console.log(`[DEPLOY] Resultado: CERO DOWNTIME. Los usuarios no fueron afectados.`);
}

deployWithFailure();
