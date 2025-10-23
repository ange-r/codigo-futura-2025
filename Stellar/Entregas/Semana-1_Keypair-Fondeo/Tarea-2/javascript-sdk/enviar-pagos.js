import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE, Memo } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';
    dotenv.config();

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

// Configurar red
const networkPassphrase = Networks.TESTNET;

// CREDENCIALES
const SECRET_KEY = process.env.SECRET_KEY;  //Cuenta a debitar (mi cuenta ahora)
const DESTINATION = process.env.PUBLIC_KEY; //Cuenta destino

async function enviarPago(amount, memo = '') {
  try {
    console.log('Iniciando pago...');
    
    // Cargar cuenta de origen
    const sourceKeys = Keypair.fromSecret(SECRET_KEY);
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
    console.log(`Balance actual: ${sourceAccount.balances[0].balance} XLM\n`);
    
    // Construir la transacción
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase
    })
    .addOperation(
      Operation.payment({
        destination: DESTINATION,
        asset: Asset.native(), // XLM
        amount: amount.toString()
      })
    )
    .addMemo(memo ? Memo.text(memo) : Memo.none())
    .setTimeout(50)  //Agrego seg para que no me tire error
    .build();
    
    // Paso 3: Firmar la transacción
    transaction.sign(sourceKeys);
    
    // Paso 4: Enviar al servidor
    const result = await server.submitTransaction(transaction);
    
    console.log('¡Pago exitoso!');
    console.log('Enviaste:', amount, 'XLM');
    console.log('Transaction Hash:', result.hash);
    
  } catch (error) {
    console.error('Error al enviar pago:', error);
    // MOSTRAR LOS DETALLES DEL ERROR DE STELLAR
        if (error.response && error.response.data && error.response.data.extras) {
            console.log('Detalles del error Stellar:');
            console.log('Result codes:', error.response.data.extras.result_codes);
            console.log('Envelope XDR:', error.response.data.extras.envelope_xdr);
        }
}};

// Ejecutar: enviar 50 XLM con un memo
enviarPago('50', 'Primer TX');