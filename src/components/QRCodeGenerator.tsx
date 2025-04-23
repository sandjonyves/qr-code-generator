'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownTrayIcon, ArrowPathIcon, LinkIcon, MapPinIcon, UserIcon, CalendarIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, ClockIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface QRCodeGeneratorProps {
  onGenerate: (data: QRCodeData) => void;
  isGenerating: boolean;
}

export interface QRCodeData {
  text: string;
  fgColor: string;
  bgColor: string;
  timestamp: number;
  type?: QRCodeType;
  details?: QRCodeDetails;
  logo?: string;
}

export type QRCodeType = 'link' | 'visit' | 'contact' | 'event';

export interface QRCodeDetails {
  // Champs communs
  title?: string;
  description?: string;
  
  // Champs pour les visites
  latitude?: string;
  longitude?: string;
  locationName?: string;
  city?: string;
  district?: string;
  resistanceDescription?: string;
  
  // Champs pour les contacts
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  organization?: string;
  
  // Champs pour les événements
  eventTitle?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export default function QRCodeGenerator({ onGenerate, isGenerating }: QRCodeGeneratorProps) {
  const [text, setText] = useState('');
  const [fgColor, setFgColor] = useState('#4F46E5');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [activeTab, setActiveTab] = useState<QRCodeType>('link');
  const [logo, setLogo] = useState<string | null>(null);
  const [generatedQRCode, setGeneratedQRCode] = useState<QRCodeData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // État pour les détails des QR codes
  const [details, setDetails] = useState<QRCodeDetails>({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    locationName: '',
    city: '',
    district: '',
    resistanceDescription: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    organization: '',
    eventTitle: '',
    startDate: '',
    endDate: '',
    location: ''
  });

  // Fonction pour formater le contenu du QR code en fonction du type
  const formatQRContent = (type: QRCodeType, content: string, details: QRCodeDetails) => {
    switch (type) {
      case 'link':
        return content;
      case 'visit':
        return `geo:${details.latitude},${details.longitude}?q=${details.latitude},${details.longitude}(${details.locationName || 'Emplacement'})`;
      case 'contact':
        return `BEGIN:VCARD
VERSION:3.0
FN:${details.firstName} ${details.lastName}
TEL:${details.phone || ''}
EMAIL:${details.email || ''}
ORG:${details.organization || ''}
END:VCARD`;
      case 'event':
        return `BEGIN:VEVENT
SUMMARY:${details.eventTitle || content}
DTSTART:${details.startDate ? new Date(details.startDate).toISOString() : new Date().toISOString()}
DTEND:${details.endDate ? new Date(details.endDate).toISOString() : new Date(Date.now() + 3600000).toISOString()}
LOCATION:${details.location || ''}
DESCRIPTION:${details.description || ''}
END:VEVENT`;
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

  const handleGenerate = () => {
    if (!text) {
      toast.error('Veuillez entrer un texte pour générer le QR code');
      return;
    }

    const newQRCode: QRCodeData = {
      text: formatQRContent(activeTab, text, details),
      fgColor,
      bgColor,
      timestamp: Date.now(),
      type: activeTab,
      details: { ...details },
      logo: logo || undefined
    };

    setGeneratedQRCode(newQRCode);
    onGenerate(newQRCode);
    toast.success('QR code généré avec succès !');
  };

  const handleReset = () => {
    setText('');
    setFgColor('#4F46E5');
    setBgColor('#FFFFFF');
    setLogo(null);
    setGeneratedQRCode(null);
    setDetails({
      title: '',
      description: '',
      latitude: '',
      longitude: '',
      locationName: '',
      city: '',
      district: '',
      resistanceDescription: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      organization: '',
      eventTitle: '',
      startDate: '',
      endDate: '',
      location: ''
    });
  };

  const handleTabChange = (tab: QRCodeType) => {
    setActiveTab(tab);
    // Si le champ texte est vide, on met un exemple
    if (!text) {
      setText(getExampleText(tab));
    }
  };

  const handleDetailChange = (field: keyof QRCodeDetails, value: string) => {
    setDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Rendu des champs spécifiques selon le type de QR code
  const renderTypeSpecificFields = () => {
    switch (activeTab) {
      case 'visit':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="text"
                  value={details.latitude}
                  onChange={(e) => handleDetailChange('latitude', e.target.value)}
                  className="input"
                  placeholder="Ex: 48.8584"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  value={details.longitude}
                  onChange={(e) => handleDetailChange('longitude', e.target.value)}
                  className="input"
                  placeholder="Ex: 2.2945"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du lieu
              </label>
              <input
                type="text"
                value={details.locationName}
                onChange={(e) => handleDetailChange('locationName', e.target.value)}
                className="input"
                placeholder="Ex: Tour Eiffel"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={details.city}
                  onChange={(e) => handleDetailChange('city', e.target.value)}
                  className="input"
                  placeholder="Ex: Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quartier
                </label>
                <input
                  type="text"
                  value={details.district}
                  onChange={(e) => handleDetailChange('district', e.target.value)}
                  className="input"
                  placeholder="Ex: Marais"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description de la résistance
              </label>
              <textarea
                value={details.resistanceDescription}
                onChange={(e) => handleDetailChange('resistanceDescription', e.target.value)}
                className="input"
                rows={3}
                placeholder="Ex: Lieu historique de la résistance pendant la Seconde Guerre mondiale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo (affiché au centre du QR code)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={handleLogoClick}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <PhotoIcon className="w-5 h-5" />
                  {logo ? 'Changer le logo' : 'Ajouter un logo'}
                </button>
                {logo && (
                  <button
                    onClick={removeLogo}
                    className="btn btn-danger flex items-center gap-2"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    Supprimer
                  </button>
                )}
              </div>
              {logo && (
                <div className="mt-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="relative w-24 h-24 mx-auto">
                    <Image
                      src={logo}
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'contact':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={details.firstName}
                  onChange={(e) => handleDetailChange('firstName', e.target.value)}
                  className="input"
                  placeholder="Ex: Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={details.lastName}
                  onChange={(e) => handleDetailChange('lastName', e.target.value)}
                  className="input"
                  placeholder="Ex: Dupont"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={details.phone}
                    onChange={(e) => handleDetailChange('phone', e.target.value)}
                    className="input pl-10"
                    placeholder="Ex: +33 6 12 34 56 78"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={details.email}
                    onChange={(e) => handleDetailChange('email', e.target.value)}
                    className="input pl-10"
                    placeholder="Ex: jean.dupont@example.com"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organisation
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={details.organization}
                  onChange={(e) => handleDetailChange('organization', e.target.value)}
                  className="input pl-10"
                  placeholder="Ex: Entreprise SA"
                />
              </div>
            </div>
          </div>
        );
      
      case 'event':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre de l'événement
              </label>
              <input
                type="text"
                value={details.eventTitle}
                onChange={(e) => handleDetailChange('eventTitle', e.target.value)}
                className="input"
                placeholder="Ex: Réunion d'équipe"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de début
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={details.startDate}
                    onChange={(e) => handleDetailChange('startDate', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de fin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={details.endDate}
                    onChange={(e) => handleDetailChange('endDate', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lieu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={details.location}
                  onChange={(e) => handleDetailChange('location', e.target.value)}
                  className="input pl-10"
                  placeholder="Ex: Salle de conférence A"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={details.description}
                onChange={(e) => handleDetailChange('description', e.target.value)}
                className="input"
                rows={3}
                placeholder="Ex: Réunion pour discuter des projets en cours"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Ajout du rendu du QR code avec aperçu
  const renderQRCode = () => {
    const qrContent = activeTab === 'link' ? text : formatQRContent(activeTab, text, details);
    
    return (
      <div className="flex justify-center items-center mt-4">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <QRCodeSVG
            value={qrContent || ' '}
            size={200}
            level="H" // Niveau de correction d'erreur élevé pour permettre le logo
            fgColor={fgColor}
            bgColor={bgColor}
            imageSettings={logo ? {
              src: logo,
              height: 40,
              width: 40,
              excavate: true
            } : undefined}
          />
        </div>
      </div>
    );
  };

  const handleDownload = (format: 'png' | 'svg') => {
    try {
      // On utilise un ID unique pour cibler le bon SVG
      const svgId = 'generated-qr-code';
      const svgElement = document.getElementById(svgId)?.querySelector('svg');
      
      if (!svgElement) {
        console.error('SVG not found for ID:', svgId);
        toast.error('Impossible de trouver le QR code pour le téléchargement');
        return;
      }

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
        const img = new (window.Image as { new(): HTMLImageElement })();

        img.onload = () => {
          // Fond avec la couleur spécifiée
          ctx.fillStyle = bgColor;
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
      toast.success('QR code téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="card animate-fade-in">
      <div className="space-y-6">
        {/* Barre de navigation pour les types de QR codes */}
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
            Type de QR Code
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['link', 'visit', 'contact', 'event'] as QRCodeType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
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

        {/* Aperçu du QR code */}
        {/* {renderQRCode()} */}

        {/* Champs spécifiques au type de QR code */}
        {renderTypeSpecificFields()}

        {/* Champ principal (visible pour tous les types) */}
        {activeTab === 'link' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL du site web
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input"
              placeholder="Entrez une URL ici..."
            />
          </div>
        )}

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
            disabled={isGenerating || (activeTab === 'link' ? !text : false)}
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

        {/* Affichage du QR code généré */}
        {generatedQRCode && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">QR Code généré</h3>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg shadow">
                <div id="generated-qr-code">
                  <QRCodeSVG
                    value={generatedQRCode.text}
                    size={200}
                    level="H"
                    fgColor={generatedQRCode.fgColor}
                    bgColor={generatedQRCode.bgColor}
                    imageSettings={generatedQRCode.logo ? {
                      src: generatedQRCode.logo,
                      width: 40,
                      height: 40,
                      excavate: true,
                    } : undefined}
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDownload('png')}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Télécharger PNG
                </button>
                <button
                  onClick={() => handleDownload('svg')}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Télécharger SVG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 