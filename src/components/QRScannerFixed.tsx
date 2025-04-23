import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

const QRScannerFixed: React.FC = () => {
  const [scannedData, setScannedData] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(true);
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const qrReaderId = "qr-reader-container";

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
      // Créer une nouvelle instance de Html5Qrcode
      const html5QrCode = new Html5Qrcode("qr-reader-file");
      
      try {
        // Utiliser la méthode scanFile avec le bon type de retour
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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const clearPreviewImage = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
      setScannedData('')
    }
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

      {/* Modal pour afficher les informations détaillées */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Informations du QR Code</h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Contenu :</h4>
                <p className="text-gray-600 dark:text-gray-300 break-all p-3 bg-gray-100 dark:bg-gray-700 rounded">{scannedData}</p>
              </div>
              
              {scanInfo.timestamp && (
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Informations du scan :</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li><span className="font-medium">Format :</span> {scanInfo.format}</li>
                    <li><span className="font-medium">Date et heure :</span> {scanInfo.timestamp}</li>
                    {scanInfo.fileInfo && (
                      <>
                        <li><span className="font-medium">Fichier :</span> {scanInfo.fileInfo.name}</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
              
              {isUrl(scannedData) && (
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Lien détecté :</h4>
                  <a 
                    href={scannedData} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all block p-3 bg-gray-100 dark:bg-gray-700 rounded"
                  >
                    {scannedData}
                  </a>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScannerFixed; 