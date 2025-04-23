'use client';

import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import QRCodeHistory from '@/components/QRCodeHistory';
import ThemeToggle from '@/components/ThemeToggle';
import ScanButton from '@/components/ScanButton';

interface QRCodeData {
  text: string;
  fgColor: string;
  bgColor: string;
  timestamp: number;
}

export default function Home() {
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [history, setHistory] = useState<QRCodeData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (data: QRCodeData) => {
    setIsGenerating(true);
    try {
      const newQRCode = { ...data, timestamp: Date.now() };
      setQrCode(newQRCode);
      setHistory(prev => [newQRCode, ...prev]);
      toast.success('QR Code généré avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération du QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (data: QRCodeData, format: 'png' | 'svg') => {
    try {
      // On utilise un ID unique pour cibler le bon SVG
      const svgId = `qr-code-${data.timestamp}`;
      const svgElement = document.getElementById(svgId)?.querySelector('svg');
      if (!svgElement) throw new Error('SVG not found');

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
      toast.success(`QR Code téléchargé en ${format.toUpperCase()} !`);
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
        toast.success('QR Code partagé avec succès !');
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

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Générateur de QR Code
            </h1>
            
          </div>
          <ThemeToggle />
        </div>

        <QRCodeGenerator onGenerate={handleGenerate} isGenerating={isGenerating} />

        {qrCode && (
          <QRCodeDisplay
            qrCode={qrCode}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        )}

        <QRCodeHistory
          history={history}
          onDownload={handleDownload}
          onShare={handleShare}
        />

      <ScanButton />
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}
