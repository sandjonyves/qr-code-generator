'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownTrayIcon, ShareIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { QRCodeData } from './QRCodeGenerator';

interface QRCodeHistoryProps {
  history: QRCodeData[];
  onDownload: (data: QRCodeData, format: 'png' | 'svg') => void;
  onShare: (data: QRCodeData) => void;
}

export default function QRCodeHistory({ history, onDownload, onShare }: QRCodeHistoryProps) {
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);

  if (history.length === 0) return null;

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'link':
        return 'Lien';
      case 'visit':
        return 'Visite';
      case 'contact':
        return 'Contact';
      case 'event':
        return 'Événement';
      default:
        return 'QR Code';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        Historique
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <div
            key={item.timestamp}
            className="bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            <div className="p-4 space-y-4">
              {/* En-tête avec type et date */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {getTypeLabel(item.type)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(item.timestamp)}
                </span>
              </div>

              {/* Contenu principal */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <div id={`qr-code-${item.timestamp}`}>
                      <QRCodeSVG
                        value={item.text}
                        size={64}
                        fgColor={item.fgColor}
                        bgColor={item.bgColor}
                        level="H"
                        imageSettings={item.logo ? {
                          src: item.logo,
                          height: 15,
                          width: 15,
                          excavate: true
                        } : undefined}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {item.type === 'visit' ? item.details?.locationName || item.text :
                     item.type === 'contact' ? `${item.details?.firstName} ${item.details?.lastName}` :
                     item.type === 'event' ? item.details?.eventTitle || item.text :
                     item.text}
                  </p>
                  {item.type === 'visit' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {item.details?.city}, {item.details?.district}
                    </p>
                  )}
                </div>
              </div>

              {/* Barre d'actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setSelectedQR(item)}
                  className="btn btn-secondary p-2 rounded-lg"
                  title="Visualiser"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
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
          </div>
        ))}
      </div>

      {/* Modal de visualisation */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {getTypeLabel(selectedQR.type)}
              </h3>
              
              <div className="flex justify-center">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg">
                  <div id={`qr-code-modal-${selectedQR.timestamp}`}>
                    <QRCodeSVG
                      value={selectedQR.text}
                      size={256}
                      fgColor={selectedQR.fgColor}
                      bgColor={selectedQR.bgColor}
                      level="H"
                      imageSettings={selectedQR.logo ? {
                        src: selectedQR.logo,
                        height: 50,
                        width: 50,
                        excavate: true
                      } : undefined}
                    />
                  </div>
                </div>
              </div>

              {selectedQR.type === 'visit' && (
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Lieu :</span> {selectedQR.details?.locationName}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Ville :</span> {selectedQR.details?.city}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Quartier :</span> {selectedQR.details?.district}
                  </p>
                  {selectedQR.details?.resistanceDescription && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Description :</span> {selectedQR.details.resistanceDescription}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => onDownload(selectedQR, 'png')}
                  className="btn btn-primary"
                >
                  Télécharger PNG
                </button>
                <button
                  onClick={() => onShare(selectedQR)}
                  className="btn btn-secondary"
                >
                  Partager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 