// Tipos globales para TypeScript - Freighter API
interface FreighterAPI {
  isConnected(): Promise<{ isConnected: boolean }>;
  getPublicKey(): Promise<string>;
  requestAccess(): Promise<{
    error?: { message: string };
    address?: string;
  }>;
  signTransaction(transactionXDR: string, opts: {
    network: string;
    address: string;
  }): Promise<{
    error?: { message: string };
    signedTxXdr?: string;
  }>;
}

interface Window {
  freighterApi?: FreighterAPI;
}