/*
Archivo: cenviar-pago.js
Objetivo: Crear un sistema que envíe pagos a múltiples destinos

Requisitos:
    Enviar 2 XLM a 3 cuentas diferentes en una sola ejecución
    Cada pago debe tener un memo único identificando el número de transacción
    Verificar que cada transacción fue exitosa antes de proceder con la siguiente
    Mostrar el hash de cada transacción para seguimiento

*/

import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE, Memo } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';
    dotenv.config();

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

// Configurar red
const networkPassphrase = Networks.TESTNET;

// CREDENCIALES
const SECRET_KEY = process.env.SECRET_KEY;  //Cuenta a debitar (mi cuenta ahora)
const DESTINATIONS = [process.env.PUBLIC_KEY1, process.env.PUBLIC_KEY2, process.env.PUBLIC_KEY3, process.env.PUBLIC_KEY4, process.env.PUBLIC_KEY5]; //Cuentas destino


/* Función que enviaron las profes. 
   Elijo usar otro bucle for

async function enviarVariosPagos(destinatarios, amount) {
  for (const dest of destinatarios) {
    await enviarPago(amount, `Pago a ${dest}`);
    console.log(`✅ Enviado a ${dest}\n`);
  }
}

const cuentas = [process.env.PUBLIC_KEY1, process.env.PUBLIC_KEY2, process.env.PUBLIC_KEY3, process.env.PUBLIC_KEY4, process.env.PUBLIC_KEY5];
enviarVariosPagos(cuentas, '10');
*/

async function enviarPago() {  
  try {
    console.log('Iniciando pago...');
    
    // Cargar cuenta de origen
    const sourceKeys = Keypair.fromSecret(SECRET_KEY);
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
    console.log(`Balance actual: ${sourceAccount.balances[0].balance} XLM\n`);
    
    const pago = '2'; 
    
    //Bucle para hacer envio a varias cuenta a la vez
    // Cambiar parametro i<3 para enviar a mas o menos cuentas
    for (let i = 0; i < 3; i++) {
      console.log(`Enviando transacción #${i + 1}...`);
      
      // Cargo la cuenta de nuevo para obtener el sequence number actualizado
      // Cambio nombre de la variable para no confundirme
      const cuentaDebitar = await server.loadAccount(sourceKeys.publicKey());
      
      const transaction = new TransactionBuilder(cuentaDebitar, {
        fee: BASE_FEE,
        networkPassphrase: networkPassphrase
      })
      .addOperation(Operation.payment({
        destination: DESTINATIONS[i],
        asset: Asset.native(),
        amount: pago
      }))
      .addMemo(Memo.text(`Transacción #${i + 1}`))
      .setTimeout(50)
      .build();
      
    
    // Firmo
    transaction.sign(sourceKeys);
    
    // Push al servidor
    const result = await server.submitTransaction(transaction);
    
    console.log(`Transacción #${i + 1} exitosa`);
    console.log(`Enviaste: ${pago} XLM a ${DESTINATIONS[i]}...`);
    console.log(`Hash: ${result.hash}`);

    }
  } catch (error) {
    console.error('Error al enviar pago:', error);
    // MOSTRAR LOS DETALLES DEL ERROR DE STELLAR
        if (error.response && error.response.data && error.response.data.extras) {
            console.log('Detalles del error Stellar:');
            console.log('Result codes:', error.response.data.extras.result_codes);
            console.log('Envelope XDR:', error.response.data.extras.envelope_xdr);
        }
  }
}

enviarPago();