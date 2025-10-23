import { Horizon } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';
    dotenv.config();
    
const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const cuentas = [  // Cuentas a consultar
  process.env.PUBLIC_KEY1,
  process.env.PUBLIC_KEY2, 
  process.env.PUBLIC_KEY3,
  process.env.PUBLIC_KEY4,
  process.env.PUBLIC_KEY5
];

async function consultarBalances(cuentas) {

  
  for (let i = 0; i < cuentas.length; i++) {
    const publicKey = cuentas[i];
  
    try {
      const account = await server.loadAccount(publicKey);
      
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      const trustlines = account.balances.filter(b => b.asset_type !== 'native');
      
      console.log(`Cuenta: ${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 3)}`);
      console.log(`Balance: ${xlmBalance.balance} XLM`);
      console.log(`Trustlines: ${trustlines.length}`);
      console.log(`Sequence: ${account.sequence}\n`);
      
    } catch (error) {
      console.log(`Cuenta: ${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 3)}`);
      console.log(`  Balance: Cuenta no encontrada\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

consultarBalances(cuentas);