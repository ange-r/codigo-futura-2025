# WORX Token - Contrato Inteligente + Frontend en Soroban (Stellar)

> Contrato de token fungible ERC-20-like desarrollado en Rust para la blockchain Stellar usando Soroban SDK + Frontend React con Freighter wallet integration.

## 📋 Descripción

WORX Token es un token fungible que implementa el estándar CAP-46 de Stellar, compatible con wallets, DEXs y el ecosistema completo de Stellar. Incluye una aplicación frontend funcional para interactuar con el contrato.

### Características Principales
- ✅ **Inicialización única** con metadatos completos
- ✅ **Mint controlado** solo por administrador
- ✅ **Transferencias** entre cuentas con validaciones
- ✅ **Sistema de allowances** para gastos delegados
- ✅ **Burn de tokens** para reducir supply
- ✅ **Eventos ricos** para tracking de operaciones
- ✅ **Frontend React** con Freighter wallet
- ✅ **Modo noche/día** en UI
- ✅ **Interfaz responsive** y moderna

---

## 🗂️ Estructura del Proyecto

```
worx_token/
├── contracts/src/
│   ├── lib.rs              # Lógica principal del contrato
│   ├── storage.rs          # Definición de claves de almacenamiento
│   ├── errors.rs           # Tipos de error personalizados
│   └── test.rs             # Suite de 12 tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Componente principal
│   │   ├── services/
│   │   │   └── stellar.ts  # Servicio para interactuar con contrato
│   │   ├── contracts/
│   │   │   └── WorxTokenClient.ts  # Cliente del contrato
│   │   └── global.d.ts     # Tipos de Freighter API
│   ├── vite.config.ts
│   └── package.json
├── Cargo.toml
└── README.md
```

---

## 🚀 Requisitos Previos

- Rust (versión estable)
- Stellar CLI
- Node.js 18+
- Freighter Wallet (extensión del navegador)
- Target wasm32-unknown-unknown

### Instalación

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Stellar CLI  
cargo install --locked stellar-cli

# Target WASM
rustup target add wasm32-unknown-unknown

# Node.js
# Descargar desde https://nodejs.org/
```

---

## 🛠️ Configuración y Deploy

### Compilar Contrato
```bash
cargo build --target wasm32-unknown-unknown --release
```

### Deploy en Testnet
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/worx_token.wasm \
  --source testnet \
  --network testnet
```

### Inicializar Token
```bash
stellar contract invoke \
  --id [CONTRACT_ID] \
  --source testnet \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address testnet) \
  --name "WORX Token" \
  --symbol "WORX" \
  --decimals 7
```

---

## 💻 Frontend - Levantar la Aplicación

### 1. Configurar Variables de Entorno
Crea `frontend/.env`:
```
VITE_CONTRACT_ID=tu_contract_id_aqui
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK=TESTNET
```

### 2. Instalar Dependencias
```bash
cd frontend
npm install
```

### 3. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 4. Usar la Aplicación
1. Instala [Freighter Wallet](https://freighter.app)
2. Crea/importa una wallet en Testnet
3. Haz click en "Conectar Wallet" en la app
4. Consulta balance y realiza transferencias

---

## 🧪 Suite de Tests - Contrato

```bash
# Ejecutar todos los tests
cargo test

# Test específico
cargo test test_initialize -- --nocapture

# Con detalles
cargo test -- --nocapture
```

**Tests Implementados (12):**
- ✅ test_initialize
- ✅ test_initialize_twice_fails
- ✅ test_invalid_decimals
- ✅ test_mint_and_balance
- ✅ test_mint_zero_fails
- ✅ test_transfer
- ✅ test_transfer_insufficient_balance
- ✅ test_transfer_to_self
- ✅ test_approve_and_transfer_from
- ✅ test_transfer_from_insufficient_allowance
- ✅ test_burn
- ✅ test_operations_without_init

---

## 📊 Funciones del Contrato

| Función | Descripción | Requisitos |
|---------|-------------|-----------|
| `initialize()` | Inicializa token con metadatos | Una sola vez |
| `mint()` | Crea nuevos tokens | Solo admin |
| `burn()` | Quema tokens | Owner |
| `balance()` | Consulta balance de cuenta | Ninguno |
| `transfer()` | Transfiere entre cuentas | Suficiente balance |
| `approve()` | Aprueba gastos delegados | Owner |
| `transfer_from()` | Transfiere en nombre de otro | Allowance previo |

---

## 🎯 Funcionalidades de Frontend

- ✅ Conectar/desconectar wallet Freighter
- ✅ Ver dirección de wallet (truncada)
- ✅ Consultar balance en tiempo real
- ✅ Transferir tokens
- ✅ Modo noche/día
- ✅ Interfaz responsive
- ✅ Estados de carga
- ✅ Manejo de errores

---

## 🔍 Troubleshooting

### Error: "Can't access property 'Server', SorobanRpc is undefined"
**Solución:** Verificar que `@stellar/stellar-sdk` está correctamente instalado.
```bash
npm install --save @stellar/stellar-sdk@latest
```

### Error: "Freighter not connected"
**Solución:** 
1. Instala Freighter desde https://freighter.app
2. Crea una wallet
3. Cambia a Testnet en Freighter
4. Recarga la página

### Error: "Contract ID no configurado"
**Solución:** Verifica que `.env` tiene `VITE_CONTRACT_ID` correcto y recarga.

### Transacción pendiente por mucho tiempo
**Solución:** Normal en Testnet. Espera 20-30 segundos o verifica en [Stellar Expert](https://stellar.expert/explorer/testnet/).

---

## 📚 Recursos

- [Documentación Soroban](https://developers.stellar.org/docs/build/smart-contracts)
- [Estándar CAP-46](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046.md)
- [Freighter Wallet](https://freighter.app)
- [Stellar Expert Explorer](https://stellar.expert/explorer/testnet/)

---

## 👥 Autor

Desarrollado como parte del programa Código Futura de Buen Día Builders, con el apoyo de Stellar Developer Foundation.

## 📄 Licencia

Código abierto para fines educativos en el ecosistema Stellar.