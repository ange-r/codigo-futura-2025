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
      console.error('Error verificando wallet:', error);
      setConnectionStatus('Error al verificar');
    }
  };

  // 🔹 CONECTAR WALLET
  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const address = await tokenService.requestWalletConnection();
      setUserAddress(address);
      setConnectionStatus('Conectado');
      alert(`✅ Wallet conectada exitosamente!\n\n📧 Dirección: ${address}`);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}\n\nAsegúrate de:\n1. Tener Freighter instalado\n2. Haber creado una wallet\n3. Estar en Testnet`);
      setConnectionStatus('Error de conexión');
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
        'GDESTINO123456789012345678901234567890',
        '10'
      );
      
      if (result.success) {
        alert('✅ Transferencia exitosa!\n\n📝 Hash: ' + result.hash);
      }
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
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3>🔗 Estado:
            <span style={{
              color: userAddress ? '#4ade80' : '#f87171',
              marginLeft: '0.5rem',
              fontWeight: 'bold'
            }}>
              {connectionStatus}
            </span>
          </h3>

          {userAddress && (
            <>
              <p>
                <strong>👤 Wallet:</strong><br />
                <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: '#60a5fa' }}>
                  {userAddress}
                </code>
              </p>
              <p><strong>💰 Balance:</strong> {balance} WORX</p>
            </>
          )}
        </div>

        <div>
          <h3>Funciones del Token:</h3>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {!userAddress ? (
              <>
                <button
                  onClick={handleConnectWallet}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Solicitando...' : '🔗 Conectar Wallet'}
                </button>

                <button
                  onClick={handleCheckConnection}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🔍 Verificar Estado
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleConsultBalance}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Consultando...' : '💰 Consultar Balance'}
                </button>

                <button
                  onClick={handleTransferTokens}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Procesando...' : '📤 Transferir Tokens'}
                </button>

                <button
                  onClick={handleCheckConnection}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🔍 Re-verificar Conexión
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;