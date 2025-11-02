import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import {
  Contract,
  Networks,
  TransactionBuilder,
  Argument,
  Address,
  SorobanRpc,
} from '@stellar/stellar-sdk';

export class StellarTokenService {
  private contractAddress: string;
  private rpcUrl: string;
  private userAddress: string = '';

  constructor() {
    this.contractAddress = import.meta.env.VITE_CONTRACT_ID || '';
    this.rpcUrl = import.meta.env.VITE_RPC_URL || 'https://soroban-testnet.stellar.org';
    
    if (!this.contractAddress) {
      console.warn('⚠️ VITE_CONTRACT_ID no configurado en .env');
    }
  }

  // 🔹 CONECTAR WALLET
  async requestWalletConnection(): Promise<string> {
    try {
      const accessObj = await requestAccess();
      
      if (accessObj.error) {
        throw new Error(accessObj.error.message);
      }
      
      if (!accessObj.address) {
        throw new Error('No se pudo obtener la dirección de la wallet');
      }
      
      this.userAddress = accessObj.address;
      console.log('✅ Wallet conectada:', this.userAddress);
      return accessObj.address;
    } catch (error: any) {
      throw new Error(`Error al conectar wallet: ${error.message}`);
    }
  }

  // 🔹 VERIFICAR ESTADO DE CONEXIÓN
  async checkConnection(): Promise<{ connected: boolean; publicKey?: string }> {
    try {
      const connectedResult = await isConnected();
      
      if (!connectedResult.isConnected) {
        this.userAddress = '';
        return { connected: false };
      }
      
      if (!this.userAddress) {
        const accessObj = await requestAccess();
        if (accessObj.address) {
          this.userAddress = accessObj.address;
        }
      }
      
      return { connected: true, publicKey: this.userAddress };
    } catch (error) {
      this.userAddress = '';
      return { connected: false };
    }
  }

  // 🔹 CONSULTAR BALANCE - LLAMADA REAL AL CONTRATO
  async getBalance(address: string): Promise<string> {
    try {
      console.log('📊 Consultando balance para:', address);
      console.log('📝 Contract ID:', this.contractAddress);
      
      if (!this.contractAddress) {
        throw new Error('Contract ID no configurado');
      }

      // 1. Crear cliente RPC
      const server = new SorobanRpc.Server(this.rpcUrl);
      
      // 2. Obtener cuenta del usuario
      const account = await server.getAccount(address);
      console.log('👤 Cuenta obtenida:', address);

      // 3. Crear instancia del contrato
      const contract = new Contract(this.contractAddress);
      
      // 4. Invocar función "balance" del contrato
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call('balance', Argument.address(new Address(address)))
        )
        .setTimeout(30)
        .build();

      // 5. Firmar transacción con Freighter
      const signed = await this.signTransactionWithFreighter(tx.toXDR());
      
      // 6. Enviar a la red
      const result = await server.sendTransaction(
        TransactionBuilder.fromXDR(signed, Networks.TESTNET_NETWORK_PASSPHRASE)
      );
      
      console.log('✅ Balance consultado:', result);
      
      // 7. Procesar resultado
      if (result.status === 'PENDING') {
        const txResult = await server.getTransaction(result.hash);
        if (txResult.status === 'SUCCESS') {
          const balanceValue = txResult.returnValue;
          return balanceValue.toString();
        }
      }
      
      return '0';
      
    } catch (error: any) {
      console.error('❌ Error en getBalance:', error);
      throw new Error(error.message || 'Error al consultar balance');
    }
  }

  // 🔹 TRANSFERIR TOKENS - LLAMADA REAL AL CONTRATO
  async transfer(from: string, to: string, amount: string): Promise<any> {
    try {
      console.log('🔄 Iniciando transferencia...');
      console.log('📝 Contract ID:', this.contractAddress);
      console.log('📤 De:', from);
      console.log('📥 A:', to);
      console.log('💰 Cantidad:', amount);

      if (!this.contractAddress) {
        throw new Error('Contract ID no configurado');
      }

      // 1. Crear cliente RPC
      const server = new SorobanRpc.Server(this.rpcUrl);
      
      // 2. Obtener cuenta del usuario
      const account = await server.getAccount(from);
      console.log('👤 Cuenta obtenida:', from);

      // 3. Crear instancia del contrato
      const contract = new Contract(this.contractAddress);
      
      // 4. Construir transacción de transferencia
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'transfer',
            Argument.address(new Address(from)),
            Argument.address(new Address(to)),
            Argument.i128(parseInt(amount))
          )
        )
        .setTimeout(30)
        .build();

      console.log('📋 Transacción construida, esperando firma...');

      // 5. Firmar con Freighter
      const signed = await this.signTransactionWithFreighter(tx.toXDR());
      console.log('✅ Transacción firmada por Freighter');
      
      // 6. Enviar a la red
      const result = await server.sendTransaction(
        TransactionBuilder.fromXDR(signed, Networks.TESTNET_NETWORK_PASSPHRASE)
      );
      
      console.log('📤 Transacción enviada:', result.hash);
      
      // 7. Esperar confirmación
      let finalResult = result;
      if (result.status === 'PENDING') {
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          finalResult = await server.getTransaction(result.hash);
          
          if (finalResult.status !== 'PENDING') {
            break;
          }
          attempts++;
        }
      }

      if (finalResult.status === 'SUCCESS') {
        console.log('✅ Transferencia exitosa:', finalResult.hash);
        return {
          success: true,
          hash: finalResult.hash,
          message: 'Transferencia realizada exitosamente'
        };
      } else {
        throw new Error(`Transacción falló: ${finalResult.status}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error en transfer:', error);
      throw new Error(error.message || 'Error en transferencia');
    }
  }

  // 🔹 FUNCIÓN AUXILIAR: Firmar transacción con Freighter
  private async signTransactionWithFreighter(transactionXDR: string): Promise<string> {
    try {
      const signed = await signTransaction(transactionXDR, {
        network: 'TESTNET',
      } as any);
      
      return signed;
    } catch (error: any) {
      throw new Error(`Error firmando transacción: ${error.message}`);
    }
  }
}

export const tokenService = new StellarTokenService();