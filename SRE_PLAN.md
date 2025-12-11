# Plan de Evaluación de Rendimiento y Fiabilidad (SRE)
**Microservicio:** Transaction-Validator  
**Empresa:** PayFlow MX  
**Fecha:** 2025-12-10

Este documento define los acuerdos de nivel de servicio (SLA), objetivos (SLO), indicadores (SLI) y el presupuesto de errores para el microservicio crítico de validación de transacciones.

---

## 1. Definición de SLA (Acuerdo de Nivel de Servicio)
El SLA es el compromiso contractual con los usuarios del servicio (internos o externos). Si se incumple, suelen existir penalizaciones.

| Métrica | Objetivo (SLA) | Descripción |
| :--- | :--- | :--- |
| **Disponibilidad** | **99.9%** Mensual | El servicio debe estar operativo el 99.9% del tiempo cada mes. |
| **Latencia** | **< 2 segundos** (p95) | El 95% de las transacciones deben procesarse en menos de 2000ms. |

---

## 2. Definición de SLO (Objetivo de Nivel de Servicio)
El SLO es el objetivo interno del equipo de ingeniería. Es más estricto que el SLA para tener un margen de seguridad antes de incumplir el contrato.

| Métrica | Objetivo (SLO) | Descripción |
| :--- | :--- | :--- |
| **Disponibilidad** | **99.95%** Mensual | Permitimos menos fallos internamente para proteger el SLA. |
| **Latencia** | **< 1 segundo** (p99) | El 99% de las transacciones deben ser muy rápidas (<1000ms). |

---

## 3. SLI (Indicador de Nivel de Servicio)
Los SLI son las métricas reales medidas por nuestro sistema de monitoreo (Prometheus).

### A. SLI de Disponibilidad
Se mide como la proporción de solicitudes HTTP exitosas (código 2xx) respecto al total.

*   **Definición**: `(Total Requests - 5xx Errors) / Total Requests`
*   **Query Prometheus**:
    ```promql
    sum(rate(transaction_requests_total{status!~"5.."}[5m])) 
    / 
    sum(rate(transaction_requests_total[5m]))
    ```

### B. SLI de Latencia
Se mide usando histogramas para calcular el percentil 99 de la duración.

*   **Definición**: P99 de `transaction_duration_seconds`
*   **Query Prometheus**:
    ```promql
    histogram_quantile(0.99, sum(rate(transaction_duration_seconds_bucket[5m])) by (le))
    ```

---

## 4. Cálculo del Presupuesto de Errores (Error Budget)
El presupuesto de errores es la cantidad de "infiabilidad" permitida antes de dejar de innovar para centrarse en la estabilidad.

### Base de Cálculo
*   **Periodo**: 30 días (1 mes).
*   **Total de Minutos**: $30 \text{ días} \times 24 \text{ horas} \times 60 \text{ min} = 43,200 \text{ minutos}$.

### Cálculo para Disponibilidad (SLO: 99.95%)
*   **Porcentaje de Error Permitido**: $100\% - 99.95\% = 0.05\%$.
*   **Presupuesto en Minutos**:
    $$ 43,200 \text{ minutos} \times 0.0005 = \mathbf{21.6 \text{ minutos/mes}} $$

**Interpretación**:
El equipo tiene **21 minutos y 36 segundos** al mes para realizar mantenimientos que causen caída, o para absorber incidentes inesperados. Si se supera este tiempo:
1.  Se congelan los despliegues a producción (Freeze).
2.  El equipo se dedica 100% a tareas de fiabilidad y deuda técnica.

---

## 5. Justificación Técnica

### Estado Anterior (Legacy)
El microservicio presentaba los siguientes problemas medidos en producción:
*   **Tasa de Errores**: ~0.8%. Esto equivale a una disponibilidad del **99.2%**, lo cual es inaceptable para un servicio financiero crítico.
*   **Latencia**: Picos superiores a 2.5 segundos en horarios de carga, afectando la experiencia de pago.

### Estrategia de Mejora
1.  **SLA de 99.9%**: Se establece como meta realista inicial. Pasar de 99.2% a 99.9% requiere eliminar la mayoría de los timeouts de base de datos y errores de código.
2.  **SLO de 99.95%**: Se define un margen interno más estricto. Dado que ahora utilizamos una estrategia de despliegue **Blue/Green**, el tiempo de caída por despliegue se reduce a prácticamente cero (milisegundos de recarga de Nginx), lo que nos permite reservar el presupuesto de errores casi exclusivamente para incidentes imprevistos, no para ventanas de mantenimiento.
3.  **Latencia**: La optimización del código y la infraestructura (Node.js asíncrono + Dockerización eficiente) permite reducir el tiempo de respuesta promedio a <200ms, por lo que un SLO de <1s para el p99 es un objetivo agresivo pero alcanzable.
