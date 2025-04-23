'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { QrCodeIcon, ViewfinderCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Import dynamique du composant Background3D pour éviter les problèmes de SSR
const Background3D = dynamic(() => import('@/components/Background3D'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
  ),
});

export default function Home() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fond 3D */}
      <Background3D />

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            QR Code Generator
          </h1>
          <p className="text-lg md:text-xl text-gray-200">
            Générez et scannez vos QR codes en toute simplicité
          </p>
        </div>

        {/* Boutons principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          <Link
            href="/generate"
            className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-2xl p-6 transition-all duration-300 border border-white/20 hover:border-white/40"
          >
            <div className="flex flex-col items-center gap-4">
              <QrCodeIcon className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-semibold text-white">Générer un QR Code</h2>
              <p className="text-gray-300 text-center">
                Créez des QR codes personnalisés pour vos liens, contacts et plus encore
              </p>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          </Link>

          <Link
            href="/scan"
            className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-2xl p-6 transition-all duration-300 border border-white/20 hover:border-white/40"
          >
            <div className="flex flex-col items-center gap-4">
              <ViewfinderCircleIcon className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-semibold text-white">Scanner un QR Code</h2>
              <p className="text-gray-300 text-center">
                Scannez n'importe quel QR code avec votre caméra ou depuis une image
              </p>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          </Link>
        </div>

        {/* Bouton Historique */}
        <Link
          href="/history"
          className="mt-8 group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full px-6 py-3 transition-all duration-300 border border-white/20 hover:border-white/40"
        >
          <ClockIcon className="w-5 h-5 text-white" />
          <span className="text-white font-medium">Voir l'historique</span>
        </Link>
      </div>
    </main>
  );
}
