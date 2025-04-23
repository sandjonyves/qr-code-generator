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

  useEffect(() => {
    // Initialiser le scanner
    try {
      if (!qrReaderRef.current) {
        console.error("L'élément qr-reader n'est pas trouvé dans le DOM");
        return;
      }
      
      scannerRef.current = new Html5Qrcode("qr-reader");
      console.log("Scanner initialisé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'initialisation du scanner:", error);
      setErrorMessage(`Erreur d'initialisation: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return () => {
      // Nettoyer le scanner lors du démontage du composant
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) {
      toast.error("Scanner non initialisé");
      return;
    }

    if (isCameraSupported === false) {
      toast.error("La caméra n'est pas supportée par votre navigateur");
      return;
    }
    
    try {
      console.log("Tentative de démarrage du scanner...");
      
      // Vérifier si le scanner est déjà en cours d'exécution
      if (scannerRef.current.isScanning) {
        console.log("Le scanner est déjà en cours d'exécution");
        setIsCameraActive(true);
        return;
      }
      
      // Démarrer le scanner avec des options plus permissives
      await scannerRef.current.start(
        { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        onScanSuccess,
        onScanFailure
      );
      
      setIsCameraActive(true);
      setErrorMessage('');
      toast.success('Caméra activée');
      console.log("Scanner démarré avec succès");
    } catch (err) {
      console.error("Erreur détaillée lors de l'activation de la caméra:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Erreur d'activation: ${errorMsg}`);
      toast.error(`Erreur lors de l'activation de la caméra: ${errorMsg}`);
      
      // Essayer une approche alternative si la première échoue
      tryAlternativeCamera();
    }
  };

  const tryAlternativeCamera = async () => {
    if (!scannerRef.current) return;
    
    try {
      console.log("Tentative avec une configuration alternative...");
      
      // Essayer avec une configuration plus simple
      await scannerRef.current.start(
        { facingMode: "user" }, // Essayer la caméra frontale
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );
      
      setIsCameraActive(true);
      setErrorMessage('');
      toast.success('Caméra activée (mode alternatif)');
      console.log("Scanner démarré avec succès en mode alternatif");
    } catch (err) {
      console.error("Échec de la configuration alternative:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Échec de toutes les tentatives: ${errorMsg}`);
      toast.error(`Impossible d'activer la caméra: ${errorMsg}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error('Aucun fichier sélectionné');
      return;
    }

    if (!scannerRef.current) {
      toast.error('Scanner non initialisé');
      return;
    }

    try {
      console.log('Tentative de scan du fichier:', file.name);
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Le fichier doit être une image');
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 5MB)');
        return;
      }

      // Afficher un toast de chargement
      const loadingToast = toast.loading('Analyse du QR code en cours...');

      try {
        // Essayer avec l'option showImage=false pour éviter les problèmes de rendu
        const decodedText = await scannerRef.current.scanFile(file, false);
        console.log('QR code décodé avec succès:', decodedText);
        
        // Enregistrer les informations du scan
        setScanInfo({
          format: 'QR Code',
          timestamp: new Date().toLocaleString(),
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        });
        
        toast.dismiss(loadingToast);
        onScanSuccess(decodedText);
        
        // Log pour déboguer
        console.log('État après scan par capture - scannedData:', decodedText);
        console.log('État après scan par capture - scanInfo:', {
          format: 'QR Code',
          timestamp: new Date().toLocaleString(),
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        });
      } catch (scanError) {
        console.error('Erreur détaillée lors du scan:', scanError);
        toast.dismiss(loadingToast);
        
        if (scanError instanceof Error) {
          if (scanError.message.includes('No MultiFormat Readers')) {
            toast.error('Impossible de détecter le QR code. Vérifiez que l\'image contient un QR code valide et de bonne qualité.');
          } else if (scanError.message.includes('No QR code found')) {
            toast.error('Aucun QR code trouvé dans l\'image');
          } else if (scanError.message.includes('NotFoundException')) {
            toast.error('QR code non trouvé. Assurez-vous que l\'image est claire et que le QR code est bien visible.');
          } else {
            toast.error(`Erreur lors de la lecture du QR code: ${scanError.message}`);
          }
        } else {
          toast.error('Erreur inconnue lors de la lecture du QR code');
        }
      }
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      toast.error('Erreur lors du traitement du fichier');
    } finally {
      // Réinitialiser l'input file pour permettre la sélection du même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    console.log('QR code scanné avec succès:', decodedText);
    setScannedData(decodedText);
    
    // Si les informations de scan n'ont pas été définies (cas de la caméra)
    if (!scanInfo.timestamp) {
      setScanInfo({
        format: 'QR Code',
        timestamp: new Date().toLocaleString()
      });
    }
    
    if (isUrl(decodedText)) {
      toast.success('Lien détecté, redirection...');
      // Ne pas rediriger immédiatement pour permettre à l'utilisateur de voir les détails
      setTimeout(() => {
        window.open(decodedText, '_blank');
      }, 3000); // Augmenter le délai pour donner plus de temps à l'utilisateur
    } else {
      toast.success('QR Code scanné avec succès!');
    }
    
    // Forcer l'affichage du bouton après le scan
    console.log('État après scan - scannedData:', decodedText);
    console.log('État après scan - scanInfo:', scanInfo);
  };

  const onScanFailure = (error: string) => {
    // Ne pas afficher d'erreur pour chaque échec de scan
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

  const toggleCamera = () => {
    if (isCameraActive) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    
    try {
      await scannerRef.current.stop();
      setIsCameraActive(false);
      toast.success('Caméra désactivée');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la désactivation de la caméra');
    }
  };

  const requestCameraPermission = async () => {
    setIsCheckingPermissions(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setIsCameraSupported(true);
      setErrorMessage('');
      toast.success('Accès à la caméra autorisé');
    } catch (error) {
      console.error("Erreur lors de la demande d'autorisation:", error);
      if (error instanceof Error) {
        setErrorMessage(`Erreur d'autorisation: ${error.message}`);
      } else {
        setErrorMessage("Erreur inconnue lors de la demande d'autorisation");
      }
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Scanner QR Code</h2>
      
      {isCheckingPermissions ? (
        <div className="w-full p-4 bg-blue-100 text-blue-700 rounded-lg mb-4">
          <p className="text-center">Vérification des autorisations de caméra...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={toggleCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isCameraSupported === false}
            >
              {isCameraActive ? 'Désactiver Caméra' : 'Activer Caméra'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Capturer QR Code
            </button>
            <button
              onClick={openModal}
              className={`px-4 py-2 ${scannedData ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-lg transition-colors`}
              disabled={!scannedData}
            >
              Voir les détails
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {errorMessage && (
            <div className="w-full p-3 bg-red-100 text-red-700 rounded-lg mb-4">
              <p className="font-medium">Erreur:</p>
              <p className="text-sm">{errorMessage}</p>
              {errorMessage.includes("refusé") && (
                <div className="mt-2 text-sm">
                  <p>Pour autoriser l'accès à la caméra:</p>
                  <ol className="list-decimal pl-4 mt-1">
                    <li>Cliquez sur l'icône du cadenas dans la barre d'adresse</li>
                    <li>Sélectionnez "Autoriser" pour l'accès à la caméra</li>
                    <li>Rafraîchissez la page</li>
                  </ol>
                  <button 
                    onClick={requestCameraPermission}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Réessayer l'autorisation
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div id="qr-reader" ref={qrReaderRef} className="w-full aspect-square relative bg-black rounded-lg overflow-hidden" />

      {scannedData && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Contenu scanné :</h3>
          <p className="text-gray-600 dark:text-gray-300 break-all">{scannedData}</p>
          
          {isUrl(scannedData) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Lien détecté :</h4>
              <a 
                href={scannedData} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {scannedData}
              </a>
            </div>
          )}
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
                        <li><span className="font-medium">Taille :</span> {(scanInfo.fileInfo.size / 1024).toFixed(2)} KB</li>
                        <li><span className="font-medium">Type :</span> {scanInfo.fileInfo.type}</li>
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

export default QRScannerWithPermissions; 






// // import React, { useEffect, useRef, useState } from 'react';
// // import { Html5Qrcode } from 'html5-qrcode';
// // import toast from 'react-hot-toast';

// // const QRScannerFixed: React.FC = () => {
// //   const [scannedData, setScannedData] = useState<string>('');
// //   const [isCameraActive, setIsCameraActive] = useState(false);
// //   const [errorMessage, setErrorMessage] = useState<string>('');
// //   const scannerRef = useRef<Html5Qrcode | null>(null);
// //   const fileInputRef = useRef<HTMLInputElement>(null);
// //   const qrReaderRef = useRef<HTMLDivElement>(null);

// //   useEffect(() => {
// //     // Initialiser le scanner
// //     try {
// //       scannerRef.current = new Html5Qrcode("qr-reader");
// //       console.log("Scanner initialisé avec succès");
// //     } catch (error) {
// //       console.error("Erreur lors de l'initialisation du scanner:", error);
// //       setErrorMessage(`Erreur d'initialisation: ${error instanceof Error ? error.message : String(error)}`);
// //     }
    
// //     return () => {
// //       // Nettoyer le scanner lors du démontage du composant
// //       if (scannerRef.current && scannerRef.current.isScanning) {
// //         scannerRef.current.stop().catch(console.error);
// //       }
// //     };
// //   }, []);

// //   const startScanner = async () => {
// //     if (!scannerRef.current) {
// //       toast.error("Scanner non initialisé");
// //       return;
// //     }
    
// //     try {
// //       console.log("Tentative de démarrage du scanner...");
      
// //       // Vérifier si le scanner est déjà en cours d'exécution
// //       if (scannerRef.current.isScanning) {
// //         console.log("Le scanner est déjà en cours d'exécution");
// //         setIsCameraActive(true);
// //         return;
// //       }
      
// //       // Démarrer le scanner avec des options plus permissives
// //       await scannerRef.current.start(
// //         { facingMode: "environment" },
// //         {
// //           fps: 10,
// //           qrbox: { width: 250, height: 250 },
// //           aspectRatio: 1.0,
// //           disableFlip: false,
// //           videoConstraints: {
// //             facingMode: { exact: "environment" },
// //             width: { ideal: 1280 },
// //             height: { ideal: 720 }
// //           }
// //         },
// //         onScanSuccess,
// //         onScanFailure
// //       );
      
// //       setIsCameraActive(true);
// //       setErrorMessage('');
// //       toast.success('Caméra activée');
// //       console.log("Scanner démarré avec succès");
// //     } catch (err) {
// //       console.error("Erreur détaillée lors de l'activation de la caméra:", err);
// //       const errorMsg = err instanceof Error ? err.message : String(err);
// //       setErrorMessage(`Erreur d'activation: ${errorMsg}`);
// //       toast.error(`Erreur lors de l'activation de la caméra: ${errorMsg}`);
      
// //       // Essayer une approche alternative si la première échoue
// //       tryAlternativeCamera();
// //     }
// //   };

// //   const tryAlternativeCamera = async () => {
// //     if (!scannerRef.current) return;
    
// //     try {
// //       console.log("Tentative avec une configuration alternative...");
      
// //       // Essayer avec une configuration plus simple
// //       await scannerRef.current.start(
// //         { facingMode: "user" }, // Essayer la caméra frontale
// //         {
// //           fps: 10,
// //           qrbox: { width: 250, height: 250 },
// //         },
// //         onScanSuccess,
// //         onScanFailure
// //       );
      
// //       setIsCameraActive(true);
// //       setErrorMessage('');
// //       toast.success('Caméra activée (mode alternatif)');
// //       console.log("Scanner démarré avec succès en mode alternatif");
// //     } catch (err) {
// //       console.error("Échec de la configuration alternative:", err);
// //       const errorMsg = err instanceof Error ? err.message : String(err);
// //       setErrorMessage(`Échec de toutes les tentatives: ${errorMsg}`);
// //       toast.error(`Impossible d'activer la caméra: ${errorMsg}`);
// //     }
// //   };

// //   const stopScanner = async () => {
// //     if (!scannerRef.current) return;
    
// //     try {
// //       await scannerRef.current.stop();
// //       setIsCameraActive(false);
// //       toast.success('Caméra désactivée');
// //     } catch (err) {
// //       console.error(err);
// //       toast.error('Erreur lors de la désactivation de la caméra');
// //     }
// //   };

// //   const onScanSuccess = (decodedText: string) => {
// //     setScannedData(decodedText);
// //     if (isUrl(decodedText)) {
// //       toast.success('Lien détecté, redirection...');
// //       setTimeout(() => {
// //         window.open(decodedText, '_blank');
// //       }, 1500);
// //     } else {
// //       toast.success('QR Code scanné avec succès!');
// //     }
// //   };

// //   const onScanFailure = (error: string) => {
// //     // Ne pas afficher d'erreur pour chaque échec de scan
// //     console.warn(`Code scan error = ${error}`);
// //   };

// //   const isUrl = (text: string) => {
// //     try {
// //       new URL(text);
// //       return true;
// //     } catch {
// //       return false;
// //     }
// //   };

// //   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = event.target.files?.[0];
// //     if (file && scannerRef.current) {
// //       scannerRef.current.scanFile(file, true)
// //         .then(decodedText => {
// //           onScanSuccess(decodedText);
// //         })
// //         .catch(err => {
// //           toast.error('Erreur lors de la lecture du QR code');
// //           console.error(err);
// //         });
// //     }
// //   };

// //   const toggleCamera = () => {
// //     if (isCameraActive) {
// //       stopScanner();
// //     } else {
// //       startScanner();
// //     }
// //   };

// //   return (
// //     <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-4">
// //       <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Scanner QR Code</h2>
      
// //       <div className="flex gap-4 mb-4">
// //         <button
// //           onClick={toggleCamera}
// //           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
// //         >
// //           {isCameraActive ? 'Désactiver Caméra' : 'Activer Caméra'}
// //         </button>
// //         <button
// //           onClick={() => fileInputRef.current?.click()}
// //           className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
// //         >
// //           Capturer QR Code
// //         </button>
// //         <input
// //           type="file"
// //           ref={fileInputRef}
// //           onChange={handleFileUpload}
// //           accept="image/*"
// //           className="hidden"
// //         />
// //       </div>

// //       {errorMessage && (
// //         <div className="w-full p-3 bg-red-100 text-red-700 rounded-lg mb-4">
// //           <p className="font-medium">Erreur:</p>
// //           <p className="text-sm">{errorMessage}</p>
// //         </div>
// //       )}

// //       <div id="qr-reader" ref={qrReaderRef} className="w-full aspect-square relative bg-black rounded-lg overflow-hidden" />

// //       {scannedData && !isUrl(scannedData) && (
// //         <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full">
// //           <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Contenu scanné :</h3>
// //           <p className="text-gray-600 dark:text-gray-300 break-all">{scannedData}</p>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default QRScannerFixed; 


// import React, { useEffect, useRef, useState } from 'react';
// import { Html5Qrcode } from 'html5-qrcode';
// import toast from 'react-hot-toast';

// const QRScannerFixed: React.FC = () => {
//   const [scannedData, setScannedData] = useState<string>('');
//   const [isCameraActive, setIsCameraActive] = useState(false);
//   const [errorMessage, setErrorMessage] = useState<string>('');
//   const [isCameraSupported, setIsCameraSupported] = useState<boolean | null>(null);
//   const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
//   const [scanInfo, setScanInfo] = useState<{
//     format?: string;
//     timestamp?: string;
//     fileInfo?: {
//       name: string;
//       size: number;
//       type: string;
//     };
//   }>({});
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [showDetailsButton, setShowDetailsButton] = useState(false);
//   const scannerRef = useRef<Html5Qrcode | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const qrReaderRef = useRef<HTMLDivElement>(null);

//   // Vérifier si la caméra est supportée par le navigateur
//   useEffect(() => {
//     const checkCameraSupport = async () => {
//       setIsCheckingPermissions(true);
//       try {
//         // Vérifier si l'API MediaDevices est disponible
//         if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//           console.error("L'API MediaDevices n'est pas supportée par ce navigateur");
//           setIsCameraSupported(false);
//           setErrorMessage("Votre navigateur ne supporte pas l'accès à la caméra. Veuillez utiliser un navigateur plus récent ou activer les autorisations de caméra.");
//           setIsCheckingPermissions(false);
//           return;
//         }

//         // Lister les périphériques vidéo disponibles
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         const videoDevices = devices.filter(device => device.kind === 'videoinput');
//         console.log('Périphériques vidéo disponibles:', videoDevices);

//         if (videoDevices.length === 0) {
//           console.error("Aucun périphérique vidéo trouvé");
//           setIsCameraSupported(false);
//           setErrorMessage("Aucune caméra n'a été détectée sur votre appareil.");
//           setIsCheckingPermissions(false);
//           return;
//         }

//         // Vérifier les autorisations de caméra
//         const stream = await navigator.mediaDevices.getUserMedia({ 
//           video: {
//             width: { ideal: 1280 },
//             height: { ideal: 720 },
//             facingMode: "environment"
//           } 
//         });
        
//         // Vérifier si le flux est actif
//         const videoTrack = stream.getVideoTracks()[0];
//         console.log('État de la piste vidéo:', videoTrack.enabled ? 'activée' : 'désactivée');
//         console.log('Capabilities de la caméra:', videoTrack.getCapabilities());
//         console.log('Settings de la caméra:', videoTrack.getSettings());
        
//         // Arrêter le flux immédiatement après la vérification
//         stream.getTracks().forEach(track => track.stop());
        
//         setIsCameraSupported(true);
//         console.log("Caméra supportée et autorisée");
//       } catch (error) {
//         console.error("Erreur détaillée lors de la vérification de la caméra:", error);
//         setIsCameraSupported(false);
        
//         if (error instanceof Error) {
//           if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
//             setErrorMessage("Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.");
//           } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
//             setErrorMessage("Aucune caméra n'a été trouvée sur votre appareil.");
//           } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
//             setErrorMessage("La caméra est déjà utilisée par une autre application.");
//           } else if (error.name === 'OverconstrainedError') {
//             setErrorMessage("Les contraintes demandées ne sont pas supportées par la caméra.");
//           } else if (error.name === 'TypeError') {
//             setErrorMessage("Erreur de type lors de l'accès à la caméra. Vérifiez que vous utilisez HTTPS ou localhost.");
//           } else {
//             setErrorMessage(`Erreur d'accès à la caméra: ${error.message}`);
//           }
//         } else {
//           setErrorMessage("Erreur inconnue lors de l'accès à la caméra.");
//         }
//       } finally {
//         setIsCheckingPermissions(false);
//       }
//     };

//     checkCameraSupport();
//   }, []);

//   useEffect(() => {
//     // Initialiser le scanner
//     try {
//       if (!qrReaderRef.current) {
//         console.error("L'élément qr-reader n'est pas trouvé dans le DOM");
//         return;
//       }
      
//       scannerRef.current = new Html5Qrcode("qr-reader");
//       console.log("Scanner initialisé avec succès");
//     } catch (error) {
//       console.error("Erreur lors de l'initialisation du scanner:", error);
//       setErrorMessage(`Erreur d'initialisation: ${error instanceof Error ? error.message : String(error)}`);
//     }
    
//     return () => {
//       // Nettoyer le scanner lors du démontage du composant
//       if (scannerRef.current && scannerRef.current.isScanning) {
//         scannerRef.current.stop().catch(console.error);
//       }
//     };
//   }, []);

//   const startScanner = async () => {
//     if (!scannerRef.current) {
//       toast.error("Scanner non initialisé");
//       return;
//     }

//     if (isCameraSupported === false) {
//       toast.error("La caméra n'est pas supportée par votre navigateur");
//       return;
//     }
    
//     try {
//       console.log("Tentative de démarrage du scanner...");
      
//       // Vérifier si le scanner est déjà en cours d'exécution
//       if (scannerRef.current.isScanning) {
//         console.log("Le scanner est déjà en cours d'exécution");
//         setIsCameraActive(true);
//         return;
//       }
      
//       // Démarrer le scanner avec des options plus permissives
//       await scannerRef.current.start(
//         { 
//           facingMode: "environment",
//           width: { ideal: 1280 },
//           height: { ideal: 720 }
//         },
//         {
//           fps: 10,
//           qrbox: { width: 250, height: 250 },
//           aspectRatio: 1.0,
//           disableFlip: false,
//         },
//         onScanSuccess,
//         onScanFailure
//       );
      
//       setIsCameraActive(true);
//       setErrorMessage('');
//       toast.success('Caméra activée');
//       console.log("Scanner démarré avec succès");
//     } catch (err) {
//       console.error("Erreur détaillée lors de l'activation de la caméra:", err);
//       const errorMsg = err instanceof Error ? err.message : String(err);
//       setErrorMessage(`Erreur d'activation: ${errorMsg}`);
//       toast.error(`Erreur lors de l'activation de la caméra: ${errorMsg}`);
      
//       // Essayer une approche alternative si la première échoue
//       tryAlternativeCamera();
//     }
//   };

//   const tryAlternativeCamera = async () => {
//     if (!scannerRef.current) return;
    
//     try {
//       console.log("Tentative avec une configuration alternative...");
      
//       // Essayer avec une configuration plus simple
//       await scannerRef.current.start(
//         { facingMode: "user" }, // Essayer la caméra frontale
//         {
//           fps: 10,
//           qrbox: { width: 250, height: 250 },
//         },
//         onScanSuccess,
//         onScanFailure
//       );
      
//       setIsCameraActive(true);
//       setErrorMessage('');
//       toast.success('Caméra activée (mode alternatif)');
//       console.log("Scanner démarré avec succès en mode alternatif");
//     } catch (err) {
//       console.error("Échec de la configuration alternative:", err);
//       const errorMsg = err instanceof Error ? err.message : String(err);
//       setErrorMessage(`Échec de toutes les tentatives: ${errorMsg}`);
//       toast.error(`Impossible d'activer la caméra: ${errorMsg}`);
//     }
//   };

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) {
//       toast.error('Aucun fichier sélectionné');
//       return;
//     }

//     if (!scannerRef.current) {
//       toast.error('Scanner non initialisé');
//       return;
//     }

//     try {
//       console.log('Tentative de scan du fichier:', file.name);
      
//       // Vérifier le type de fichier
//       if (!file.type.startsWith('image/')) {
//         toast.error('Le fichier doit être une image');
//         return;
//       }

//       // Vérifier la taille du fichier (max 5MB)
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error('Le fichier est trop volumineux (max 5MB)');
//         return;
//       }

//       // Afficher un toast de chargement
//       const loadingToast = toast.loading('Analyse du QR code en cours...');

//       try {
//         // Essayer avec l'option showImage=false pour éviter les problèmes de rendu
//         const decodedText = await scannerRef.current.scanFile(file, false);
//         console.log('QR code décodé avec succès:', decodedText);
        
//         // Enregistrer les informations du scan
//         setScanInfo({
//           format: 'QR Code',
//           timestamp: new Date().toLocaleString(),
//           fileInfo: {
//             name: file.name,
//             size: file.size,
//             type: file.type
//           }
//         });
        
//         // S'assurer que le bouton de détails est visible
//         setShowDetailsButton(true);
        
//         toast.dismiss(loadingToast);
//         onScanSuccess(decodedText);
        
//         // Log pour déboguer
//         console.log('État après scan par capture - scannedData:', decodedText);
//         console.log('État après scan par capture - scanInfo:', {
//           format: 'QR Code',
//           timestamp: new Date().toLocaleString(),
//           fileInfo: {
//             name: file.name,
//             size: file.size,
//             type: file.type
//           }
//         });
//         console.log('État après scan par capture - showDetailsButton:', true);
//       } catch (scanError) {
//         console.error('Erreur détaillée lors du scan:', scanError);
//         toast.dismiss(loadingToast);
        
//         if (scanError instanceof Error) {
//           if (scanError.message.includes('No MultiFormat Readers')) {
//             toast.error('Impossible de détecter le QR code. Vérifiez que l\'image contient un QR code valide et de bonne qualité.');
//           } else if (scanError.message.includes('No QR code found')) {
//             toast.error('Aucun QR code trouvé dans l\'image');
//           } else if (scanError.message.includes('NotFoundException')) {
//             toast.error('QR code non trouvé. Assurez-vous que l\'image est claire et que le QR code est bien visible.');
//           } else {
//             toast.error(`Erreur lors de la lecture du QR code: ${scanError.message}`);
//           }
//         } else {
//           toast.error('Erreur inconnue lors de la lecture du QR code');
//         }
//       }
//     } catch (error) {
//       console.error('Erreur lors du traitement du fichier:', error);
//       toast.error('Erreur lors du traitement du fichier');
//     } finally {
//       // Réinitialiser l'input file pour permettre la sélection du même fichier
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//     }
//   };

//   const onScanSuccess = (decodedText: string) => {
//     console.log('QR code scanné avec succès:', decodedText);
//     setScannedData(decodedText);
//     setShowDetailsButton(true);
    
//     // Si les informations de scan n'ont pas été définies (cas de la caméra)
//     if (!scanInfo.timestamp) {
//       setScanInfo({
//         format: 'QR Code',
//         timestamp: new Date().toLocaleString()
//       });
//     }
    
//     if (isUrl(decodedText)) {
//       toast.success('Lien détecté, redirection...');
//       // Ne pas rediriger immédiatement pour permettre à l'utilisateur de voir les détails
//       setTimeout(() => {
//         window.open(decodedText, '_blank');
//       }, 3000); // Augmenter le délai pour donner plus de temps à l'utilisateur
//     } else {
//       toast.success('QR Code scanné avec succès!');
//     }
    
//     // Forcer l'affichage du bouton après le scan
//     console.log('État après scan - scannedData:', decodedText);
//     console.log('État après scan - scanInfo:', scanInfo);
//     console.log('État après scan - showDetailsButton:', true);
//   };

//   const onScanFailure = (error: string) => {
//     // Ne pas afficher d'erreur pour chaque échec de scan
//     console.warn(`Code scan error = ${error}`);
//   };

//   const isUrl = (text: string) => {
//     try {
//       new URL(text);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   const toggleCamera = () => {
//     if (isCameraActive) {
//       stopScanner();
//     } else {
//       startScanner();
//     }
//   };

//   const stopScanner = async () => {
//     if (!scannerRef.current) return;
    
//     try {
//       await scannerRef.current.stop();
//       setIsCameraActive(false);
//       toast.success('Caméra désactivée');
//     } catch (err) {
//       console.error(err);
//       toast.error('Erreur lors de la désactivation de la caméra');
//     }
//   };

//   const requestCameraPermission = async () => {
//     setIsCheckingPermissions(true);
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       stream.getTracks().forEach(track => track.stop());
//       setIsCameraSupported(true);
//       setErrorMessage('');
//       toast.success('Accès à la caméra autorisé');
//     } catch (error) {
//       console.error("Erreur lors de la demande d'autorisation:", error);
//       if (error instanceof Error) {
//         setErrorMessage(`Erreur d'autorisation: ${error.message}`);
//       } else {
//         setErrorMessage("Erreur inconnue lors de la demande d'autorisation");
//       }
//     } finally {
//       setIsCheckingPermissions(false);
//     }
//   };

//   const openModal = () => {
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//   };

//   return (
//     <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-4">
//       <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Scanner QR Code</h2>
      
//       {isCheckingPermissions ? (
//         <div className="w-full p-4 bg-blue-100 text-blue-700 rounded-lg mb-4">
//           <p className="text-center">Vérification des autorisations de caméra...</p>
//         </div>
//       ) : (
//         <>
//           <div className="flex flex-wrap gap-4 mb-4">
//             <button
//               onClick={toggleCamera}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//               disabled={isCameraSupported === false}
//             >
//               {isCameraActive ? 'Désactiver Caméra' : 'Activer Caméra'}
//             </button>
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//             >
//               Capturer QR Code dsdsSAS DSADASDASDSADSADSA
//             </button>
//             <button
//               onClick={openModal}
//               className={`px-4 py-2 ${scannedData ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-lg transition-colors`}
//               // disabled={!scannedData}
//             >
//               Voir les détails
//             </button>
//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileUpload}
//               accept="image/*"
//               className="hidden"
//             />
//           </div>

//           {errorMessage && (
//             <div className="w-full p-3 bg-red-100 text-red-700 rounded-lg mb-4">
//               <p className="font-medium">Erreur:</p>
//               <p className="text-sm">{errorMessage}</p>
//               {errorMessage.includes("refusé") && (
//                 <div className="mt-2 text-sm">
//                   <p>Pour autoriser l'accès à la caméra:</p>
//                   <ol className="list-decimal pl-4 mt-1">
//                     <li>Cliquez sur l'icône du cadenas dans la barre d'adresse</li>
//                     <li>Sélectionnez "Autoriser" pour l'accès à la caméra</li>
//                     <li>Rafraîchissez la page</li>
//                   </ol>
//                   <button 
//                     onClick={requestCameraPermission}
//                     className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
//                   >
//                     Réessayer l'autorisation
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </>
//       )}

//       <div id="qr-reader" ref={qrReaderRef} className="w-full aspect-square relative bg-black rounded-lg overflow-hidden" />

//       {scannedData && (
//         <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full">
//           <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Contenu scanné :</h3>
//           <p className="text-gray-600 dark:text-gray-300 break-all">{scannedData}</p>
          
//           {isUrl(scannedData) && (
//             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//               <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Lien détecté :</h4>
//               <a 
//                 href={scannedData} 
//                 target="_blank" 
//                 rel="noopener noreferrer"
//                 className="text-blue-600 dark:text-blue-400 hover:underline break-all"
//               >
//                 {scannedData}
//               </a>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Modal pour afficher les informations détaillées */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-bold text-gray-800 dark:text-white">Informations du QR Code</h3>
//                 <button 
//                   onClick={closeModal}
//                   className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>
              
//               <div className="mb-4">
//                 <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Contenu :</h4>
//                 <p className="text-gray-600 dark:text-gray-300 break-all p-3 bg-gray-100 dark:bg-gray-700 rounded">{scannedData}</p>
//               </div>
              
//               {scanInfo.timestamp && (
//                 <div className="mb-4">
//                   <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Informations du scan :</h4>
//                   <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
//                     <li><span className="font-medium">Format :</span> {scanInfo.format}</li>
//                     <li><span className="font-medium">Date et heure :</span> {scanInfo.timestamp}</li>
//                     {scanInfo.fileInfo && (
//                       <>
//                         <li><span className="font-medium">Fichier :</span> {scanInfo.fileInfo.name}</li>
//                         <li><span className="font-medium">Taille :</span> {(scanInfo.fileInfo.size / 1024).toFixed(2)} KB</li>
//                         <li><span className="font-medium">Type :</span> {scanInfo.fileInfo.type}</li>
//                       </>
//                     )}
//                   </ul>
//                 </div>
//               )}
              
//               {isUrl(scannedData) && (
//                 <div className="mb-4">
//                   <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Lien détecté :</h4>
//                   <a 
//                     href={scannedData} 
//                     target="_blank" 
//                     rel="noopener noreferrer"
//                     className="text-blue-600 dark:text-blue-400 hover:underline break-all block p-3 bg-gray-100 dark:bg-gray-700 rounded"
//                   >
//                     {scannedData}
//                   </a>
//                 </div>
//               )}
              
//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={closeModal}
//                   className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
//                 >
//                   Fermer
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default QRScannerFixed; 