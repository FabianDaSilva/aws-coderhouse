# Módulo 7 · Dashboard de monitoreo con Amazon CloudWatch

Definición de un dashboard de CloudWatch para monitorear una instancia EC2 de servidor web: uso de CPU y tráfico de red. Extiende la infraestructura de módulos anteriores (EC2 en una VPC) con un sistema de monitoreo visual.

- **Dashboard:** `Servidor-Web-Monitoreo-Dashboard`
- **Definición en JSON:** [`dashboard.json`](dashboard.json)
- **Región:** `us-east-1` (N. Virginia)

> **Alcance:** esta entrega es la definición del dashboard como código (JSON). No se lanzó ninguna instancia en AWS para hacerla, así que no consume crédito. El ID de instancia `i-0123456789abcdef0` del JSON es un valor de ejemplo, que hay que reemplazar por el de la instancia real (ver «Cómo usarlo»).

## 📊 Qué muestra el dashboard

El dashboard tiene dos widgets, ambos con métricas del espacio de nombres `AWS/EC2` para una instancia (`servidor-web-monitoreo`).

### 1. Uso de CPU (%) · gráfico de líneas

- **Métrica:** `CPUUtilization`, con estadística *Average* y período de 5 minutos.
- **Qué significa:** el porcentaje de la capacidad de procesamiento que la instancia está usando. Va de 0 a 100, y el eje del gráfico está fijado en ese rango.
- **Cómo leerla:**
  - Cerca de 0 a 5 %: la instancia está ociosa.
  - Valores altos sostenidos (por ejemplo, más del 80 % durante varios períodos): la instancia está al límite y habría que usar un tipo más grande o sumar instancias.
  - Un pico que se repite siempre a la misma hora indica un patrón de demanda, útil para planificar capacidad.
- **Nota:** en las instancias `t3` la CPU es *burstable*, con créditos. Un uso alto y prolongado puede agotarlos.

### 2. Tráfico de red · gráfico de área apilada

- **Métricas:** `NetworkIn` y `NetworkOut`, con estadística *Sum* y período de 5 minutos.
- **Qué significan:** `NetworkIn` es la cantidad de bytes que **entran** a la instancia (por ejemplo, las peticiones HTTP de los visitantes). `NetworkOut` son los bytes que **salen** (por ejemplo, las páginas que responde el servidor).
- **Cómo leerlas:** cada punto es el **total de bytes en esos 5 minutos**, no una velocidad. El área apilada permite ver cuánto del tráfico total es de entrada y cuánto de salida.
- **Costo:** la transferencia de entrada a AWS es gratuita. La de salida a internet se cobra por GB, así que `NetworkOut` es la más importante de vigilar en la factura.

## 🧱 Cómo está hecho el JSON

El archivo sigue el formato de definición de dashboards de CloudWatch: una lista `widgets` donde cada widget es de tipo `metric`, con su posición (`x`, `y`, `width`, `height`) y sus propiedades.

| Propiedad | Qué hace |
| --- | --- |
| `title` | Etiqueta visible del widget. |
| `view` | `timeSeries`: gráfico en el tiempo. |
| `stacked` | `false` para líneas (CPU) y `true` para área apilada (red). |
| `metrics` | Lista `[espacio de nombres, métrica, dimensión, valor]`. La dimensión es `InstanceId`. El `label` es el nombre de la serie en la leyenda. |
| `stat` y `period` | Estadística (`Average` o `Sum`) y período en segundos (300 = 5 minutos). |
| `region` | Región donde están las métricas. |

## ✅ Validación

La definición se probó con `aws cloudwatch put-dashboard` en una cuenta de AWS: la API la aceptó y devolvió `"DashboardValidationMessages": []`, es decir, sin errores de formato. El dashboard de prueba se borró a continuación, para no dejar recursos en la cuenta.

## 🚀 Cómo usarlo

1. Reemplazar `i-0123456789abcdef0` por el ID de la instancia, en las tres apariciones del archivo.
2. Crear el dashboard desde la CLI:

```bash
aws cloudwatch put-dashboard --dashboard-name Servidor-Web-Monitoreo-Dashboard \
  --dashboard-body file://dashboard.json
```

3. Entrar en CloudWatch → Dashboards. Con la instancia en ejecución, los gráficos muestran datos pasados unos minutos.

Para ver o exportar la definición de un dashboard existente:

```bash
aws cloudwatch get-dashboard --dashboard-name Servidor-Web-Monitoreo-Dashboard \
  --query DashboardBody --output text
```

## ⚠️ Limitaciones y errores comunes que se tuvieron en cuenta

- **Instancia apagada:** si la instancia no está en ejecución, las métricas no tienen datos y las líneas salen vacías.
- **Instancia correcta:** con varias instancias, el ID del JSON debe ser el de la que pertenece a la VPC de desarrollo.
- **Métricas básicas:** EC2 publica métricas cada 5 minutos sin costo. Las de 1 minuto (monitoreo detallado) se cobran.
- **Lo que CloudWatch no ve por defecto:** la memoria RAM y los logs internos del sistema operativo. Para eso hace falta instalar el **CloudWatch Agent**.
- **Alarmas:** el dashboard solo muestra datos. Para que alguien se entere de un problema habría que crear alarmas asociadas a **Amazon SNS**.

## 🔎 CloudWatch vs. CloudTrail

- **CloudWatch:** operaciones. Mide el rendimiento y la salud de los recursos.
- **CloudTrail:** auditoría. Registra quién hizo qué a través de la API de AWS.
