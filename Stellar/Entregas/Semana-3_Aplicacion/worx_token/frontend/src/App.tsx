import React, { useState, useEffect } from 'react';
import './App.css';
import { tokenService } from './services/stellar';

function App() {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Desconectado');

  // 🔹 VERIFICAR ESTADO AL CARGAR LA PÁGINA
  useEffect(() => {
    checkWalletStatus();
  }, []);

  // 🔹 VERIFICAR ESTADO DE LA WALLET
  const checkWalletStatus = async () => {
    try {
      const status = await tokenService.checkConnection();
      if (status.connected && status.publicKey) {
        setUserAddress(status.publicKey);
        setConnectionStatus('Conectado');
      } else {
        setConnectionStatus('Desconectado');
      }
    } catch (error) {
      setConnectionStatus('Error al verificar');
    }
  };

  // 🔹 CONECTAR WALLET (FORZAR CONEXIÓN)
  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const address = await tokenService.requestWalletConnection();
      setUserAddress(address);
      setConnectionStatus('Conectado');
      alert(`✅ Wallet conectada exitosamente!\n\n📧 Dirección: ${address}`);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}\n\nAsegúrate de:\n1. Tener Freighter instalado\n2. Haber creado una wallet\n3. Estar en Testnet`);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 VERIFICAR CONEXIÓN ACTUAL
  const handleCheckConnection = async () => {
    await checkWalletStatus();
    if (userAddress) {
      alert(`✅ Wallet Conectada\n📧 Dirección: ${userAddress}`);
    } else {
      alert('❌ Wallet no conectada. Haz click en "Conectar Wallet"');
    }
  };

  // 🔹 CONSULTAR BALANCE
  const handleConsultBalance = async () => {
    if (!userAddress) {
      alert('Primero conecta tu wallet');
      return;
    }

    setLoading(true);
    try {
      const result = await tokenService.getBalance(userAddress);
      setBalance(result);
      alert(`💰 Balance: ${result} WORX`);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 TRANSFERIR TOKENS
  const handleTransferTokens = async () => {
    if (!userAddress) {
      alert('Primero conecta tu wallet');
      return;
    }

    setLoading(true);
    try {
      const result = await tokenService.transfer(
        userAddress, 
        'GDESTINO123456789012345678901234567890', // Cambiar por dirección real
        '10'
      );
      alert('✅ Transferencia exitosa!');
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Worx Token DApp</h1>
        <p>Token desplegado en Stellar Testnet</p>
        
        {/* Panel de estado */}
        <div style={{
          marginBottom: '1rem', 
          padding: '1rem', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '8px'
        }}>
          <h3>🔗 Estado: 
            <span style={{
              color: userAddress ? '#4ade80' : '#f87171',
              marginLeft: '0.5rem'
            }}>
              {connectionStatus}
            </span>
          </h3>
          
          {userAddress && (
            <p>
              <strong>👤 Wallet:</strong><br/>
              <code style={{fontSize: '0.8rem', wordBreak: 'break-all'}}>
                {userAddress}
              </code>
            </p>
          )}
          
          {userAddress && (
            <p><strong>💰 Balance:</strong> {balance} WORX</p>
          )}
        </div>

        <div>
          <h3>Funciones del Token:</h3>
          
          {!userAddress ? (
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
              <button onClick={handleConnectWallet} disabled={loading}>
                {loading ? 'Solicitando...' : '🔗 Conectar Wallet'}
              </button>
              <button onClick={handleCheckConnection} style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
                🔍 Verificar Estado
              </button>
            </div>
          ) : (
            <>
              <button onClick={handleConsultBalance} disabled={loading}>
                {loading ? 'Consultando...' : '💰 Consultar Balance'}
              </button>
              
              <button onClick={handleTransferTokens} disabled={loading}>
                {loading ? 'Procesando...' : '📤 Transferir Tokens'}
              </button>
              
              <button onClick={handleCheckConnection} style={{background: 'linear-gradient(135deg, #6b7280, #4b5563)'}}>
                🔍 Re-verificar Conexión
              </button>
            </>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;