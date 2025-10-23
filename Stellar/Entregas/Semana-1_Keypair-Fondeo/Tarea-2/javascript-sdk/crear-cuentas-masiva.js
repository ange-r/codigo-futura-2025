/*
Archivo: crear-cuenta.js
Objetivo: Modificar el script para crear 5 cuentas automáticamente

Requisitos:
    Usar un bucle for para generar 5 keypairs
    Cada cuenta debe ser fondeada con Friendbot
    Mostrar en consola: public key, secret key y balance inicial de cada una
    Guardar toda la información en un array
*/

//Crear cuentas en Stellar

//Importo la librería
import{ Keypair, Horizon } from '@stellar/stellar-sdk';
import fs from 'fs';

// Configuro server con  Horizon 
const server = new Horizon.Server('https://horizon-testnet.stellar.org');

//Funcion guardar cuentas - NO LO PIDE, pero creo que deberia 
// guaradarlo en archivo .env para luego poder trabajar desde alli
function guardarCuentas(cuentas) {  
    let envData = '';
  cuentas.forEach((cuenta, index) => {
    envData += `# Cuenta ${cuenta.numeroCuenta}\n`;
    envData += `PUBLIC_KEY_${cuenta.numeroCuenta}=${cuenta.publicKey}\n`;
    envData += `SECRET_KEY_${cuenta.numeroCuenta}=${cuenta.secretKey}\n`;
    envData += `BALANCE_${cuenta.numeroCuenta}= 10000 XLM\n`;
  });
  
  fs.writeFileSync('./cuentas.env', envData);
  console.log('Claves guardadas en archivo: cuentas.env');
}

// VALIDA si las llaves son correctas
    function esPublicKeyValida(key) {
      return key.startsWith('G') && key.length === 56;
  }

//Función CREAR CUENTA
async function crearCuenta() {
  const cuentas= [];

  for (let i=0; i<5; i++) {
    console.log(`Generando nueva cuenta ${i+1}`);    
    const pair = Keypair.random(); // Generar llaves aleatorias
  
      if (!esPublicKeyValida(pair.publicKey())) {
        console.error('❌ Error: Public key inválida');
        continue; // Si una llave no esta bien, sigue el proceso siguiente, saltar a la siguiente iteración
      }
  
    console.log('Cuenta creada con éxito\n');
    console.log('PUBLIC KEY: ', pair.publicKey());
    console.log('\nSECRET KEY: ', pair.secret());

    console.log('\nCargando fondos');
        try { //Fondear automáticamente con Fiendbot
        const response = await fetch(`https://friendbot.stellar.org/?addr=${pair.publicKey()}`);
        const result = await response.json();
            if (result.successful || response.ok) {
              console.log('Cuenta fondeada con 10,000 XLM!\n');
              console.log('Transaction hash:', result.hash);
            }
        cuentas.push({  //Para cargar el array
            numeroCuenta: i + 1,
            publicKey: pair.publicKey(),
            secretKey: pair.secret(),
            balance: '10000 XLM'
        });
        } catch (error) {
        console.error('Error al fondear:', error.message);
        }
        console.log('\nNECESARIO: Guarda estas llaves en un lugar seguro\n');
    };
guardarCuentas(cuentas);
console.table(cuentas); //Esta seccion es solo corroborar que se ejecute en consola, pero no deberia mostrar las llaves.
}
crearCuenta();