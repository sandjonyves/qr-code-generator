'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface QRCodeGeneratorProps {
  onGenerate: (data: QRCodeData) => void;
  isGenerating: boolean;
}

export interface QRCodeData {
  text: string;
  fgColor: string;
  bgColor: string;
  timestamp: number;
}

export default function QRCodeGenerator({ onGenerate, isGenerating }: QRCodeGeneratorProps) {
  const [text, setText] = useState('');
  const [fgColor, setFgColor] = useState('#4F46E5');
  const [bgColor, setBgColor] = useState('#FFFFFF');

  const handleGenerate = () => {
    if (!text) return;

    const newQRCode: QRCodeData = {
      text,
      fgColor,
      bgColor,
      timestamp: Date.now(),
    };

    onGenerate(newQRCode);
  };

  const handleReset = () => {
    setText('');
    setFgColor('#4F46E5');
    setBgColor('#FFFFFF');
  };

  return (
    <div className="card animate-fade-in">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Texte ou URL
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input"
            placeholder="Entrez votre texte ou URL ici..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Couleur du QR Code
            </label>
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="color-picker"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Couleur de fond
            </label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="color-picker"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              'Générer le QR Code'
            )}
          </button>
          <button
            onClick={handleReset}
            className="btn btn-secondary"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 