import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

const QRScannerNew: React.FC = () => {
  const [scannedData, setScannedData] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCameraActive) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      };
    }
  }, [isCameraActive]);

  const onScanSuccess = (decodedText: string) => {
    setScannedData(decodedText);
    if (isUrl(decodedText)) {
      toast.success('Lien détecté, redirection...');
      setTimeout(() => {
        window.open(decodedText, '_blank');
      }, 1500);
    } else {
      toast.success('QR Code scanné avec succès!');
    }
  };

  const onScanFailure = (error: string) => {
    console.warn(`Code scan error = ${error}`);
  };

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Créer une nouvelle instance de Html5Qrcode (pas Html5QrcodeScanner)
      const html5QrCode = new Html5Qrcode("qr-reader-file");
      
      try {
        const result = await html5QrCode.scanFile(file, /* verbose= */ false);
        onScanSuccess(result);
      } catch (err) {
        toast.error('Erreur lors de la lecture du QR code');
        console.error('Error scanning file:', err);
      } finally {
        // Nettoyer l'instance
        html5QrCode.clear();
      }
    } catch (err) {
      toast.error('Erreur lors de l\'initialisation du scanner');
      console.error('Error initializing scanner:', err);
    }
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Scanner QR Code</h2>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={toggleCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isCameraActive ? 'Désactiver Caméra' : 'Activer Caméra'}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Capturer QR Code
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      <div id="qr-reader" className="w-full aspect-square relative bg-black rounded-lg overflow-hidden" />
      <div id="qr-reader-file" className="hidden" />

      {scannedData && !isUrl(scannedData) && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Contenu scanné :</h3>
          <p className="text-gray-600 dark:text-gray-300 break-all">{scannedData}</p>
        </div>
      )}
    </div>
  );
};

export default QRScannerNew; 