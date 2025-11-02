// Tipos globales para TypeScript - Freighter API
interface Window {
  freighterApi?: {
    isConnected: () => Promise<boolean>;
    enable: () => Promise<void>;
    getPublicKey: () => Promise<string>;
    signTransaction: (transactionXDR: string, network?: string) => Promise<string>;
    getNetwork: () => Promise<string>;
    setNetwork: (network: string) => Promise<void>;
  };
}
