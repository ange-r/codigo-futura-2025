import { isConnected, requestAccess } from '@stellar/freighter-api';
import { WorxTokenClient } from '../contract/WorxTokenClient';

export class StellarTokenService {
  private contractAddress: string;
  private rpcUrl: string;
  private userAddress: string = '';
  private tokenClient: WorxTokenClient;

  constructor() {
    this.contractAddress = import.meta.env.VITE_CONTRACT_ID || '';
    this.rpcUrl = import.meta.env.VITE_RPC_URL || 'https://soroban-testnet.stellar.org';
    
    // Punto 4: Importar cliente del contrato
    this.tokenClient = new WorxTokenClient(this.contractAddress, this.rpcUrl);
  }

  // Conectar wallet
  async requestWalletConnection(): Promise<string> {
    try {
      const accessObj = await requestAccess();
      
      if (accessObj.error) {
        throw new Error(accessObj.error.message);
      }
      
      this.userAddress = accessObj.address || '';
      console.log('✅ Wallet conectada:', this.userAddress);
      return this.userAddress;
    } catch (error: any) {
      throw new Error(`Error al conectar: ${error.message}`);
    }
  }

  // Verificar conexión
  async checkConnection(): Promise<{ connected: boolean; publicKey?: string }> {
    try {
      const result = await isConnected();
      
      if (!result.isConnected) {
        return { connected: false };
      }
      
      return { connected: true, publicKey: this.userAddress };
    } catch (error) {
      return { connected: false };
    }
  }

  // Punto 5: Llamar función del contrato - Balance
  async getBalance(address: string): Promise<string> {
    try {
      console.log('📊 Consultando balance');
      const balance = await this.tokenClient.balance(address);
      console.log('✅ Balance:', balance);
      return balance;
    } catch (error: any) {
      throw new Error(`Error en balance: ${error.message}`);
    }
  }

  // Punto 5: Llamar función del contrato - Transfer
  async transfer(from: string, to: string, amount: string): Promise<any> {
    try {
      console.log('🔄 Transferencia en progreso');
      const result = await this.tokenClient.transfer(from, to, amount);
      console.log('✅ Transferencia:', result);
      return {
        success: true,
        hash: result.hash,
        message: 'Transferencia completada'
      };
    } catch (error: any) {
      throw new Error(`Error en transferencia: ${error.message}`);
    }
  }
}

export const tokenService = new StellarTokenService();