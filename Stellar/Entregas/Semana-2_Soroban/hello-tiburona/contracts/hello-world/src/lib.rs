#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype,
    Env, Symbol, Address, String
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NombreVacio = 1,
    NombreMuyLargo = 2,
    NoAutorizado = 3,
    NoInicializado = 4,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ContadorSaludos,
    UltimoSaludo(Address),
}

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        // Antes de instanciar, verificamos si ya existe un admin
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NoInicializado);
        }
        
        env.storage()
            .instance()
            .set(&DataKey::Admin, &admin);
        
        env.storage()
            .instance()
            .set(&DataKey::ContadorSaludos, &0u32);
        
        env.storage()
            .instance()
            .extend_ttl(100, 100);
        
        Ok(())
    }
    
    pub fn hello(env: Env, usuario: Address, nombre: String) -> Result<Symbol, Error> {
        // Primero validar que el dato no este vacio
        if nombre.len() == 0 {
            return Err(Error::NombreVacio);
        }
        // Validar que el dato no desborde el tipo de dato
        if nombre.len() > 32 {
            return Err(Error::NombreMuyLargo);
        }
        
        // Leer, modificar y guardar contador de saludos
        let key_contador = DataKey::ContadorSaludos;
        
        let contador: u32 = env.storage()
            .instance()
            .get(&key_contador)
            .unwrap_or(0);
        
        env.storage()
            .instance()
            .set(&key_contador, &(contador + 1));

        // Estender TTL para poder guardar los datos
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::UltimoSaludo(usuario), 100, 100);
        
        env.storage()
            .instance()
            .extend_ttl(100, 100);

        // Retorno final del saludo
        Ok(Symbol::new(&env, "Hola Tiburona!"))
        
    }
}
