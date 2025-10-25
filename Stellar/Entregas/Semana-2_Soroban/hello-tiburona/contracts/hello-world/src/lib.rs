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
pub struct HelloTiburonaContract;


#[contractimpl]
impl HelloTiburonaContract {
    pub fn hello_tiburona(env: Env, to: String) -> Vec<String> {
        vec![&env, String::from_str(&env, "¡Hola Tiburona!"), to]
    }
}

mod test;
