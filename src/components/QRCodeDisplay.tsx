'use client';

import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownTrayIcon, ShareIcon, LinkIcon, MapPinIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { QRCodeData } from './QRCodeGenerator';
import { useState } from 'react';

interface QRCodeDisplayProps {
  qrCode: QRCodeData;
  onDownload: (data: QRCodeData, format: 'png' | 'svg') => void;
  onShare: (data: QRCodeData) => void;
}

type QRCodeType = 'link' | 'visit' | 'contact' | 'event';

export default function QRCodeDisplay({ qrCode, onDownload, onShare }: QRCodeDisplayProps) {
  const [activeTab, setActiveTab] = useState<QRCodeType>('link');
  
  // Fonction pour formater le contenu du QR code en fonction du type
  const formatQRContent = (type: QRCodeType, content: string) => {
    switch (type) {
      case 'link':
        return content;
      case 'visit':
        return `geo:${content}`;
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${content}\nEND:VCARD`;
      case 'event':
        return `BEGIN:VEVENT\nSUMMARY:${content}\nDTSTART:${new Date().toISOString()}\nEND:VEVENT`;
      default:
        return content;
    }
  };

  // Fonction pour obtenir le texte d'exemple en fonction du type
  const getExampleText = (type: QRCodeType) => {
    switch (type) {
      case 'link':
        return 'https://example.com';
      case 'visit':
        return '48.8584,2.2945';
      case 'contact':
        return 'John Doe';
      case 'event':
        return 'Réunion importante';
      default:
        return '';
    }
  };

  // Fonction pour obtenir l'icône en fonction du type
  const getTabIcon = (type: QRCodeType) => {
    switch (type) {
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      case 'visit':
        return <MapPinIcon className="w-5 h-5" />;
      case 'contact':
        return <UserIcon className="w-5 h-5" />;
      case 'event':
        return <CalendarIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // Fonction pour obtenir le titre en fonction du type
  const getTabTitle = (type: QRCodeType) => {
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
        return '';
    }
  };

  return (
    <div className="card animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        QR Code généré
      </h2>
      
      {/* Barre de navigation pour les types de QR codes - STYLE AMÉLIORÉ */}
      <div className="mb-6 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          Type de QR Code
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['link', 'visit', 'contact', 'event'] as QRCodeType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg transition-colors
                ${activeTab === tab
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 border-2 border-indigo-500'
                  : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
            >
              <div className="mb-1">{getTabIcon(tab)}</div>
              <span className="text-sm font-medium">{getTabTitle(tab)}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div id={`qr-code-${qrCode.timestamp}`} className="flex flex-col items-center gap-6">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <QRCodeSVG
            value={formatQRContent(activeTab, qrCode.text)}
            size={256}
            fgColor={qrCode.fgColor}
            bgColor={qrCode.bgColor}
            level="H"
          />
        </div>
        
        {/* Informations sur le type de QR code */}
        <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            {getTabTitle(activeTab)}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {activeTab === 'link' && 'Ce QR code contient un lien vers un site web.'}
            {activeTab === 'visit' && 'Ce QR code contient des coordonnées géographiques pour une visite.'}
            {activeTab === 'contact' && 'Ce QR code contient les informations de contact d\'une personne.'}
            {activeTab === 'event' && 'Ce QR code contient les détails d\'un événement.'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
            Exemple: {getExampleText(activeTab)}
          </p>
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