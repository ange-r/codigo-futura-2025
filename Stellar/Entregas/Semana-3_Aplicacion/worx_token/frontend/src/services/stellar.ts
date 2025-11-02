import { isConnected, getPublicKey } from '@stellar/freighter-api';
import { Contract, Networks } from '@stellar/stellar-sdk';

export class StellarTokenService {
  private contractAddress: string;
  private network: Networks;
  private rpcUrl: string;

  constructor() {
    this.contractAddress = import.meta.env.VITE_CONTRACT_ID || '';
    this.network = (import.meta.env.VITE_NETWORK as Networks) || Networks.TESTNET;
    this.rpcUrl = import.meta.env.VITE_RPC_URL || 'https://soroban-testnet.stellar.org';
    
    if (!this.contractAddress) {
      console.warn('⚠️ VITE_CONTRACT_ID no configurado en .env');
    }
  }

  // 🔹 CONECTAR WALLET - MÉTODO CORRECTO
  async connectWallet(): Promise<string> {
    try {
      const connected = await isConnected();
      
      if (connected) {
        const publicKey = await getPublicKey();
        return publicKey;
      } else {
        throw new Error('Freighter no está conectado. Haz click en el ícono de Freighter y conéctate primero.');
      }
    } catch (error: any) {
      throw new Error(`Error conectando wallet: ${error.message}`);
    }
  }

  // 🔹 FORZAR CONEXIÓN (pedir permiso al usuario)
  async requestWalletConnection(): Promise<string> {
    try {
      const publicKey = await getPublicKey();
      return publicKey;
    } catch (error: any) {
      throw new Error('Usuario rechazó la conexión o Freighter no está instalado');
    }
  }

  // 🔹 VERIFICAR ESTADO DE CONEXIÓN
  async checkConnection(): Promise<{ connected: boolean; publicKey?: string }> {
    try {
      const connected = await isConnected();
      if (connected) {
        const publicKey = await getPublicKey();
        return { connected: true, publicKey };
      }
      return { connected: false };
    } catch (error) {
      return { connected: false };
    }
  }

  // 🔹 CONSULTAR BALANCE
  async getBalance(address: string): Promise<string> {
    try {
      console.log('🔍 Consultando balance para:', address);
      console.log('📝 Contract ID:', this.contractAddress);
      
      // TODO: Implementar llamada REAL al contrato
      return "1000";
      
    } catch (error: any) {
      console.error('❌ Error en getBalance:', error);
      throw new Error(error.message || 'Error al consultar balance');
    }
  }

  // 🔹 TRANSFERIR TOKENS
  async transfer(from: string, to: string, amount: string): Promise<any> {
    try {
      console.log('🔄 Iniciando transferencia...');
      console.log('📝 Contract ID:', this.contractAddress);
      console.log('📤 De:', from);
      console.log('📥 A:', to);
      console.log('💰 Cantidad:', amount);
      
      // TODO: Implementar transferencia REAL
      return { 
        success: true, 
        hash: "tx_example_hash_12345",
        message: "Transferencia simulada - Implementar con contrato real"
      };
      
    } catch (error: any) {
      console.error('❌ Error en transfer:', error);
      throw new Error(error.message || 'Error en transferencia');
    }
  }
}

export const tokenService = new StellarTokenService();