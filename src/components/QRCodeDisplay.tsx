'use client';

import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline';
import { QRCodeData } from './QRCodeGenerator';

interface QRCodeDisplayProps {
  qrCode: QRCodeData;
  onDownload: (data: QRCodeData, format: 'png' | 'svg') => void;
  onShare: (data: QRCodeData) => void;
}

export default function QRCodeDisplay({ qrCode, onDownload, onShare }: QRCodeDisplayProps) {
  return (
    <div className="card animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        QR Code généré
      </h2>
      <div id={`qr-code-${qrCode.timestamp}`} className="flex flex-col items-center gap-6">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <QRCodeSVG
            value={qrCode.text}
            size={256}
            fgColor={qrCode.fgColor}
            bgColor={qrCode.bgColor}
            level="H"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => onDownload(qrCode, 'png')}
            className="btn btn-primary flex items-center gap-2"
            title="Télécharger en PNG"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            PNG
          </button>
          <button
            onClick={() => onDownload(qrCode, 'svg')}
            className="btn btn-primary flex items-center gap-2"
            title="Télécharger en SVG"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            SVG
          </button>
          <button
            onClick={() => onShare(qrCode)}
            className="btn btn-secondary flex items-center gap-2"
            title="Partager"
          >
            <ShareIcon className="w-5 h-5" />
            Partager
          </button>
        </div>
      </div>
    </div>
  );
} 