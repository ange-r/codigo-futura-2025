// src/lib.rs
// Token BDB (Buen Día Builders) - Versión Corregida para SDK 23.0.2
//
// CAMBIOS PRINCIPALES respecto al código de las profesoras:
// 1. ❌ ELIMINADO: trait TokenTrait
//    ✅ RAZÓN: El trait con Result<(), TokenError> causa conflictos con el cliente
//              autogenerado que espera funciones que retornen () directamente
//
// 2. ❌ ELIMINADO: Result<(), TokenError> en funciones públicas
//    ✅ RAZÓN: SDK 23.x maneja errores con panic_with_error!() internamente
//              Esto genera un ABI más limpio y compatible con wallets/CLI
//
// 3. ❌ ELIMINADO: contractevent con structs complejos
//    ✅ RAZÓN: Los eventos con publish() deprecados siguen funcionando y son más simples
//              Para producción se recomienda #[contractevent], pero agrega complejidad
//
// 4. ✅ AGREGADO: Manejo de errores con panic_with_error!()
//    ✅ RAZÓN: Forma estándar en SDK 23.x, funciona con tests sin modificarlos

#![no_std]

use soroban_sdk::{
    contract, contractimpl, Address, Env, String, 
    symbol_short, panic_with_error
};

mod storage;
mod errors;

use storage::DataKey;
use errors::TokenError;

/// Constantes de configuración
const MAX_DECIMALS: u32 = 18;
const MAX_NAME_LENGTH: u32 = 100;
const MAX_SYMBOL_LENGTH: u32 = 32;

// ============================================================================
// CONTRATO PRINCIPAL
// ============================================================================

#[contract]
pub struct TokenBDB;

// CAMBIO 1: Implementación directa SIN trait
// ANTES: #[contractimpl] impl TokenTrait for TokenBDB
// AHORA: #[contractimpl] impl TokenBDB
// RAZÓN: Evita problemas de tipos con el cliente autogenerado
#[contractimpl]
impl TokenBDB {
    
    // CAMBIO 2: Función retorna () en lugar de Result<(), TokenError>
    // ANTES: fn initialize(...) -> Result<(), TokenError>
    // AHORA: pub fn initialize(...) [retorna () implícito]
    // RAZÓN: Los errores se manejan con panic_with_error!() internamente
    //        Esto hace que los tests funcionen con .unwrap() sin problemas
    /// Inicializa el token con metadatos y admin
    /// 
    /// NOTA: Esta función solo puede llamarse UNA vez
    /// Panic si ya está inicializado o si los parámetros son inválidos
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) {
        // CAMBIO 3: Manejo de errores con panic_with_error! en lugar de return Err()
        // ANTES: if ... { return Err(TokenError::AlreadyInitialized); }
        // AHORA: if ... { panic_with_error!(&env, TokenError::AlreadyInitialized); }
        // RAZÓN: panic_with_error! es la forma correcta en SDK 23.x
        //        Genera eventos de error automáticamente en el ledger
        
        if env.storage().instance().has(&DataKey::Initialized) {
            panic_with_error!(&env, TokenError::AlreadyInitialized);
        }

        // Validaciones de parámetros
        if name.len() == 0 || name.len() > MAX_NAME_LENGTH {
            panic_with_error!(&env, TokenError::InvalidMetadata);
        }
        if symbol.len() == 0 || symbol.len() > MAX_SYMBOL_LENGTH {
            panic_with_error!(&env, TokenError::InvalidMetadata);
        }
        if decimals > MAX_DECIMALS {
            panic_with_error!(&env, TokenError::InvalidDecimals);
        }

        // CAMBIO 4: admin.require_auth() ya maneja la autenticación
        // No necesitamos validación adicional
        admin.require_auth();

        // Guardar estado en storage
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenName, &name);
        env.storage().instance().set(&DataKey::TokenSymbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);

        // CAMBIO 5: Eventos simples con env.events().publish()
        // ANTES: InitEvent { ... }.publish(&env);
        // AHORA: env.events().publish(...)
        // RAZÓN: Más simple, funciona igual, menos código
        //        Los warnings de "deprecated" son solo sugerencias, no errores
        env.events().publish(
            (symbol_short!("init"), admin.clone()),
            (name, symbol, decimals)
        );
    }

    /// Crea nuevos tokens (solo admin)
    pub fn mint(env: Env, to: Address, amount: i128) {
        // Validación de amount
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        // CAMBIO 6: Uso de expect() en lugar de ok_or() cuando esperamos que exista
        // RAZÓN: Si no está inicializado, el contrato no debería estar en uso
        //        expect() da mejor mensaje de error para debugging
        let admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Token not initialized");

        admin.require_auth();

        // Obtener balance actual
        let balance_key = DataKey::Balance(to.clone());
        let current_balance: i128 = env.storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0);

        // CAMBIO 7: Manejo de overflow con unwrap_or_else
        // ANTES: .ok_or(TokenError::Overflow)?
        // AHORA: .unwrap_or_else(|| panic_with_error!(...))
        // RAZÓN: Consistente con el patrón sin Result<>
        let new_balance = current_balance
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, TokenError::OverflowError));

        // Actualizar balance con TTL
        env.storage().persistent().set(&balance_key, &new_balance);
        env.storage()
            .persistent()
            .extend_ttl(&balance_key, 5184000, 6048000);

        // Actualizar total supply
        let total_supply: i128 = env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);

        let new_total_supply = total_supply
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, TokenError::OverflowError));

        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &new_total_supply);

        // Emitir evento
        env.events().publish(
            (symbol_short!("mint"), to.clone()),
            (amount, new_balance, new_total_supply)
        );
    }

    /// Destruye tokens reduciendo el supply
    pub fn burn(env: Env, from: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        from.require_auth();

        let balance_key = DataKey::Balance(from.clone());
        let current_balance: i128 = env.storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0);

        if current_balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        let new_balance = current_balance - amount;

        // Optimización: eliminar key si balance queda en 0
        if new_balance == 0 {
            env.storage().persistent().remove(&balance_key);
        } else {
            env.storage().persistent().set(&balance_key, &new_balance);
            env.storage()
                .persistent()
                .extend_ttl(&balance_key, 5184000, 6048000);
        }

        // Actualizar total supply
        let total_supply: i128 = env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);

        let new_total_supply = total_supply
            .checked_sub(amount)
            .unwrap_or_else(|| panic_with_error!(&env, TokenError::OverflowError));

        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &new_total_supply);

        env.events().publish(
            (symbol_short!("burn"), from),
            (amount, new_balance, new_total_supply)
        );
    }

    /// Consulta el balance de una cuenta
    /// 
    /// CAMBIO 8: Esta función SÍ retorna un valor (i128)
    /// RAZÓN: Las funciones de consulta (getters) no modifican estado
    ///        Solo las funciones que modifican estado usan panic_with_error
    pub fn balance(env: Env, id: Address) -> i128 {
        let balance_key = DataKey::Balance(id);
        env.storage().persistent().get(&balance_key).unwrap_or(0)
    }

    /// Transfiere tokens entre cuentas
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
    ) {
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        // CAMBIO 9: Validación de transferencia a sí mismo
        // ANTES: El código de las profes usaba error SameAccount
        // AHORA: Usamos InvalidRecipient (más claro)
        if from == to {
            panic_with_error!(&env, TokenError::InvalidRecipient);
        }

        from.require_auth();

        let from_key = DataKey::Balance(from.clone());
        let from_balance: i128 = env.storage()
            .persistent()
            .get(&from_key)
            .unwrap_or(0);

        if from_balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        // Actualizar balance del sender
        let new_from_balance = from_balance - amount;
        if new_from_balance == 0 {
            env.storage().persistent().remove(&from_key);
        } else {
            env.storage().persistent().set(&from_key, &new_from_balance);
            env.storage()
                .persistent()
                .extend_ttl(&from_key, 5184000, 6048000);
        }

        // Actualizar balance del receiver
        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage()
            .persistent()
            .get(&to_key)
            .unwrap_or(0);

        let new_to_balance = to_balance
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, TokenError::OverflowError));

        env.storage().persistent().set(&to_key, &new_to_balance);
        env.storage()
            .persistent()
            .extend_ttl(&to_key, 5184000, 6048000);

        env.events().publish(
            (symbol_short!("transfer"), from, to),
            (amount, new_from_balance, new_to_balance)
        );
    }

    /// Aprueba a otro usuario para gastar tokens
    /// 
    /// CAMBIO 10: Simplificación de approve
    /// ANTES: approve(..., live_until_ledger: u32)
    /// AHORA: approve(...) sin live_until_ledger
    /// RAZÓN: El TTL se maneja automáticamente con extend_ttl
    ///        live_until_ledger era un parámetro redundante
    pub fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
    ) {
        // Permitir amount = 0 para revocar allowance
        if amount < 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        from.require_auth();

        let allowance_key = DataKey::Allowance(from.clone(), spender.clone());

        if amount == 0 {
            env.storage().persistent().remove(&allowance_key);
        } else {
            env.storage().persistent().set(&allowance_key, &amount);
            env.storage()
                .persistent()
                .extend_ttl(&allowance_key, 5184000, 6048000);
        }

        env.events().publish(
            (symbol_short!("approve"), from, spender),
            amount
        );
    }

    /// Consulta el allowance entre dos cuentas
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let allowance_key = DataKey::Allowance(from, spender);
        env.storage().persistent().get(&allowance_key).unwrap_or(0)
    }

    /// Transfiere tokens en nombre de otro usuario
    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) {
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        if from == to {
            panic_with_error!(&env, TokenError::InvalidRecipient);
        }

        spender.require_auth();

        // Verificar allowance
        let allowance_key = DataKey::Allowance(from.clone(), spender.clone());
        let current_allowance: i128 = env.storage()
            .persistent()
            .get(&allowance_key)
            .unwrap_or(0);

        if current_allowance < amount {
            panic_with_error!(&env, TokenError::InsufficientAllowance);
        }

        // Verificar balance
        let from_key = DataKey::Balance(from.clone());
        let from_balance: i128 = env.storage()
            .persistent()
            .get(&from_key)
            .unwrap_or(0);

        if from_balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        // Actualizar balance del owner
        let new_from_balance = from_balance - amount;
        if new_from_balance == 0 {
            env.storage().persistent().remove(&from_key);
        } else {
            env.storage().persistent().set(&from_key, &new_from_balance);
            env.storage()
                .persistent()
                .extend_ttl(&from_key, 5184000, 6048000);
        }

        // Actualizar balance del receiver
        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage()
            .persistent()
            .get(&to_key)
            .unwrap_or(0);

        let new_to_balance = to_balance
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, TokenError::OverflowError));

        env.storage().persistent().set(&to_key, &new_to_balance);
        env.storage()
            .persistent()
            .extend_ttl(&to_key, 5184000, 6048000);

        // Reducir allowance
        let new_allowance = current_allowance - amount;
        if new_allowance == 0 {
            env.storage().persistent().remove(&allowance_key);
        } else {
            env.storage().persistent().set(&allowance_key, &new_allowance);
            env.storage()
                .persistent()
                .extend_ttl(&allowance_key, 5184000, 6048000);
        }

        env.events().publish(
            (symbol_short!("trnsf_frm"), spender, from.clone(), to.clone()),
            (amount, new_from_balance, new_to_balance, new_allowance)
        );
    }

    // GETTERS (Funciones de consulta)
    // NOTA: Estas funciones SÍ retornan valores porque no modifican estado

    pub fn name(env: Env) -> String {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return String::from_str(&env, "");
        }

        env.storage()
            .instance()
            .get(&DataKey::TokenName)
            .unwrap_or(String::from_str(&env, ""))
    }

    pub fn symbol(env: Env) -> String {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return String::from_str(&env, "");
        }

        env.storage()
            .instance()
            .get(&DataKey::TokenSymbol)
            .unwrap_or(String::from_str(&env, ""))
    }

    pub fn decimals(env: Env) -> u32 {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return 0;
        }

        env.storage().instance().get(&DataKey::Decimals).unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    pub fn admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not initialized")
    }
}

#[cfg(test)]
mod test;


/* // src/lib.rs
#![no_std]

use soroban_sdk::{
    contract, contractimpl, Address, Env, String, 
    symbol_short,
};

mod storage;
mod errors;

use storage::{DataKey, TokenMetadata};
use errors::TokenError;

/// Constantes de configuración
const MAX_DECIMALS: u32 = 18;
const MAX_NAME_LENGTH: u32 = 100;
const MAX_SYMBOL_LENGTH: u32 = 32;

/// Trait que define la interfaz del token según CAP-46
/// 
/// Esta es la interfaz estándar de tokens fungibles en Stellar
/// Compatible con wallets, DEXs, y el ecosistema completo
pub trait TokenTrait {
    /// Inicializa el token con metadatos y admin
    /// 
    /// Puede ser llamado solo una vez. Configura:
    /// - Admin: cuenta con permisos para mintear
    /// - Name: nombre completo del token
    /// - Symbol: identificador corto (ej: BDB, USDC)
    /// - Decimals: precisión del token (7 para Stellar)
    fn initialize(
        env: Env, 
        admin: Address, 
        name: String, 
        symbol: String,
        decimals: u32
    ) -> Result<(), TokenError>;
    
    /// Crea nuevos tokens (solo admin)
    /// 
    /// Aumenta el supply total y el balance del destinatario
    /// Requiere autorización del admin
    fn mint(env: Env, to: Address, amount: i128) -> Result<(), TokenError>;
    
    /// Destruye tokens reduciendo el supply
    /// 
    /// Reduce el supply total y el balance del owner
    /// Requiere autorización del owner
    fn burn(env: Env, from: Address, amount: i128) -> Result<(), TokenError>;
    
    /// Consulta el balance de una cuenta
    /// 
    /// Devuelve 0 si la cuenta nunca ha recibido tokens
    fn balance(env: Env, account: Address) -> i128;
    
    /// Transfiere tokens entre cuentas
    /// 
    /// Requiere autorización de `from`
    /// No permite transferencias a sí mismo
    fn transfer(
        env: Env, 
        from: Address, 
        to: Address, 
        amount: i128
    ) -> Result<(), TokenError>;
    
    /// Aprueba a otro usuario para gastar tokens
    /// 
    /// Permite que `spender` gaste hasta `amount` tokens
    /// de la cuenta de `from`. Se puede revocar con amount=0
    fn approve(
        env: Env, 
        from: Address, 
        spender: Address, 
        amount: i128
    ) -> Result<(), TokenError>;
    
    /// Consulta el allowance entre dos cuentas
    /// 
    /// Devuelve cuánto puede gastar `spender` de los tokens de `from`
    fn allowance(env: Env, from: Address, spender: Address) -> i128;
    
    /// Transfiere tokens en nombre de otro usuario
    /// 
    /// Requiere allowance previo mediante approve()
    /// Reduce el allowance automáticamente
    fn transfer_from(
        env: Env, 
        spender: Address, 
        from: Address, 
        to: Address, 
        amount: i128
    ) -> Result<(), TokenError>;
    
    // Métodos de consulta (getters)
    fn name(env: Env) -> String;
    fn symbol(env: Env) -> String;
    fn decimals(env: Env) -> u32;
    fn total_supply(env: Env) -> i128;
    fn admin(env: Env) -> Address;
}

/// Estructura del contrato Token BDB
#[contract]
pub struct TokenBDB;

/// Implementación del contrato
#[contractimpl]
impl TokenTrait for TokenBDB {
    fn initialize(
        env: Env, 
        admin: Address, 
        name: String, 
        symbol: String,
        decimals: u32
    ) -> Result<(), TokenError> {
        // 1. Verificar que no esté inicializado
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(TokenError::AlreadyInitialized);
        }
        
        // 2. Validar decimales (máximo 18 como Ethereum)
        if decimals > MAX_DECIMALS {
            return Err(TokenError::InvalidDecimals);
        }
        
        // 3. Validar metadatos (name y symbol no vacíos)
        // Nota: String en Soroban no tiene .len() directo,
        // pero podemos convertir a bytes para validar
        if name.len() == 0 || name.len() > MAX_NAME_LENGTH {
            return Err(TokenError::InvalidMetadata);
        }
        
        if symbol.len() == 0 || symbol.len() > MAX_SYMBOL_LENGTH {
            return Err(TokenError::InvalidMetadata);
        }
        
        // 4. Guardar metadata en instance storage
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenName, &name);
        env.storage().instance().set(&DataKey::TokenSymbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);
        env.storage().instance().set(&DataKey::Initialized, &true);
        
        // 5. Extender TTL del storage de instance (30 días)
        env.storage().instance().extend_ttl(100_000, 200_000);
        
        // 6. Emitir evento rico con todos los metadatos
        env.events().publish(
            (symbol_short!("init"), admin.clone()),
            TokenMetadata {
                name: name.clone(),
                symbol: symbol.clone(),
                decimals,
            }
        );
        
        Ok(())
    }
    
    fn mint(env: Env, to: Address, amount: i128) -> Result<(), TokenError> {
        // 1. Verificar inicialización
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(TokenError::NotInitialized);
        }
        
        // 2. Solo el admin puede mintear
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .ok_or(TokenError::NotInitialized)?;
        admin.require_auth();
        
        // 3. Validaciones
        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }
        
        // 4. Validar que `to` no sea igual a `admin` (opcional, pero buena práctica)
        // Esto evita que el admin se mintee tokens a sí mismo por error
        
        // 5. Obtener balance actual y verificar overflow
        let balance = Self::balance(env.clone(), to.clone());
        let new_balance = balance.checked_add(amount)
            .ok_or(TokenError::OverflowError)?;
        
        // 6. Actualizar balance con TTL extendido
        env.storage().persistent().set(
            &DataKey::Balance(to.clone()), 
            &new_balance
        );
        env.storage().persistent().extend_ttl(
            &DataKey::Balance(to.clone()),
            100_000,
            200_000
        );
        
        // 7. Actualizar total supply
        let total: i128 = env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        let new_total = total.checked_add(amount)
            .ok_or(TokenError::OverflowError)?;
        env.storage().instance().set(
            &DataKey::TotalSupply, 
            &new_total
        );
        
        // 8. Emitir evento detallado
        env.events().publish(
            (symbol_short!("mint"), to.clone()), 
            (amount, new_balance, new_total)
        );
        
        Ok(())
    }
    
    fn burn(env: Env, from: Address, amount: i128) -> Result<(), TokenError> {
        // 1. Verificar inicialización
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(TokenError::NotInitialized);
        }
        
        // 2. Requiere autorización del dueño de los tokens
        from.require_auth();
        
        // 3. Validaciones
        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }
        
        let balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            return Err(TokenError::InsufficientBalance);
        }
        
        // 4. Actualizar balance
        let new_balance = balance - amount;
        if new_balance == 0 {
            // Optimización: eliminar key si balance = 0
            env.storage().persistent().remove(&DataKey::Balance(from.clone()));
        } else {
            env.storage().persistent().set(
                &DataKey::Balance(from.clone()),
                &new_balance
            );
            env.storage().persistent().extend_ttl(
                &DataKey::Balance(from.clone()),
                100_000,
                200_000
            );
        }
        
        // 5. Actualizar total supply
        let total: i128 = env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        let new_total = total.checked_sub(amount)
            .ok_or(TokenError::OverflowError)?;
        env.storage().instance().set(
            &DataKey::TotalSupply,
            &new_total
        );
        
        // 6. Emitir evento
        env.events().publish(
            (symbol_short!("burn"), from),
            (amount, new_balance, new_total)
        );
        
        Ok(())
    }
    
    fn balance(env: Env, account: Address) -> i128 {
        env.storage().persistent()
            .get(&DataKey::Balance(account))
            .unwrap_or(0)
    }
    
    fn transfer(
        env: Env, 
        from: Address, 
        to: Address, 
        amount: i128
    ) -> Result<(), TokenError> {
        // 1. Verificar inicialización
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(TokenError::NotInitialized);
        }
        
        // 2. Verificar autorización del sender
        from.require_auth();
        
        // 3. Validaciones
        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }
        
        // 4. No permitir transferencia a sí mismo (gas-efficient)
        if from == to {
            return Err(TokenError::InvalidRecipient);
        }
        
        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }
        
        // 5. Calcular nuevos balances con verificación de overflow
        let new_from_balance = from_balance - amount;
        let to_balance = Self::balance(env.clone(), to.clone());
        let new_to_balance = to_balance.checked_add(amount)
            .ok_or(TokenError::OverflowError)?;
        
        // 6. Actualizar balances con TTL
        // Optimización: si from_balance = 0, eliminar key
        if new_from_balance == 0 {
            env.storage().persistent().remove(&DataKey::Balance(from.clone()));
        } else {
            env.storage().persistent().set(
                &DataKey::Balance(from.clone()),
                &new_from_balance
            );
            env.storage().persistent().extend_ttl(
                &DataKey::Balance(from.clone()),
                100_000,
                200_000
            );
        }
        
        env.storage().persistent().set(
            &DataKey::Balance(to.clone()),
            &new_to_balance
        );
        env.storage().persistent().extend_ttl(
            &DataKey::Balance(to.clone()),
            100_000,
            200_000
        );
        
        // 7. Emitir evento con balances post-transferencia
        env.events().publish(
            (symbol_short!("transfer"), from, to), 
            (amount, new_from_balance, new_to_balance)
        );
        
        Ok(())
    }
    
    fn approve(
        env: Env, 
        from: Address, 
        spender: Address, 
        amount: i128
    ) -> Result<(), TokenError> {
        // 1. Verificar inicialización
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(TokenError::NotInitialized);
        }
        
        // 2. Verificar autorización del owner
        from.require_auth();
        
        // 3. Validación: amount debe ser >= 0 (permitir 0 para revocar)
        if amount < 0 {
            return Err(TokenError::InvalidAmount);
        }
        
        // 4. Obtener allowance anterior para el evento
        let old_allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        
        // 5. Actualizar allowance
        if amount == 0 {
            // Optimización: eliminar key si allowance = 0
            env.storage().persistent().remove(
                &DataKey::Allowance(from.clone(), spender.clone())
            );
        } else {
            env.storage().persistent().set(
                &DataKey::Allowance(from.clone(), spender.clone()),
                &amount
            );
            env.storage().persistent().extend_ttl(
                &DataKey::Allowance(from.clone(), spender.clone()),
                100_000,
                200_000
            );
        }
        
        // 6. Evento mejorado con allowance anterior y nuevo
        env.events().publish(
            (symbol_short!("approve"), from, spender),
            (old_allowance, amount)
        );
        
        Ok(())
    }
    
    fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage().persistent()
            .get(&DataKey::Allowance(from, spender))
            .unwrap_or(0)
    }
    
    fn transfer_from(
        env: Env, 
        spender: Address, 
        from: Address, 
        to: Address, 
        amount: i128
    ) -> Result<(), TokenError> {
        // 1. Verificar inicialización
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(TokenError::NotInitialized);
        }
        
        // 2. Verificar autorización del spender
        spender.require_auth();
        
        // 3. Validaciones
        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }
        
        // 4. No permitir transferencia a sí mismo
        if to == from {
            return Err(TokenError::InvalidRecipient);
        }
        
        // 5. Verificar allowance
        let allowed = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowed < amount {
            return Err(TokenError::InsufficientAllowance);
        }
        
        // 6. Verificar balance
        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }
        
        // 7. Calcular nuevos valores
        let new_from_balance = from_balance - amount;
        let to_balance = Self::balance(env.clone(), to.clone());
        let new_to_balance = to_balance.checked_add(amount)
            .ok_or(TokenError::OverflowError)?;
        let new_allowance = allowed - amount;
        
        // 8. Actualizar estado atómicamente
        // Optimización: eliminar keys si son 0
        if new_from_balance == 0 {
            env.storage().persistent().remove(&DataKey::Balance(from.clone()));
        } else {
            env.storage().persistent().set(
                &DataKey::Balance(from.clone()),
                &new_from_balance
            );
            env.storage().persistent().extend_ttl(
                &DataKey::Balance(from.clone()),
                100_000,
                200_000
            );
        }
        
        env.storage().persistent().set(
            &DataKey::Balance(to.clone()),
            &new_to_balance
        );
        env.storage().persistent().extend_ttl(
            &DataKey::Balance(to.clone()),
            100_000,
            200_000
        );
        
        if new_allowance == 0 {
            env.storage().persistent().remove(
                &DataKey::Allowance(from.clone(), spender.clone())
            );
        } else {
            env.storage().persistent().set(
                &DataKey::Allowance(from.clone(), spender.clone()),
                &new_allowance
            );
            env.storage().persistent().extend_ttl(
                &DataKey::Allowance(from.clone(), spender.clone()),
                100_000,
                200_000
            );
        }
        
        // 9. Emitir evento completo (FIX: evento faltante)
        env.events().publish(
            (symbol_short!("trnsf_frm"), spender, from.clone(), to.clone()),
            (amount, new_from_balance, new_to_balance, new_allowance)
        );
        
        Ok(())
    }
    
    // Métodos de consulta
    fn name(env: Env) -> String {
        // Verificar inicialización antes de devolver metadata
        if !env.storage().instance().has(&DataKey::Initialized) {
            return String::from_str(&env, "");
        }
        
        env.storage().instance()
            .get(&DataKey::TokenName)
            .unwrap_or(String::from_str(&env, ""))
    }
    
    fn symbol(env: Env) -> String {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return String::from_str(&env, "");
        }
        
        env.storage().instance()
            .get(&DataKey::TokenSymbol)
            .unwrap_or(String::from_str(&env, ""))
    }
    
    fn decimals(env: Env) -> u32 {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return 0;
        }
        
        env.storage().instance()
            .get(&DataKey::Decimals)
            .unwrap_or(0)
    }
    
    fn total_supply(env: Env) -> i128 {
        env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }
    
    fn admin(env: Env) -> Address {
        env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Admin not initialized")
    }
}

#[cfg(test)]
mod test;
*/