'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import QRScannerWithPermissions from '@/components/QRScannerWithPermissions';

// Import dynamique du composant Background3D
const Background3D = dynamic(() => import('@/components/Background3D'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
  ),
});

export default function ScanPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fond 3D */}
      <Background3D />

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* En-tête avec bouton retour */}
        <div className="w-full max-w-4xl mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Retour</span>
          </button>
        </div>

        {/* Scanner QR Code */}
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <QRScannerWithPermissions />
        </div>
      </div>
    </main>
  );
} 