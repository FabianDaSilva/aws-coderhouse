# aws-coderhouse

Repositorio con mis entregas del curso **Cloud Computing (AWS)** de [Coderhouse](https://www.coderhouse.com/). Cada entrega es un ejercicio práctico del curso, resuelto con infraestructura como código usando **AWS CDK** (JavaScript).

## 📚 Índice de entregas

1. [**AWS Lambda: Introducción al cómputo serverless**](#-entrega-1--aws-lambda-introducción-al-cómputo-serverless) · Escenario B (API Gateway) · 🔎 en revisión

## 🔀 Cómo está organizado el repositorio

- **`main`:** solo tiene entregas terminadas y revisadas.
- **Una rama por entrega:** cada ejercicio se desarrolla en su propia rama, con el nombre `entrega/NN-tema`. Por ejemplo, `entrega/01-lambda-serverless`.
- **Un Pull Request por entrega:** al terminar, se abre un PR hacia `main` con el título de la entrega, y se mergea. Así el historial queda ordenado y cada entrega se puede revisar por separado.
- **Este índice:** al mergear una entrega se agrega una línea acá con su título y su estado.

---

## 🚀 Entrega 1 · AWS Lambda: Introducción al cómputo serverless

**Escenario B (API):** una función Lambda que se dispara vía **API Gateway** y responde con un saludo: `Holaa, mundo desde Lambda! 🖖`.

**Objetivo del ejercicio:** pasar de la teoría a la práctica con una arquitectura básica *event-driven*, donde una acción en la nube (una petición HTTP) dispara automáticamente mi código, usando los permisos de seguridad de IAM. La infraestructura se define con AWS CDK en lugar de crearla a mano desde la consola.

### 🧭 Qué hace

1. Un cliente hace una petición HTTP a la URL de la API.
2. **API Gateway** recibe la petición y la reenvía a la función.
3. **Lambda** ejecuta `lambda/index.mjs`, registra la ruta pedida en los logs y responde `200` con el texto `Holaa, mundo desde Lambda! 🖖`.
4. Los logs de cada ejecución quedan en **CloudWatch Logs**.

```mermaid
flowchart LR
    C[Cliente<br/>curl o navegador] -- HTTPS --> A[API Gateway<br/>REST API · stage prod]
    A -- invoca --> L[Lambda<br/>index.mjs]
    L -- logs --> CW[CloudWatch Logs]
    R{{Rol de IAM}} -. permisos .-> L
```

### 📁 Estructura

- **`lambda/index.mjs`:** el código de la función (Node.js).
- **`lib/aws-coderhouse-stack.js`:** el stack de CDK con la función, la API y sus permisos.
- **`bin/aws-coderhouse.js`:** el punto de entrada de la app de CDK.
- **`test/`:** carpeta de pruebas de CDK.
- **[`iam/iam_policy.json`](iam/iam_policy.json):** la política de permisos de la entrega, copiada de `AWSLambdaBasicExecutionRole` (ver la sección siguiente).
- **[`capturas/`](capturas/):** evidencia de la ejecución real (ver la sección de evidencia).

### 🔐 Permisos de IAM

Para este escenario hacen falta dos permisos, y CDK crea ambos:

- **Rol de ejecución de la función:** un rol de servicio que asume Lambda, con la política administrada `AWSLambdaBasicExecutionRole`. Permite escribir logs en CloudWatch (`logs:CreateLogGroup`, `logs:CreateLogStream` y `logs:PutLogEvents`). Sin ella no aparecería ningún log. Su documento JSON está en [`iam/iam_policy.json`](iam/iam_policy.json), obtenido de AWS con `aws iam get-policy-version`. Es una política administrada por AWS y usa `"Resource": "*"`; como mejora, se podría acotar al grupo de logs de la función.
- **Permiso de invocación:** una política *basada en recurso* sobre la función, con `lambda:InvokeFunction` y principal `apigateway.amazonaws.com`. Es lo que autoriza a API Gateway a invocar la función. Sin esto, la API respondería con error.

En este escenario la función no accede a otros servicios, por eso no lleva política inline propia (como sí ocurriría con `s3:GetObject` en el escenario de S3).

### 🛠️ Cómo desplegarlo

**Requisitos:** Node.js, AWS CLI y un perfil de AWS configurado localmente con el nombre `dev-environment`, con permisos para crear funciones Lambda, APIs, roles de IAM y grupos de logs. Los scripts de despliegue usan ese perfil de forma fija, para no desplegar por error en otra cuenta.

```bash
npm install
```

Comprobar que todo compila. Es local y no toca AWS:

```bash
npx aws-cdk synth
```

Confirmar con qué cuenta se va a desplegar, antes de crear nada:

```bash
aws sts get-caller-identity --profile dev-environment
```

Ver qué se va a crear:

```bash
npx aws-cdk diff --profile dev-environment
```

Desplegar (equivale a `cdk deploy --profile dev-environment`):

```bash
npm run deploy:dev
```

Si la cuenta y la región nunca se usaron con CDK, hace falta ejecutar una vez `npx aws-cdk bootstrap --profile dev-environment` antes del despliegue.

Al terminar, CDK imprime la URL de la API (`ApiSaludoEndpoint...`). Para probarla:

```bash
curl URL_DE_LA_API
```

Para ver los logs de la función en CloudWatch desde la terminal:

```bash
aws logs tail /aws/lambda/aws-coderhouse-saludo --since 5m --profile dev-environment
```

También se pueden ver desde la consola: función Lambda → pestaña **Monitor** → **View CloudWatch logs**.

### 📸 Evidencia

Capturas de la ejecución real del despliegue, guardadas en [`capturas/`](capturas/). Se ocultaron el ID de cuenta y la URL de la API.

**1. La API responde con `200 OK`.** Petición con `curl` a la URL de la API: devuelve el mensaje de la función.

![Respuesta de la API con curl](capturas/01-curl-respuesta.png)

**2. El rol de ejecución tiene la política de logs.** El rol que CDK creó para la función tiene adjunta `AWSLambdaBasicExecutionRole`.

![Rol de IAM con AWSLambdaBasicExecutionRole](capturas/02-rol-iam.png)

**3. La función tiene a API Gateway como trigger.** Vista general de la función en la consola de Lambda.

![Función Lambda con el trigger de API Gateway](capturas/03-lambda-trigger.png)

**4. Los logs quedan en CloudWatch.** Tres invocaciones de la función, cada una con la línea `Ruta del evento:` y su resumen de duración y memoria.

![Log de la ejecución en CloudWatch](capturas/04-cloudwatch-log.webp)

### ⚠️ Errores comunes que se tuvieron en cuenta

- **Formato de la respuesta:** API Gateway espera un objeto con `statusCode` y `body` (este último como texto). Si la función devuelve otra cosa, la API responde `502 Internal server error`. La función devuelve exactamente esa estructura.
- **Timeout:** una función nueva trae 3 segundos por defecto. Acá se configuró en 10, más que suficiente para un saludo.
- **Módulos ES:** el archivo se llama `index.mjs` porque usa `export`. Con la extensión `.js`, Lambda lo tomaría como CommonJS y fallaría.

### 🧹 Limpieza

La API queda pública, sin autenticación. Al terminar la entrega, se borra todo (equivale a `cdk destroy --profile dev-environment`):

```bash
npm run destroy:dev
```

Pide confirmación antes de borrar. Elimina la función, la API, el rol de IAM y el grupo de logs, que se configuró con retención de una semana y con política de borrado para que no quede nada en la cuenta.

---

## ℹ️ Sobre este repositorio

Es material de estudio y práctica del curso. Las cuentas de AWS, credenciales e identificadores propios no se incluyen en el repositorio.
