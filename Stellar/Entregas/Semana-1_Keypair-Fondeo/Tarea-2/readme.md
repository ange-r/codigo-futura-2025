# 📝 TAREA CLASE 2 - FUNDAMENTOS DE PROGRAMACIÓN STELLAR

> En esta sección encontraran los primeros ejercicios de desarrollo con Stellar SDK y JavaScript.
>
> En estas prácticas se desglosa el proceso operativo de Stellar, replicando lo que generamos de forma intuitiva en Stellar Lab pero desde el código.


## 🎯 Objetivo

- Comprender la lógica de creación, fondeo, pagos y consulta de balance de cuentas en Stellar.
- Probar transacciones de manera segura, en Testnet.
- Prepararme para proyectos más avanzados en la red principal de Stellar.
  

### ⚙️ Requisitos y configuración del stack
---
Para poder realizar estas prácticas es necesario contar con el siguiente stack:

- Node.js (v10 o superior) 
- npm (gestor de paquetes)
- stellar/stellar-sdk (v14.0.0 o superior)
- dotenv (para manejo seguro de claves)

> Nota: Todos los ejercicios usan **Stellar Testnet**, por lo que no necesitas fondos reales. Esto te permite experimentar sin riesgos.

### 🛠️ Clonar el repositorio

Para obtener el código de los ejercicios, cloná este repositorio en tu máquina local:

```bash
git clone https://github.com/ange-r/codigo-futura-2025.git
cd tu-repo
```
#### 💾 Instalar dependencias

Dentro de la carpeta del repositorio, ejecutá:
```bash
npm install stellar-sdk dotenv
```
Esto instalará todas las librerías necesarias para ejecutar los scripts de la práctica.

### 🔑 Uso de Variables de Entorno

> Para proteger tus claves privadas y manejar las cuentas de manera segura, utilizamos **archivos de entorno** (`.env` y `cuentas.env`).

#### 1️⃣ Archivos `.env`

Estos archivos contienen las credenciales principales de la cuenta que se usará para enviar fondos o realizar pagos unitarios:

- Deberás crear un achivo **'.env'** en la raíz de /javascript-sdk, donde se guardarán manualmente las claves de tus cuentas testnet para prácticas.
```env
# Keypair de tus cuentas (generadas en Stellar Lab)

SECRET_KEY=SA7****************X3L
PUBLIC_KEY=GBY*****************ABC

  Las llaves tienen 56 caracteres, las secretas siempre inician con SA, mientras que las públicas lo hacen con GB.
```
- También deberás crear un archivo **'cuentas.env'**, donde se cargarán automáticamente los pares de llaves creados en el archivo **'crear-cuentas-masivas.js'**. 
- Este último se usa para consultar balances y enviar pagos a múltiples cuentas sin exponer claves privadas en el código.

> 🔒 Se recomienda incluir los archivos .env y cuentas.env en .gitignore para evitar subir información sensible.

#### ¿Cómo usar estos archivos en tus scripts?

En tus scripts de Node.js, podés cargar las variables de entorno con dotenv:
```javascript
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;
const publicKey = process.env.PUBLIC_KEY;

```

### 🗂️ Estructura de archivos

```tree
Tarea-2
  /hello-contract
  /javascript-sdk
    /consultar-balance.js
    /crear-cuenta.js    
    /crear-cuentas.js
    /enviar-pagos-masivos.js
    /enviar-pagos.js
    .env
    cuentas.env 
    package.json
    .gitignore
  /stellar-cli 
```    

## 📝 Ejercicios
> Todos los ejercicios utilizan la **Testnet de Stellar**, que es un entorno seguro y simulado para pruebas. No afectará la red principal y permite:
>  
> - Practicar sin riesgos financieros.
> - Aprender la lógica de transacciones y gestión de cuentas.
> - Experimentar con distintos escenarios de pago y balance.


### 1️⃣ Creación de cuentas
- Importación de librerías desde **@stellar/stellar-sdk.**
- Configuración de **Horizon Testnet**
- Función para **Generar nuevas claves públicas y privadas.**
- Función para **Fondear cuentas con Fiendbot**
- Una vez entendida la lógica del proceso, **modificar el script para crear varias cuentas automáticamente.** 
  
  En terminal para Tarea-2 ejecuta:
```bash
cd javascript-sdk
node crear-cuenta.js  
    (Para crear 1 cuenta y fondearla)

node crear-cuentas-masivas.js
    (Para crear 5 cuentas, fondearlas y guardar sus llaves en cuentas.env automáticamente)
```
  
*NOTA:* A este ejercicio modificado le sumo una ***función de guardado automático de cuentas en variable de entorno 'cuentas.env',*** que luego será requerido para el envío de fondos y consulta de balances.


### 2️⃣ Realización de pagos
- Importación de librerías desde **@stellar/stellar-sdk.**
- Configuración de **servidor y red.**
- Uso de creenciales (keypair).
- Función para **Enviar pagos**:
  - Carga de cuenta a debitar
  - Verificación de balance
  - Funcion de transacción
  - Firma de la transacción
  - Publicación en la red Stellar de  la transacción
  - Verificación de transacciones exitosas
- Una vez entendida la lógica del proceso, **crear un sistema que envíe pagos a múltiples destinos.**

  En terminal para Tarea-2 ejecuta:
```bash
cd javascript-sdk
node enviar-pagos.js  
    (Para hacer 1 transacción)

node enviar-pagos-masivos.js
    (Para hacer varios pagos en una ejecución)
```

### 3️⃣ Consulta de balances
- Importación de librerías desde **@stellar/stellar-sdk.**
- Configuración de **servidor**
- Importación de cuentas (desde variable de entorno segura)
- Función para **Consultar el saldo de cuentas**:
  - Función automátizada para consultar todas las cuentas guardadas
- Verificar que las transacciones se reflejen correctamente en las cuentas.

  En terminal para Tarea-2 ejecuta:
```bash
cd javascript-sdk
node consultar-balance.js  
    (Esto muestra el balance de todas las cuentas guardadas en cuentas.env)
```

## 💡 Buenas Prácticas

-  ⚡ Siempre verifica que estás en **Testnet**, nunca en Mainnet para pruebas.
- 🔑 **Protege tus claves privadas, incluso en entornos de prueba.**
- 🧩 Comprende cada paso antes de ejecutar transacciones, la práctica es la mejor forma de aprendizaje.
- 📚 Documenta tus pruebas y resultados para futuras referencias.


## 📚 Recursos Adicionales

- Documentación oficial de Stellar: [Stellar Developer Docs](https://developers.stellar.org/).
- [Stellar Laboratory](https://laboratory.stellar.org/) – Herramienta web para experimentar con operaciones Stellar.
- [SDK de Stellar](https://github.com/stellar/js-stellar-sdk) – Para automatizar transacciones y gestionar cuentas programáticamente.


## 🧭 Cómo Usar Este Repositorio

1. Clona el repositorio en tu máquina local.
2. Segui las instrucciones de instalación y configuración del entorno.
3. Crea los archivos de variable de entorno, y guarda en el '.env' tus llaves para poder correr los archivos simpleas.



## 🚀 Reflexión Final

Este trabajo fue desarrollado por **Angeles Rechach**, integrando los fundamentos de programación en **Stellar SDK** y aplicando buenas prácticas de desarrollo seguro con **JavaScript** y **dotenv**.

Cada script busca no solo ejecutar operaciones sobre la **Testnet de Stellar**, sino también comprender la lógica que hay detrás de cada transacción, desde la creación de cuentas hasta la automatización de pagos y consultas de balance.

> **La meta no es solo que funcione, sino entender cómo y por qué lo hace.  
> Porque programar sin entender el flujo es como navegar sin brújula.**

💻 *Proyecto realizado en el marco del Programa CódigoFutura de Buen Día Builder, con el apoyo de Stellar Development Foundation y Blockchain Acceleration Foundation (BAF).*  
🌎 *En camino a construir soluciones descentralizadas con propósito y visión argentina.*
