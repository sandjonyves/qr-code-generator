'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import QRCodeGenerator, { QRCodeData } from '@/components/QRCodeGenerator';
import toast from 'react-hot-toast';

// Import dynamique du composant Background3D
const Background3D = dynamic(() => import('@/components/Background3D'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
  ),
});

export default function GeneratePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (data: QRCodeData) => {
    try {
      setIsGenerating(true);
      
      // Sauvegarder dans l'historique
      const savedHistory = localStorage.getItem('qrCodeHistory');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      history.unshift(data); // Ajouter au début de l'historique
      localStorage.setItem('qrCodeHistory', JSON.stringify(history));

      // Afficher un message de succès avec un bouton pour voir l'historique
      toast.success(
        (t) => (
          <div className="flex flex-col items-center">
            <p>QR Code généré avec succès !</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                router.push('/history');
              }}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Voir l'historique
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      toast.error('Erreur lors de la génération du QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fond 3D */}
      <Background3D />

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* En-tête avec boutons */}
        <div className="w-full max-w-4xl mb-8 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <button
            onClick={() => router.push('/history')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <ClockIcon className="w-5 h-5" />
            <span>Voir l'historique</span>
          </button>
        </div>

        {/* Générateur QR Code */}
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <QRCodeGenerator 
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </main>
  );
} 