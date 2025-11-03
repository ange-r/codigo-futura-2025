// src/components/PathPayment.jsx

'use client';

import { useState } from 'react';
import { 
  Server, 
  TransactionBuilder, 
  Operation, 
  Asset, 
  Networks 
} from '@stellar/stellar-sdk';
import { signTransaction, getPublicKey } from '@stellar/freighter-api';
import { supabase } from '../lib/supabase';
import { HORIZON_URLS } from '../lib/constants';
import Spinner from './Spinner';

export default function PathPayment({ sourceAsset, destAsset }) {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const sendPathPayment = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Ingresa una cantidad válida');
      }

      const publicKey = await getPublicKey();
      if (!publicKey) {
        throw new Error('No se pudo obtener la public key');
      }

      // Si no hay destino, enviar a sí mismo (para probar)
      const destKey = destination || publicKey;

      const server = new Server(HORIZON_URLS.testnet);
      const account = await server.loadAccount(publicKey);

      // Crear objetos Asset
      const source = sourceAsset.getCode() === 'XLM' 
        ? Asset.native() 
        : sourceAsset;
      
      const dest = destAsset.getCode() === 'XLM'
        ? Asset.native()
        : destAsset;

      // Construir transacción
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.pathPaymentStrictSend({
            sendAsset: source,
            sendAmount: amount,
            destination: destKey,
            destAsset: dest,
            destMin: '0'
          })
        )
        .setTimeout(30)
        .build();

      // Firmar
      const signedXDR = await signTransaction(transaction.toXDR(), {
        network: 'TESTNET',
        networkPassphrase: Networks.TESTNET
      });

      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        Networks.TESTNET
      );

      // Enviar
      const result = await server.submitTransaction(signedTransaction);

      // Guardar en Supabase
      await supabase.from('transactions').insert({
        user_id: publicKey,
        tx_type: 'path_payment',
        tx_hash: result.hash,
        source_asset: sourceAsset.getCode(),
        dest_asset: destAsset.getCode(),
        amount: parseFloat(amount),
      });

      setStatus({
        type: 'success',
        message: `✅ Path Payment exitoso! Hash: ${result.hash.slice(0, 8)}...`
      });

    } catch (err) {
      console.error('Error in path payment:', err);
      
      let errorMessage = 'Error desconocido';
      
      if (err.message.includes('User declined')) {
        errorMessage = 'Rechazaste la transacción';
      } else if (err.response?.data?.extras?.result_codes) {
        const code = err.response.data.extras.result_codes.operations?.[0];
        
        if (code === 'op_no_destination') {
          errorMessage = 'La cuenta destino no existe';
        } else if (code === 'op_no_trust') {
          errorMessage = 'El destino no tiene trustline';
        } else if (code === 'op_under_dest_min') {
          errorMessage = 'No hay suficiente liquidez en el DEX';
        } else {
          errorMessage = `Error: ${code}`;
        }
      } else {
        errorMessage = err.message;
      }
      
      setStatus({
        type: 'error',
        message: `❌ ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 border-l-4 border-l-orange-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-800">
          💸 Path Payment
        </h2>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
          AVANZADO
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Convierte <strong>{sourceAsset.getCode()}</strong> a{' '}
        <strong>{destAsset.getCode()}</strong> automáticamente
      </p>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          💡 Path payment = Envías un asset, receptor recibe otro. 
          Stellar convierte usando el DEX.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantidad ({sourceAsset.getCode()})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          placeholder="Ej: 10"
          min="0"
          step="0.0000001"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Destino (opcional)
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono"
          placeholder="GABC...XYZ o vacío para ti mismo"
        />
      </div>

      {status.message && (
        <div className={`p-3 rounded-lg mb-4 ${
          status.type === 'success'
            ? 'bg-green-100 border border-green-400 text-green-800'
            : 'bg-red-100 border border-red-400 text-red-800'
        }`}>
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      <button
        onClick={sendPathPayment}
        disabled={loading || !amount}
        className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg 
                   hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Spinner />
            <span>Enviando...</span>
          </>
        ) : (
          '💸 Enviar Path Payment'
        )}
      </button>

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-yellow-800">
          ⚠️ En testnet la liquidez es limitada. 
          Puede que no encuentre una ruta de conversión.
        </p>
      </div>
    </div>
  );
}