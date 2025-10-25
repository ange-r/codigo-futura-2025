#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Env};

#[contract]
pub struct ContadorContract;

#[contractimpl]
impl ContadorContract {

    pub fn increment(env: Env) -> u32 {
        let mut contador: u32 = env.storage()
            .instance()
            .get(&symbol_short!("COUNTER"))
            .unwrap_or(0);

        contador += 1;

        env.storage().instance().set(
            &symbol_short!("COUNTER"),
            &contador
        );

        env.events().publish(
            (symbol_short!("increment"),),
            contador
        );

        contador
    }

    pub fn decrement(env: Env) -> u32 {
        let mut contador: u32 = env.storage()
            .instance()
            .get(&symbol_short!("COUNTER"))
            .unwrap_or(0);

        if contador == 0 {
            panic!("No se puede decrementar: contador ya está en 0");
        }

        contador -= 1;

        env.storage().instance().set(
            &symbol_short!("COUNTER"),
            &contador
        );

        env.events().publish(
            (symbol_short!("decrement"),),
            contador
        );

        contador
    }

    pub fn get_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&symbol_short!("COUNTER"))
            .unwrap_or(0)
    }

    pub fn reset(env: Env) {
        env.storage().instance().set(
            &symbol_short!("COUNTER"),
            &0u32
        );

        env.events().publish(
            (symbol_short!("reset"),),
            0u32
        );
    }

    pub fn increment_by(env: Env, amount: u32) -> u32 {
        let mut contador: u32 = env.storage()
            .instance()
            .get(&symbol_short!("COUNTER"))
            .unwrap_or(0);

        let nuevo_valor = contador.checked_add(amount)
            .expect("Overflow: la suma excede el máximo permitido (MAX u32)");

        contador = nuevo_valor;

        env.storage().instance().set(
            &symbol_short!("COUNTER"),
            &contador
        );

        env.events().publish(
            (symbol_short!("inc_by"),),
            (amount, contador)
        );

        contador
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_increment() {
        let env = Env::default();
        let contract_id = env.register(ContadorContract, ());
        let client = ContadorContractClient::new(&env, &contract_id);

        assert_eq!(client.increment(), 1);
        assert_eq!(client.increment(), 2);
        assert_eq!(client.get_count(), 2);
    }

    #[test]
    fn test_decrement() {
        let env = Env::default();
        let contract_id = env.register(ContadorContract, ());
        let client = ContadorContractClient::new(&env, &contract_id);

        client.increment();
        client.increment();
        client.increment();

        assert_eq!(client.decrement(), 2);
        assert_eq!(client.get_count(), 2);
    }

#[test]
#[should_panic]
fn test_decrement_panic() {
    let env = Env::default();
    let contract_id = env.register(ContadorContract, ());
    let client = ContadorContractClient::new(&env, &contract_id);

    client.decrement();
}

    #[test]
    fn test_reset() {
        let env = Env::default();
        let contract_id = env.register(ContadorContract, ());
        let client = ContadorContractClient::new(&env, &contract_id);

        client.increment();
        client.increment();
        client.reset();

        assert_eq!(client.get_count(), 0);
    }
}
