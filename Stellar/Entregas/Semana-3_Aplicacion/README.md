# Token BDB - Contrato Inteligente en Soroban (Stellar)

> Contrato de token fungible ERC-20-like desarrollado en Rust para la blockchain Stellar usando Soroban SDK. Implementa el estándar CAP-46 con funcionalidades completas de token.

## 📋 Descripción

Token BDB (Buen Día Builders) es un token fungible que implementa el estándar CAP-46 de Stellar, compatible con wallets, DEXs y el ecosistema completo de Stellar.

### Características Principales
- ✅ **Inicialización única** con metadatos completos
- ✅ **Mint controlado** solo por administrador
- ✅ **Transferencias** entre cuentas con validaciones
- ✅ **Sistema de allowances** para gastos delegados
- ✅ **Burn de tokens** para reducir supply
- ✅ **Eventos ricos** para tracking de operaciones
- ✅ **Validaciones robustas** de seguridad

## 🏗️ Estructura del Contrato

### Tipos de Error
```rust
AlreadyInitialized    // El contrato ya fue inicializado
NotInitialized        // El contrato no ha sido inicializado  
InvalidMetadata       // Nombre o símbolo inválidos
InvalidDecimals       // Decimales fuera del rango 0-18
InvalidAmount         // Amount <= 0
InsufficientBalance   // Balance insuficiente para operación
InsufficientAllowance // Allowance insuficiente
OverflowError         // Overflow en operaciones aritméticas
InvalidRecipient      // Transferencia a sí mismo
SameAccount          // Cuentas origen y destino iguales
```

### Funciones Principales
initialize(env, admin, name, symbol, decimals)

Inicializa el token con metadatos y administrador.

 - Solo una vez por contrato
 - Configura: admin, name, symbol, decimals
 - Valida: metadatos y rangos

mint(env, to, amount)

Crea nuevos tokens (solo admin).

 - Requiere: autorización del admin
 - Aumenta: balance y total supply
 - Valida: amount > 0

burn(env, from, amount)

Quema tokens reduciendo el supply.

 - Requiere: autorización del owner
 - Reduce: balance y total supply
 - transfer(env, from, to, amount)

Transfiere tokens entre cuentas.

 - Valida: balances, amount, cuentas diferentes

approve(env, from, spender, amount)

 - Aprueba gastos delegados.
 - Permite: spender gaste hasta amount
 - Revocar: con amount = 0

transfer_from(env, spender, from, to, amount)

 - Transfiere en nombre de otro usuario.
 - Requiere: allowance previo
 - Reduce: allowance automáticamente

### 🚀 Requisitos Previos

 - Rust (versión estable)
 - Stellar CLI
 - Target wasm32-unknown-unknown

#### Instalación
```bash
	# Rust
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

	# Stellar CLI  
	cargo install --locked stellar-cli

	# Target WASM
	rustup target add wasm32-unknown-unknown
```

### 🛠️ Configuración
**Estructura del Proyecto**

```text
	token_bdb/
	├── Cargo.toml
	├── src/
	│   ├── lib.rs
	│   ├── storage.rs
	│   ├── errors.rs
	│   └── test.rs
	└── .gitignore
```

**Dependencias (Cargo.toml)**
```toml
	[package]
	name = "token_bdb"
	version = "0.1.0"
	edition = "2021"

	[lib]
	crate-type = ["cdylib", "rlib"]

	[dependencies]
	soroban-sdk = "23.0.2"

	[dev_dependencies]
	soroban-sdk = { version = "23.0.2", features = ["testutils"] }

	[profile.release]
	opt-level = "z"
	overflow-checks = true
	debug = 0
	strip = "symbols"
	debug-assertions = false
	panic = "abort"
	codegen-units = 1
	lto = true
```
---

### 📦 Compilación y Deploy
**Compilar**
```bash
	cargo build --target wasm32-unknown-unknown --release
```

**Deploy en Testnet**
```bash
	stellar contract deploy \
		--wasm target/wasm32-unknown-unknown/release/token_bdb.wasm \
		--source StellarKP1 \
		--network testnet
```

**Inicializar Token**
```bash
	stellar contract invoke \
		--id [CONTRACT_ID] \
		--source StellarKP1 \
		--network testnet \
		-- \
		initialize \
		--admin StellarKP1 \
		--name "Builder Token" \
		--symbol "BDB" \
		--decimals 7
```
---
### 🧪 Suite de Tests
***Tests Implementados (12 tests completos)***

[X] test_initialize - Verifica inicialización básica

[X] test_initialize_twice_fails - Protección contra doble inicialización

[X] test_invalid_decimals - Valida rango 0-18 decimales

[X] test_mint_and_balance - Flujo completo de mint

[X] test_mint_zero_fails - Previene mint de 0 tokens

[X] test_transfer - Transferencia básica entre cuentas

[X] test_transfer_insufficient_balance - Protege transferencia sin fondos

[X] test_transfer_to_self - Evita transferencias a sí mismo

[X] test_approve_and_transfer_from - Flujo completo de allowance

[X] test_transfer_from_insufficient_allowance - Protege allowance excedido

[X] test_burn - Funcionalidad de quemar tokens

[X] test_operations_without_init - Todas las operaciones requieren inicialización

	Ejecutar Tests:
	
```bash
	# Todos los tests
	cargo test

	# Test específico
	cargo test test_initialize -- --nocapture

	# Con detalles
	cargo test -- --nocapture
```

---

### 🐛 Problemas Encontrados y Soluciones
 - *1. Error de Certificados SSL en Deploy*

	Problema:
```bash
	❌ error: Networking or low-level protocol error: HTTP error: invalid peer certificate: UnknownIssuer
```
	Solución:

```bash
	# Descargar certificados actualizados
	wget https://curl.se/ca/cacert.pem
	export SSL_CERT_FILE=$(pwd)/cacert.pem

	# Configurar permanentemente en ~/.bashrc
	echo 'export SSL_CERT_FILE=/path/to/cacert.pem' >> ~/.bashrc
```
 - *2. Configuración de Red en Stellar CLI 23.x*

	Problema: Comandos de red cambiaron.

	Solución:

```bash	
	# Agregar red testnet
	stellar network add testnet \
	  --rpc-url https://soroban-testnet.stellar.org/ \
	  --network-passphrase "Test SDF Network ; September 2015"
```

 - *3. Manejo de Errores en Tests*

	Problema: .unwrap() e .is_ok() no funcionan con funciones que devuelven ().

	Solución:

```bash
	// ❌ Incorrecto
	client.initialize(...).unwrap();

	// ✅ Correcto  
	client.initialize(...);
```

 - *4. Duplicación de Estructuras de Eventos*

	Problema: Error de compilación por TransferFromEvent definido dos veces.

	Solución: Eliminar definición duplicada y mantener una sola.

 - *6. Función transfer_from Incompleta*

Problema: Código fuera de lugar causando errores de sintaxis.

Solución: Reestructurar función completa con firma correcta.
---

### 🎯 Contract ID Desplegado

Testnet: CB************PCIH6Q62DZXMKDCSB4DGFCJDSRKV************6D

Explorer: https://stellar.expert/explorer/testnet/contract/CB************PCIH6Q62DZXMKDCSB4DGFCJDSRKV************6D

#### 📊 Métricas del Contrato

    ✅ 12 Tests - Cobertura completa de funcionalidades

    ✅ 6 Eventos - Tracking detallado de operaciones

    ✅ 11 Funciones - Implementación completa CAP-46

    ✅ 10 Validaciones - Seguridad robusta

    ✅ Deploy Exitoso - Operativo en Testnet

#### 🔧 Configuración de Desarrollo
***Variables de Entorno***

```bash
	# Para conexión SSL
	export SSL_CERT_FILE=/path/to/cacert.pem
	export SSL_CERT_DIR=/etc/ssl/certs
```

# Para desarrollo local
stellar container start

***Comandos Útiles***

```bash
# Verificar redes configuradas
stellar network ls

# Diagnosticar problemas
stellar doctor

# Limpiar y recompilar
cargo clean && cargo build --release --target wasm32-unknown-unknown
```
---
### 📚 Recursos Adicionales

 - Documentación Soroban
 - Estándar CAP-46
 - Stellar Developer Discord
 - Ejemplos de Contratos

### 👥 Autor

Desarrollado como parte del programa Codigo Futura de Buen Día Builder - BDB, con el apoyo de Stellar y Builder Aselerator Funsation.
📄 Licencia

Este proyecto es de código abierto para fines educativos y de desarrollo en el ecosistema Stellar.

***✨ Token BDB - Construyendo el futuro de las finanzas descentralizadas***
