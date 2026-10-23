import { useState, useRef, useEffect } from 'react';
import { MultiFormatReader } from '@zxing/library';
import Webcam from 'react-webcam';
import { api } from '../utils/api';

const reader = new MultiFormatReader();

export default function Scanner() {
  const webcamRef = useRef(null);
  const [scanType, setScanType] = useState('entry');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [lastScanned, setLastScanned] = useState(null);

  const processFrame = async () => {
    if (!webcamRef.current || !scanning) return;
    const canvas = webcamRef.current.getCanvas();
    if (!canvas) return;

    try {
      const result = await reader.decodeFromImage(canvas);
      if (result) {
        const barcode = result.getText();
        setLastScanned(barcode);
        await handleScan(barcode);
      }
    } catch (e) {
      // No barcode found, continue scanning
    }
    if (scanning) requestAnimationFrame(processFrame);
  };

  const handleScan = async (barcode) => {
    setError('');
    try {
      const data = await api.scan(barcode, scanType);
      setResult({ success: true, participant: data, type: scanType });
      setTimeout(() => setResult(null), 3000);
    } catch (err) {
      setError(err.message);
      setResult({ success: false, error: err.message });
      setTimeout(() => setResult(null), 3000);
    }
  };

  const toggleScanning = () => {
    setScanning(!scanning);
    if (!scanning) {
      setError('');
      requestAnimationFrame(processFrame);
    }
  };

  const handleManualBarcode = async (e) => {
    e.preventDefault();
    const barcode = e.target.elements.barcode.value.trim();
    if (barcode) {
      await handleScan(barcode);
      e.target.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Barcode Scanner</h2>
          <p className="text-gray-600 dark:text-gray-400">Scan participant barcodes for entry/exit</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['entry', 'exit'].map(type => (
              <button
                key={type}
                onClick={() => setScanType(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scanType === type
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Camera Scanner</h3>
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{ facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }}
              className="w-full rounded-lg bg-gray-900"
              style={{ minHeight: '300px' }}
            />
            {scanning && (
              <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none animate-pulse" />
            )}
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg text-white">
                <p className="text-lg">Click "Start Scanning" to begin</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={toggleScanning}
              disabled={!webcamRef.current?.video?.readyState}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                scanning
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {scanning ? 'Stop Scanning' : 'Start Scanning'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Manual Barcode Entry</h3>
          <form onSubmit={handleManualBarcode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Barcode
              </label>
              <input
                name="barcode"
                type="text"
                autoComplete="off"
                placeholder="Enter or scan barcode (e.g., HZX...)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Process {scanType.charAt(0).toUpperCase() + scanType.slice(1)}
            </button>
          </form>

          {lastScanned && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
              <p className="text-gray-500 dark:text-gray-400">Last scanned:</p>
              <code className="text-gray-900 dark:text-white font-mono">{lastScanned}</code>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg animate-slide-in ${
          result.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {result.success ? (
            <>
              <p className="font-medium">{result.type === 'entry' ? '✅ Entry recorded' : '✅ Exit recorded'}</p>
              <p className="text-sm opacity-90">{result.participant.name} - {result.participant.teamName}</p>
            </>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 px-6 py-4 bg-red-600 text-white rounded-xl shadow-lg animate-slide-in">
          <p>{error}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}