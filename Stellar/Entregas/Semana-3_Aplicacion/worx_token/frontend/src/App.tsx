import { useState, useEffect } from 'react'
import { isConnected, requestAccess } from '@stellar/freighter-api'
import { Handshake, Cog, Moon, Sun } from 'lucide-react'
import { tokenService } from './services/stellar'

function App() {
  // ========================================
  // ESTADO
  // ========================================
  const [publicKey, setPublicKey] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false)
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState<boolean>(false)
  const [darkMode, setDarkMode] = useState<boolean>(true)

  // ========================================
  // EFECTOS
  // ========================================
  useEffect(() => {
    checkWalletStatus()
  }, [])

  // ========================================
  // FUNCIONES
  // ========================================
  const checkWalletStatus = async () => {
    try {
      const status = await tokenService.checkConnection()
      if (status.connected && status.publicKey) {
        setPublicKey(status.publicKey)
        setConnected(true)
        console.log('✅ Wallet ya estaba conectada:', status.publicKey)
      }
    } catch (error) {
      console.error('❌ Error verificando wallet:', error)
    }
  }

  const connectWallet = async () => {
    setLoading(true)
    try {
      const connectionStatus = await isConnected()
      
      if (!connectionStatus.isConnected) {
        alert('Por favor instalá Freighter wallet desde https://freighter.app')
        setLoading(false)
        return
      }
      
      const accessObj = await requestAccess()
      
      if (accessObj.error) {
        throw new Error(accessObj.error.message)
      }
      
      if (!accessObj.address) {
        throw new Error('No se pudo obtener la dirección de la wallet')
      }
      
      setPublicKey(accessObj.address)
      setConnected(true)
      console.log('✅ Wallet conectada:', accessObj.address)
      alert(`✅ Wallet conectada exitosamente!\n\nDirección: ${accessObj.address}`)
      
    } catch (error: any) {
      console.error('❌ Error conectando wallet:', error)
      alert('Error al conectar. Asegurate de que Freighter esté instalado y desbloqueado.')
    } finally {
      setLoading(false)
    }
  }

  const consultBalance = async () => {
    if (!publicKey) {
      alert('Primero conecta tu wallet')
      return
    }
    
    setLoading(true)
    try {
      const result = await tokenService.getBalance(publicKey)
      setBalance(result)
      console.log('💰 Balance consultado:', result)
      alert(`💰 Balance: ${result} WORX`)
    } catch (error: any) {
      console.error('❌ Error consultando balance:', error)
      alert('Error al consultar balance')
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!publicKey) {
      alert('Primero conecta tu wallet')
      return
    }
    
    setLoading(true)
    try {
      const result = await tokenService.transfer(
        publicKey,
        'GDESTINO123456789012345678901234567890',
        '10'
      )
      console.log('📤 Transferencia realizada:', result)
      alert('✅ Transferencia exitosa!')
    } catch (error: any) {
      console.error('❌ Error en transferencia:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const disconnect = () => {
    setPublicKey('')
    setConnected(false)
    setBalance('0')
    console.log('🔌 Wallet desconectada')
  }

  // ========================================
  // ESTILOS DINÁMICOS SEGÚN MODO
  // ========================================
  const getStyles = () => {
    if (darkMode) {
      return getStylesDark()
    } else {
      return getStylesLight()
    }
  }

  // ========================================
  // RENDER
  // ========================================
  const styles = getStyles()

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.logoContainer}>
            <Handshake size={48} color={darkMode ? 'white' : '#025159'} strokeWidth={1.5} />
            <Cog size={48} color={darkMode ? 'white' : '#025159'} strokeWidth={1.5} style={{marginLeft: '-12px'}} />
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            style={styles.themeToggle}
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        <h1 style={styles.title}>WORX Token</h1>
        <p style={styles.subtitle}>Plataforma de Pagos para Trabajadoras Independientes</p>
      </header>

      {!connected ? (
        // ========================================
        // ESTADO NO CONECTADO
        // ========================================
        <div style={styles.mainContent}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2>🔗 Conectar Wallet</h2>
            </div>
            
            <div style={styles.cardBody}>
              <p style={styles.welcomeText}>
                Conectá tu wallet de Freighter para acceder a tu cuenta y realizar operaciones.
              </p>
              
              <button 
                onClick={connectWallet}
                disabled={loading}
                style={{...styles.buttonPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
              >
                {loading ? '⏳ Conectando...' : '🔗 Conectar Wallet'}
              </button>

              <div style={styles.infoBox}>
                <p style={styles.infoTitle}>⚠️ Requisitos:</p>
                <ul style={styles.infoList}>
                  <li>Tener Freighter instalado</li>
                  <li>Una wallet creada en Testnet</li>
                  <li>XLM para pagar comisiones</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ========================================
        // ESTADO CONECTADO
        // ========================================
        <div style={styles.mainContent}>
          {/* PANEL DE ESTADO */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2>✅ Estado de tu Cuenta</h2>
            </div>
            
            <div style={styles.cardBody}>
              <div style={styles.statusBox}>
                <p style={styles.statusLabel}>👤 Tu Dirección:</p>
                <code style={styles.addressBox}>
                  {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                </code>
              </div>

              <div style={styles.balanceBox}>
                <p style={styles.balanceLabel}>💰 Tu Balance:</p>
                <p style={styles.balanceAmount}>{balance} WORX</p>
              </div>
            </div>
          </div>

          {/* OPERACIONES */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2>⚙️ Operaciones</h2>
            </div>
            
            <div style={styles.cardBody}>
              <div style={styles.buttonGroup}>
                <button
                  onClick={consultBalance}
                  disabled={loading}
                  style={{...styles.buttonSecondary, opacity: loading ? 0.6 : 1}}
                >
                  {loading ? '⏳ Consultando...' : '💰 Consultar Balance'}
                </button>

                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  style={{...styles.buttonSecondary, opacity: loading ? 0.6 : 1}}
                >
                  {loading ? '⏳ Procesando...' : '📤 Enviar WORX'}
                </button>

                <button
                  onClick={disconnect}
                  style={styles.buttonDanger}
                >
                  🔌 Desconectar
                </button>
              </div>
            </div>
          </div>

          {/* ÚLTIMOS MOVIMIENTOS */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2>📜 Últimos Movimientos</h2>
            </div>
            
            <div style={styles.cardBody}>
              <div style={styles.emptyState}>
                <p>📭 No hay movimientos aún</p>
                <p style={styles.emptyStateSubtext}>Los movimientos aparecerán aquí</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>© 2024 WORX Token - Powered by Stellar</p>
      </footer>
    </div>
  )
}

// ========================================
// ESTILOS - MODO OSCURO
// ========================================
const getStylesDark = () => ({
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #025159 0%, #0396a6 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '20px',
    color: '#fff',
  } as React.CSSProperties,

  header: {
    textAlign: 'center' as const,
    color: 'white',
    marginBottom: '40px',
    paddingTop: '20px',
  } as React.CSSProperties,

  headerTop: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '15px',
  } as React.CSSProperties,

  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as React.CSSProperties,

  themeToggle: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    color: 'white',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  title: {
    fontSize: '2.5rem',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
  } as React.CSSProperties,

  subtitle: {
    fontSize: '1rem',
    margin: '0',
    opacity: 0.9,
  } as React.CSSProperties,

  mainContent: {
    maxWidth: '600px',
    margin: '0 auto 40px',
  } as React.CSSProperties,

  card: {
    background: '#1a1a1a',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    border: '1px solid rgba(3, 150, 166, 0.3)',
  } as React.CSSProperties,

  cardHeader: {
    background: 'linear-gradient(135deg, #0396a6 0%, #025159 100%)',
    padding: '20px',
    color: 'white',
  } as React.CSSProperties,

  cardBody: {
    padding: '20px',
    color: '#e0e0e0',
  } as React.CSSProperties,

  welcomeText: {
    fontSize: '0.95rem',
    color: '#e0e0e0',
    marginBottom: '20px',
    lineHeight: '1.6',
  } as React.CSSProperties,

  buttonPrimary: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #0396a6 0%, #025159 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  } as React.CSSProperties,

  buttonSecondary: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #0396a6 0%, #025159 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    minWidth: '120px',
  } as React.CSSProperties,

  buttonDanger: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    minWidth: '120px',
  } as React.CSSProperties,

  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  statusBox: {
    marginBottom: '20px',
    padding: '15px',
    background: 'rgba(3, 150, 166, 0.1)',
    borderRadius: '8px',
    borderLeft: '4px solid #0396a6',
  } as React.CSSProperties,

  statusLabel: {
    fontSize: '0.85rem',
    color: '#a0a0a0',
    margin: '0 0 8px 0',
    fontWeight: 'bold',
  } as React.CSSProperties,

  addressBox: {
    display: 'block',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: '#0396a6',
    wordBreak: 'break-all' as const,
    fontFamily: 'monospace',
    border: '1px solid rgba(3, 150, 166, 0.3)',
  } as React.CSSProperties,

  balanceBox: {
    padding: '20px',
    background: 'linear-gradient(135deg, #0396a6 0%, #025159 100%)',
    borderRadius: '8px',
    color: 'white',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  balanceLabel: {
    fontSize: '0.9rem',
    margin: '0 0 10px 0',
    opacity: 0.9,
  } as React.CSSProperties,

  balanceAmount: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0',
  } as React.CSSProperties,

  infoBox: {
    marginTop: '20px',
    padding: '15px',
    background: 'rgba(3, 150, 166, 0.1)',
    borderRadius: '8px',
    borderLeft: '4px solid #0396a6',
  } as React.CSSProperties,

  infoTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#0396a6',
    margin: '0 0 8px 0',
  } as React.CSSProperties,

  infoList: {
    fontSize: '0.85rem',
    color: '#e0e0e0',
    margin: '0',
    paddingLeft: '20px',
  } as React.CSSProperties,

  emptyState: {
    textAlign: 'center' as const,
    padding: '30px 20px',
    color: '#999',
  } as React.CSSProperties,

  emptyStateSubtext: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '5px 0 0 0',
  } as React.CSSProperties,

  footer: {
    textAlign: 'center' as const,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.85rem',
    paddingBottom: '20px',
  } as React.CSSProperties,
})

// ========================================
// ESTILOS - MODO CLARO
// ========================================
const getStylesLight = () => ({
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #d9cdb8 0%, #f2d9bb 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '20px',
    color: '#333',
  } as React.CSSProperties,

  header: {
    textAlign: 'center' as const,
    color: '#025159',
    marginBottom: '40px',
    paddingTop: '20px',
  } as React.CSSProperties,

  headerTop: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '15px',
  } as React.CSSProperties,

  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as React.CSSProperties,

  themeToggle: {
    background: 'rgba(2, 81, 89, 0.2)',
    border: '2px solid rgba(2, 81, 89, 0.3)',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    color: '#025159',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  title: {
    fontSize: '2.5rem',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
    color: '#025159',
  } as React.CSSProperties,

  subtitle: {
    fontSize: '1rem',
    margin: '0',
    color: '#025159',
    opacity: 0.8,
  } as React.CSSProperties,

  mainContent: {
    maxWidth: '600px',
    margin: '0 auto 40px',
  } as React.CSSProperties,

  card: {
    background: 'white',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 15px rgba(2, 81, 89, 0.2)',
    overflow: 'hidden',
    border: '1px solid rgba(2, 81, 89, 0.1)',
  } as React.CSSProperties,

  cardHeader: {
    background: 'linear-gradient(135deg, #0396a6 0%, #025159 100%)',
    padding: '20px',
    color: 'white',
  } as React.CSSProperties,

  cardBody: {
    padding: '20px',
    color: '#333',
  } as React.CSSProperties,

  welcomeText: {
    fontSize: '0.95rem',
    color: '#555',
    marginBottom: '20px',
    lineHeight: '1.6',
  } as React.CSSProperties,

  buttonPrimary: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #0396a6 0%, #025159 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  } as React.CSSProperties,

  buttonSecondary: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #0396a6 0%, #025159 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    minWidth: '120px',
  } as React.CSSProperties,

  buttonDanger: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    minWidth: '120px',
  } as React.CSSProperties,

  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  statusBox: {
    marginBottom: '20px',
    padding: '15px',
    background: '#f0f8fa',
    borderRadius: '8px',
    borderLeft: '4px solid #0396a6',
  } as React.CSSProperties,

  statusLabel: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0 0 8px 0',
    fontWeight: 'bold',
  } as React.CSSProperties,

  addressBox: {
    display: 'block',
    background: '#fafafa',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: '#0396a6',
    wordBreak: 'break-all' as const,
    fontFamily: 'monospace',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  balanceBox: {
    padding: '20px',
    background: 'linear-gradient(135deg, #0396a6 0%, #025159 100%)',
    borderRadius: '8px',
    color: 'white',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  balanceLabel: {
    fontSize: '0.9rem',
    margin: '0 0 10px 0',
    opacity: 0.9,
  } as React.CSSProperties,

  balanceAmount: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0',
  } as React.CSSProperties,

  infoBox: {
    marginTop: '20px',
    padding: '15px',
    background: '#f0f8fa',
    borderRadius: '8px',
    borderLeft: '4px solid #0396a6',
  } as React.CSSProperties,

  infoTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#0396a6',
    margin: '0 0 8px 0',
  } as React.CSSProperties,

  infoList: {
    fontSize: '0.85rem',
    color: '#555',
    margin: '0',
    paddingLeft: '20px',
  } as React.CSSProperties,

  emptyState: {
    textAlign: 'center' as const,
    padding: '30px 20px',
    color: '#bbb',
  } as React.CSSProperties,

  emptyStateSubtext: {
    fontSize: '0.85rem',
    color: '#ddd',
    margin: '5px 0 0 0',
  } as React.CSSProperties,

  footer: {
    textAlign: 'center' as const,
    color: 'rgba(2, 81, 89, 0.6)',
    fontSize: '0.85rem',
    paddingBottom: '20px',
  } as React.CSSProperties,
})

export default App