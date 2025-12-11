# Documentación del Proyecto: Transaction-Validator

## 1. Estrategia de Despliegue: Blue/Green

Se ha seleccionado la estrategia **Blue/Green Deployment** para cumplir con el requisito de **Cero Downtime**.

### Justificación:
- **Seguridad**: Permite probar la nueva versión (Green) en un entorno productivo idéntico antes de recibir tráfico real.
- **Rollback Instantáneo**: En caso de error, el rollback consiste simplemente en apuntar el balanceador de carga de nuevo al entorno anterior (Blue), lo cual es inmediato.
- **Aislamiento**: Los errores en el despliegue no afectan a los usuarios finales hasta que se confirma la estabilidad.

### Flujo Implementado (GitHub Actions + Docker):
1. Construcción de la imagen Docker.
2. Identificación del entorno inactivo (e.g., Green si Blue está activo).
3. Despliegue de la nueva versión en el entorno inactivo.
4. Ejecución de pruebas de salud (Health Checks).
5. Cambio de tráfico (Switch) actualizando la configuración de Nginx.
6. Apagado del entorno anterior.

---

## 2. Sistema de Monitoreo Completo (Observabilidad)

El sistema cubre los 3 pilares de la observabilidad.

### A. Métricas (Prometheus + Grafana + Node Exporter)
- **Métricas de Negocio**: Total de transacciones, transacciones aprobadas vs rechazadas.
- **Métricas de Aplicación (RED Method)**:
    - **Rate**: Tasa de peticiones por segundo.
    - **Errors**: Tasa de errores (5xx).
    - **Duration**: Latencia de las peticiones (Histograma).
- **Métricas de Infraestructura**: CPU, Memoria y I/O del host recolectadas por `node-exporter`.
- **Visualización**: Dashboard automático en Grafana (`http://localhost:3001`).

### B. Logs (Loki + Promtail)
- **Logging Estructurado**: La aplicación genera logs en formato JSON con `winston`.
- **Agregación**: `Promtail` lee los archivos de log generados por los contenedores (volumen compartido) y los envía a `Loki`.
- **Consulta**: Desde Grafana (Explore -> Loki), se pueden filtrar logs por `transactionId`, nivel de error, etc.

### C. Trazas (OpenTelemetry + Jaeger)
- **Instrumentación**: La aplicación usa el SDK de OpenTelemetry para Node.js.
- **Propagación**: Se trazan las peticiones HTTP entrantes y salientes.
- **Visualización**: Jaeger UI (`http://localhost:16686`) permite ver el diagrama de cascada (waterfall) de cada petición, útil para depurar latencias.

---

## 3. Plan de Evaluación de Rendimiento (SRE)

### SLA (Acuerdo de Nivel de Servicio - Externo)
El compromiso con el cliente (PayFlow MX) es:
- **Disponibilidad**: 99.9% mensual.
- **Latencia**: El 95% de las peticiones deben procesarse en menos de 2 segundos.

### SLO (Objetivo de Nivel de Servicio - Interno)
Objetivos internos más estrictos para tener margen de maniobra:
- **Disponibilidad**: 99.95%.
- **Latencia**: El 99% de las peticiones deben procesarse en menos de 1 segundo.

### SLI (Indicador de Nivel de Servicio - Métricas)
Las métricas reales que se monitorean en Prometheus:
1. **SLI de Disponibilidad**:
   $$ \frac{\text{Total Requests} - \text{5xx Errors}}{\text{Total Requests}} \times 100 $$
   *Métrica Prometheus*: `sum(rate(transaction_requests_total{status!~"5.."}[5m])) / sum(rate(transaction_requests_total[5m]))`

2. **SLI de Latencia**:
   Porcentaje de peticiones exitosas más rápidas que el umbral (1s).
   *Métrica Prometheus*: `histogram_quantile(0.99, rate(transaction_duration_seconds_bucket[5m]))`

### Presupuesto de Errores (Error Budget)
Basado en un SLO de 99.95% de disponibilidad mensual:
- Tiempo total mensual: ~43,200 minutos.
- Tiempo de inactividad permitido (0.05%): **21.6 minutos al mes**.
- Si se consume este presupuesto, se congelan los despliegues de nuevas funcionalidades y se prioriza la estabilidad.

---

## 4. Planes de Mejora

### Problemas Detectados (Antes)
- **Latencia alta**: Picos aleatorios de >2s.
- **Errores 500**: Tasa de error del 0.8%.
- **Logs**: Texto plano difícil de parsear.

### Soluciones Implementadas (Ahora)
1. **Monitoreo Completo**: Stack Prometheus/Grafana/Loki/Jaeger.
2. **Logging Estructurado**: JSON logs.
3. **Pipeline CI/CD**: Automatización Blue/Green.

### Futuras Mejoras (Roadmap)
- **Autoscaling**: Implementar Kubernetes HPA.
- **Alerting**: Configurar Alertmanager para enviar notificaciones a Slack/Email cuando el Error Budget se consuma rápidamente.
