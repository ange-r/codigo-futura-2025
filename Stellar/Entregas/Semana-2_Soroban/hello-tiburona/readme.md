# Hello Tiburona - Smart Contract en Soroban (Stellar)

> Contrato inteligente desarrollado en Rust para la blockchain Stellar usando el SDK de Soroban. Este proyecto implementa un sistema de saludos con control de acceso y gestión de estado.

### 📋 Descripción

Este contrato permite:
- Inicializar el contrato con un administrador
- Registrar saludos personalizados para usuarios
- Llevar un contador global de saludos
- Guardar el último saludo de cada usuario
- Resetear el contador (solo el administrador)

## 🏗️ Estructura del Contrato

### Tipos de Error
```rust
- NombreVacio (1): El nombre proporcionado está vacío
- NombreMuyLargo (2): El nombre excede los 32 caracteres
- NoAutorizado (3): El usuario no tiene permisos de administrador
- NoInicializado (4): El contrato no ha sido inicializado o ya existe un admin
```

### Funciones Principales

### `initialize(env, admin)`
Inicializa el contrato estableciendo un administrador y el contador en 0.
- **Parámetros**: 
  - `admin`: Dirección del administrador
- **Retorna**: `Result<(), Error>`

### `hello(env, usuario, nombre)`
Registra un saludo para un usuario específico.
- **Parámetros**:
  - `usuario`: Dirección del usuario que saluda
  - `nombre`: Nombre del usuario (1-32 caracteres)
- **Retorna**: `Result<Symbol, Error>` → `"hola_tiburona"`
- **Efectos secundarios**:
  - Incrementa el contador global
  - Guarda el último saludo del usuario
  - Extiende el TTL del storage

### `get_contador(env)`
Obtiene el número total de saludos registrados.
- **Retorna**: `u32`

### `get_ultimo_saludo(env, usuario)`
Obtiene el último saludo registrado por un usuario.
- **Parámetros**: 
  - `usuario`: Dirección del usuario
- **Retorna**: `Option<String>`

### `reset_contador(env, caller)`
Reinicia el contador de saludos a 0 (solo administrador).
- **Parámetros**: 
  - `caller`: Dirección del solicitante
- **Retorna**: `Result<(), Error>`

## 🚀 Requisitos Previos

- Rust (versión estable)
- Stellar CLI
- Target `wasm32-unknown-unknown`

### Instalación de Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Instalación de Stellar CLI
```bash
cargo install --locked stellar-cli
```

### Agregar target WASM
```bash
rustup target add wasm32-unknown-unknown
```

## 🛠️ Configuración del Proyecto

### Estructura de directorios
```
hello-tiburona/
├── Cargo.toml (workspace)
└── contracts/
    └── hello-world/
        ├── Cargo.toml
        └── src/
            └── lib.rs
```

### Cargo.toml (Raíz)
```toml
[workspace]
resolver = "2"
members = ["contracts/*"]

[workspace.dependencies]
soroban-sdk = "23.0.2"

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true

[profile.release-with-logs]
inherits = "release"
debug-assertions = true
```

### Cargo.toml (Contrato)
```toml
[package]
name = "hello-world"
version = "0.0.0"
edition = "2021"
publish = false

[lib]
crate-type = ["cdylib"]
doctest = false

[dependencies]
soroban-sdk = { workspace = true }

[dev-dependencies]
soroban-sdk = { workspace = true, features = ["testutils"] }
```

## 📦 Compilación

### Compilar para WASM (deployment)
```bash
cargo build --target wasm32-unknown-unknown --release
```

El archivo WASM se generará en:
```
target/wasm32-unknown-unknown/release/hello_world.wasm
```

### Compilar y ejecutar tests
```bash
cargo test
```

### Ver tests con detalle
```bash
cargo test -- --nocapture
```

### Limpiar y recompilar
```bash
cargo clean
cargo test
```

## 🧪 Tests Incluidos

El contrato incluye 5 tests:

1. **test_initialize**: Verifica la inicialización correcta del contrato
2. **test_hello_exitoso**: Prueba un saludo válido y verifica el incremento del contador
3. **test_nombre_vacio**: Valida que se rechacen nombres vacíos
4. **test_reset_solo_admin**: Verifica que solo el admin puede resetear
5. **test_reset_no_autorizado**: Valida que usuarios no autorizados no puedan resetear

### Ejecutar un test específico
```bash
cargo test test_hello_exitoso
```

## 🐛 Problemas Encontrados y Soluciones

Durante el desarrollo se encontraron varios problemas relacionados con la actualización del SDK de Soroban a la versión 23.x:

### 1. Tests con #[should_panic] ya no funcionan
**Error**: Los tests con `#[should_panic(expected = "NombreVacio")]` no encontraban el string esperado en el panic.

**Causa**: En SDK 23.x, los errores se manejan de forma diferente y no muestran el nombre del error directamente en el panic.

**Solución**: Usar métodos `try_*` en lugar de `#[should_panic]`:
```rust
// ❌ Antiguo (SDK < 23.x)
#[test]
#[should_panic(expected = "NombreVacio")]
fn test_nombre_vacio() {
    client.hello(&usuario, &vacio);
}

// ✅ Nuevo (SDK 23.x)
#[test]
fn test_nombre_vacio() {
    let resultado = client.try_hello(&usuario, &vacio);
    assert_eq!(resultado, Err(Ok(Error::NombreVacio)));
}
```
### 2. Método de registro de contrato deprecado
**Error**: El método `env.register_contract()` estaba siendo usado pero es obsoleto en SDK 23.x.

**Código antiguo**:
```rust
#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloContract);  // ❌ Deprecado
    let client = HelloContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    client.initialize(&admin);
    assert_eq!(client.get_contador(), 0);
}
```

**Causa**: En versiones recientes del SDK, el método `register_contract()` fue reemplazado por `register()` con una sintaxis más simple.

**Solución**: Usar el método `register()` actualizado:
```rust
#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(HelloContract, ());  // ✅ Correcto en SDK 23.x
    let client = HelloContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    client.initialize(&admin);
    assert_eq!(client.get_contador(), 0);
}
```

**Diferencias clave**:
- `register_contract(None, HelloContract)` → `register(HelloContract, ())`
- El segundo parámetro `()` representa los argumentos del constructor (vacío en este caso)
- Sintaxis más limpia y consistente con el resto del SDK
  

### 3. Address::generate() no encontrado
**Error**: 
```
error[E0599]: no function or associated item named `generate` found for struct `Address`
```

**Causa**: En Soroban SDK 23.x, `Address::generate()` se movió al módulo `testutils`.

**Solución**: Agregar el import del trait en el módulo de tests:
```rust
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;
    use soroban_sdk::testutils::Address as _;  // ⭐ Trait para generate()
}
```

## 📚 Recursos Adicionales

- [Documentación oficial de Soroban](https://soroban.stellar.org/docs)
- [Soroban SDK en crates.io](https://crates.io/crates/soroban-sdk)
- [Stellar Developer Discord](https://discord.gg/stellardev)
- [Ejemplos de contratos Soroban](https://github.com/stellar/soroban-examples)

## 📝 Notas

- El contrato usa storage persistente para guardar el último saludo de cada usuario
- El TTL (Time To Live) se extiende automáticamente en cada operación
- El administrador es inmutable una vez inicializado el contrato
- Los nombres deben tener entre 1 y 32 caracteres

## 👥 Autor

Desarrollado como parte del programa Codigo Futura de Buen Día Builder - BDB, con el apoyo de Stellar y Builder Aselerator Funsation. 

## 📄 Licencia

Este proyecto es de código abierto y está disponible para fines educativos.
