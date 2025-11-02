import { isConnected, requestAccess } from '@stellar/freighter-api';

export class StellarTokenService {
  private contractAddress: string;
  private userAddress: string = '';

  constructor() {
    this.contractAddress = import.meta.env.VITE_CONTRACT_ID || '';
    
    if (!this.contractAddress) {
      console.warn('⚠️ VITE_CONTRACT_ID no configurado en .env');
    }
  }

  // 🔹 CONECTAR WALLET - SOLICITAR ACCESO
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
      
      // Si no tenemos la dirección guardada, la solicitamos
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

  // 🔹 CONSULTAR BALANCE (mock)
  async getBalance(address: string): Promise<string> {
    try {
      console.log('📊 Consultando balance para:', address);
      // TODO: Implementar llamada REAL al contrato
      return '1000';
    } catch (error: any) {
      throw new Error(error.message || 'Error al consultar balance');
    }
  }

  // 🔹 TRANSFERIR TOKENS (mock)
  async transfer(from: string, to: string, amount: string): Promise<any> {
    try {
      console.log('🔄 Transferencia desde:', from);
      console.log('📤 Hacia:', to);
      console.log('💰 Cantidad:', amount);
      
      return { 
        success: true, 
        hash: 'tx_example_hash_12345',
        message: 'Transferencia simulada - Implementar con contrato real'
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error en transferencia');
    }
  }
}

export const tokenService = new StellarTokenService();