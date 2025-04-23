'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeData } from '@/components/QRCodeGenerator';
import QRCodeHistory from '@/components/QRCodeHistory';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QRCodeData[]>([]);

  useEffect(() => {
    // Charger l'historique depuis le localStorage
    const savedHistory = localStorage.getItem('qrCodeHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleDownload = (data: QRCodeData, format: 'png' | 'svg') => {
    try {
      // On utilise un ID unique pour cibler le bon SVG
      const svgId = `qr-code-${data.timestamp}`;
      const modalSvgId = `qr-code-modal-${data.timestamp}`;
      
      // Essayer d'abord de trouver le QR code dans la modal si elle est ouverte
      let svgElement = document.getElementById(modalSvgId)?.querySelector('svg');
      
      // Si non trouvé, chercher dans la liste
      if (!svgElement) {
        svgElement = document.getElementById(svgId)?.querySelector('svg');
      }
      
      if (!svgElement) {
        console.error('SVG not found for ID:', svgId);
        toast.error('Impossible de trouver le QR code pour le téléchargement');
        return;
      }

      if (format === 'svg') {
        // Pour le format SVG, on télécharge directement le SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qrcode-${Date.now()}.svg`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Pour le format PNG, on convertit le SVG en PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Context not found');

        // Définir une taille fixe pour le canvas
        const size = 512; // Taille plus grande pour une meilleure qualité
        canvas.width = size;
        canvas.height = size;

        // Créer une image à partir du SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = () => {
          // Fond avec la couleur spécifiée
          ctx.fillStyle = data.bgColor;
          ctx.fillRect(0, 0, size, size);
          
          // Dessiner le QR code
          ctx.drawImage(img, 0, 0, size, size);

          // Télécharger le PNG
          const link = document.createElement('a');
          link.download = `qrcode-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          URL.revokeObjectURL(url);
        };

        img.src = url;
      }
      toast.success('QR code téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleShare = async (data: QRCodeData) => {
    try {
      if (navigator.share) {
        const shareData = {
          title: 'Mon QR Code',
          text: `QR Code pour: ${data.text}`,
          url: data.text.startsWith('http') ? data.text : undefined,
        };

        await navigator.share(shareData);
        toast.success('QR code partagé avec succès !');
      } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API Share
        const textArea = document.createElement('textarea');
        textArea.value = data.text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Lien copié dans le presse-papier !');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erreur lors du partage:', error);
        toast.error('Erreur lors du partage');
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      localStorage.removeItem('qrCodeHistory');
      setHistory([]);
      toast.success('Historique effacé avec succès !');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fond 3D */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* En-tête avec bouton retour et titre */}
        <div className="w-full max-w-4xl mb-8 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Retour</span>
          </button>
          <h1 className="text-2xl font-bold text-white">Historique des QR Codes</h1>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/80 backdrop-blur-sm text-white rounded-full border border-red-400/30 hover:bg-red-500 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Effacer l'historique</span>
            </button>
          )}
        </div>

        {/* Historique des QR codes */}
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white text-lg">Aucun QR code dans l'historique</p>
              <button
                onClick={() => router.push('/generate')}
                className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Générer un QR code
              </button>
            </div>
          ) : (
            <QRCodeHistory
              history={history}
              onDownload={handleDownload}
              onShare={handleShare}
            />
          )}
        </div>
      </div>
    </main>
  );
} 