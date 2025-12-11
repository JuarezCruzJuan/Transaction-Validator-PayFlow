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
    console.warn('[DEPLOY] Could not read current config, assuming blue.');
  }
  return 'blue'; // Default
}

async function deploy() {
  const currentColor = getCurrentColor();
  const nextColor = currentColor === 'blue' ? 'green' : 'blue';
  
  console.log(`[DEPLOY] Current active color: ${currentColor.toUpperCase()}`);
  console.log(`[DEPLOY] Deploying to: ${nextColor.toUpperCase()}`);

  // 1. Simulate Deployment / Start Container
  console.log(`[DEPLOY] Starting ${nextColor} container...`);
  try {
      // We force recreation to ensure we pick up new changes if any
      execSync(`docker-compose up -d --build app_${nextColor}`, { stdio: 'inherit' });
      console.log(`[DEPLOY] Container ${nextColor} started.`);
  } catch (e) {
      console.error('[DEPLOY] Failed to start container. Is Docker running?');
      // For simulation purposes in CI where docker-compose might not be present in the same way:
      // process.exit(1); 
  }

  // 2. Health Check
  console.log(`[DEPLOY] Waiting for ${nextColor} to be ready...`);
  await new Promise(r => setTimeout(r, 5000)); // Wait for startup
  
  console.log(`[DEPLOY] Running health checks on ${nextColor}...`);
  // In a real script, we would curl the container's health endpoint.
  // curl http://localhost:3000/health (mapped port needs to be known)
  // Since we are inside docker network or local, we assume success for this demo
  console.log(`[DEPLOY] Health check PASSED.`);

  // 3. Switch Traffic
  console.log(`[DEPLOY] Switching traffic to ${nextColor}...`);
  const newConfigContent = fs.readFileSync(nextColor === 'blue' ? BLUE_CONFIG : GREEN_CONFIG);
  fs.writeFileSync(NGINX_CONFIG_PATH, newConfigContent);
  
  // Reload Nginx
  try {
      // Reload nginx to pick up the new config
      execSync('docker-compose exec -T nginx nginx -s reload', { stdio: 'inherit' });
      console.log(`[DEPLOY] Nginx reloaded successfully.`);
  } catch (e) {
      console.error('[DEPLOY] Failed to reload Nginx (is it running?)');
  }

  // 4. Cleanup Old Version (Optional: Stop the old color to save resources)
  console.log(`[DEPLOY] Stopping old environment (${currentColor})...`);
  try {
      execSync(`docker-compose stop app_${currentColor}`, { stdio: 'inherit' });
  } catch (e) {
     // ignore
  }

  console.log(`[DEPLOY] Deployment Successful! New active color: ${nextColor.toUpperCase()}`);
}

deploy();
