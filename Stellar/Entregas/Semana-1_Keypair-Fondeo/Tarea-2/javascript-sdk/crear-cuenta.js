//Crear nueva cuenta en Stellar

//Importo la librería
import{ Keypair, Horizon } from '@stellar/stellar-sdk';

// Configuro server con  Horizon 
const server = new Horizon.Server('https://horizon-tesnet.stellar.org');

//Función CREAR CUENTA
async function crearCuenta() {
    console.log('Generando nueva cuenta...');

  // Generar llaves aleatorias
  const pair = Keypair.random();
  
  console.log('Cuenta creada con éxito\n');
  console.log('PUBLIC KEY: ', pair.publicKey());
  console.log('\nSECRET KEY: ', pair.secret());

  //Fondear automáticamente con Fiendbot
  console.log('\nCargando fondos');
  try {
    const response = await fetch(
      `https://friendbot.stellar.org/?addr=${pair.publicKey()}`
    );
    
    const result = await response.json();
    
    if (result.successful || response.ok) {
      console.log('Cuenta fondeada con 10,000 XLM!\n');
      console.log('Transaction hash:', result.hash);
    }
  } catch (error) {
    console.error('Error al fondear:', error.message);
  }
  console.log('\nNECESARIO: Guarda estas llaves en un lugar seguro\n');
};

crearCuenta();