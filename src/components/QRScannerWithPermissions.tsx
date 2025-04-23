import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

const QRScannerWithPermissions: React.FC = () => {
  const [scannedData, setScannedData] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCameraSupported, setIsCameraSupported] = useState<boolean | null>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [scanInfo, setScanInfo] = useState<{
    format?: string;
    timestamp?: string;
    fileInfo?: {
      name: string;
      size: number;
      type: string;
    };
  }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  // Vérifier si la caméra est supportée par le navigateur
  useEffect(() => {
    const checkCameraSupport = async () => {
      setIsCheckingPermissions(true);
      try {
        // Vérifier si l'API MediaDevices est disponible
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("L'API MediaDevices n'est pas supportée par ce navigateur");
          setIsCameraSupported(false);
          setErrorMessage("Votre navigateur ne supporte pas l'accès à la caméra. Veuillez utiliser un navigateur plus récent ou activer les autorisations de caméra.");
          setIsCheckingPermissions(false);
          return;
        }

        // Lister les périphériques vidéo disponibles
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Périphériques vidéo disponibles:', videoDevices);

        if (videoDevices.length === 0) {
          console.error("Aucun périphérique vidéo trouvé");
          setIsCameraSupported(false);
          setErrorMessage("Aucune caméra n'a été détectée sur votre appareil.");
          setIsCheckingPermissions(false);
          return;
        }

        // Vérifier les autorisations de caméra
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment"
          } 
        });
        
        // Vérifier si le flux est actif
        const videoTrack = stream.getVideoTracks()[0];
        console.log('État de la piste vidéo:', videoTrack.enabled ? 'activée' : 'désactivée');
        console.log('Capabilities de la caméra:', videoTrack.getCapabilities());
        console.log('Settings de la caméra:', videoTrack.getSettings());
        
        // Arrêter le flux immédiatement après la vérification
        stream.getTracks().forEach(track => track.stop());
        
        setIsCameraSupported(true);
        console.log("Caméra supportée et autorisée");
      } catch (error) {
        console.error("Erreur détaillée lors de la vérification de la caméra:", error);
        setIsCameraSupported(false);
        
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setErrorMessage("Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.");
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            setErrorMessage("Aucune caméra n'a été trouvée sur votre appareil.");
          } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            setErrorMessage("La caméra est déjà utilisée par une autre application.");
          } else if (error.name === 'OverconstrainedError') {
            setErrorMessage("Les contraintes demandées ne sont pas supportées par la caméra.");
          } else if (error.name === 'TypeError') {
            setErrorMessage("Erreur de type lors de l'accès à la caméra. Vérifiez que vous utilisez HTTPS ou localhost.");
          } else {
            setErrorMessage(`Erreur d'accès à la caméra: ${error.message}`);
          }
        } else {
          setErrorMessage("Erreur inconnue lors de l'accès à la caméra.");
        }
      } finally {
        setIsCheckingPermissions(false);
      }
    };

    checkCameraSupport();
  }, []);

  const startScanner = async () => {
    if (!qrReaderRef.current) {
      console.error("Élément QR reader non trouvé");
      return;
    }

    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        facingMode: "environment"
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
      );

      setIsCameraActive(true);
      setErrorMessage('');
      toast.success('Scanner démarré avec succès');
    } catch (error) {
      console.error("Erreur lors du démarrage du scanner:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
        toast.error(`Erreur: ${error.message}`);
      } else {
        setErrorMessage("Erreur inconnue lors du démarrage du scanner");
        toast.error("Erreur inconnue lors du démarrage du scanner");
      }
      setIsCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsCameraActive(false);
        toast.success('Scanner arrêté');
      } catch (error) {
        console.error("Erreur lors de l'arrêt du scanner:", error);
        toast.error("Erreur lors de l'arrêt du scanner");
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    console.log("QR Code scanné:", decodedText);
    setScannedData(decodedText);
    setScanInfo(prev => ({
      ...prev,
      timestamp: new Date().toISOString()
    }));

    if (isUrl(decodedText)) {
      toast.success('URL détectée ! Redirection...');
      setTimeout(() => {
        window.open(decodedText, '_blank');
      }, 3000);
    } else {
      toast.success('QR Code scanné avec succès !');
    }
  };

  const onScanFailure = (error: string) => {
    console.warn("Échec du scan:", error);
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
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const result = await html5QrCode.scanFile(file, true);
      console.log("Résultat du scan de fichier:", result);

      setScannedData(result);
      setScanInfo({
        format: file.type,
        timestamp: new Date().toISOString(),
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });

      toast.success('QR Code détecté dans l\'image !');
    } catch (error) {
      console.error("Erreur lors du scan du fichier:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
        toast.error(`Erreur: ${error.message}`);
      } else {
        setErrorMessage("Erreur inconnue lors du scan du fichier");
        toast.error("Erreur inconnue lors du scan du fichier");
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="space-y-6">
          {/* Scanner QR Code */}
          <div id="qr-reader" ref={qrReaderRef} className="w-full aspect-video bg-black/20 rounded-lg overflow-hidden" />

          {/* Messages d'erreur */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              {errorMessage}
            </div>
          )}

          {/* Contrôles */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={startScanner}
              disabled={!isCameraSupported || isCameraActive}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCameraActive ? 'Scanner actif' : 'Démarrer le scanner'}
            </button>

            <button
              onClick={stopScanner}
              disabled={!isCameraActive}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Arrêter le scanner
            </button>

            <label className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer">
              <span>Capturer QR Code</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
          </div>

          {/* Résultat du scan */}
          {scannedData && (
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">QR Code détecté</h3>
              <p className="text-gray-300 break-all">{scannedData}</p>
              {scanInfo.timestamp && (
                <p className="text-sm text-gray-400 mt-2">
                  Scanné le: {new Date(scanInfo.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerWithPermissions; 
