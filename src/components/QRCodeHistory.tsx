'use client';

import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline';
import { QRCodeData } from './QRCodeGenerator';

interface QRCodeHistoryProps {
  history: QRCodeData[];
  onDownload: (data: QRCodeData, format: 'png' | 'svg') => void;
  onShare: (data: QRCodeData) => void;
}

export default function QRCodeHistory({ history, onDownload, onShare }: QRCodeHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="card animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        Historique
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <div
            key={item.timestamp}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            <div className="flex items-center gap-4">
              <div id={`qr-code-${item.timestamp}`} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <QRCodeSVG
                  value={item.text}
                  size={64}
                  fgColor={item.fgColor}
                  bgColor={item.bgColor}
                  level="H"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
                  {item.text}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onDownload(item, 'png')}
                className="btn btn-primary p-2 rounded-lg"
                title="Télécharger en PNG"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDownload(item, 'svg')}
                className="btn btn-primary p-2 rounded-lg"
                title="Télécharger en SVG"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onShare(item)}
                className="btn btn-secondary p-2 rounded-lg"
                title="Partager"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 