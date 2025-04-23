'use client';

import QRScannerFixed from '@/components/QRScannerFixed';
import { Toaster } from 'react-hot-toast';

export default function ScanPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8">Scanner QR Code</h1>
        <QRScannerFixed />
      </div>
      <Toaster position="top-center" />
    </main>
  );
} 