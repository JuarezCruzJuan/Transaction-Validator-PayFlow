# Transaction Validator Service - PayFlow MX

Este repositorio contiene la implementación del microservicio crítico `Transaction-Validator` con un pipeline completo de CI/CD, monitoreo y estrategia de despliegue Blue/Green.

## Requisitos
- Docker y Docker Compose instalados.
- Node.js (opcional, para ejecutar scripts locales sin Docker).

## Estructura del Proyecto
- `Transaction-Validator/`: Código fuente del microservicio (Node.js/Express).
- `.github/workflows/`: Pipeline de CI/CD (GitHub Actions).
- `monitoring/`: Configuración de Prometheus.
- `nginx/`: Configuración del balanceador de carga para Blue/Green.
- `scripts/`: Scripts de automatización del despliegue.

## Instrucciones de Ejecución Local

### 1. Iniciar el entorno (Simulación de Producción)
Para levantar toda la infraestructura (App Blue, App Green, Nginx, Prometheus, Grafana):

```bash
docker-compose up -d --build
```

Esto iniciará los servicios. Por defecto, Nginx apuntará al entorno **Blue** (o el que esté configurado en `nginx/default.conf`).

### 2. Acceder a los servicios
- **API (vía Nginx)**: http://localhost:80/validate
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (Usuario: `admin`, Contraseña: `admin`)

### 3. Simular un Despliegue (Blue/Green)
Para simular el pipeline de despliegue que ejecuta GitHub Actions, corre el siguiente script. Este script detectará el color activo, desplegará en el inactivo, verificará salud y cambiará el tráfico.

```bash
# Requiere Node.js instalado localmente
node scripts/deploy.js
```

Observarás en la consola cómo se realiza el cambio de tráfico sin downtime.

### 4. Generar Tráfico de Prueba
Puedes usar Postman o cURL para enviar peticiones y ver las métricas en Grafana.

```bash
curl -X POST http://localhost:80/validate -H "Content-Type: application/json" -d "{\"id\": \"123\", \"amount\": 500}"
```

## Documentación Técnica
Consulta el archivo [DOCUMENTATION.md](./DOCUMENTATION.md) para detalles sobre:
- Estrategia de Despliegue (Justificación).
- SLO/SLA/SLI y Presupuesto de Errores.
- Planes de mejora.
