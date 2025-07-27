import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Settings, Sun, Moon, Globe, Wifi, Phone, Mail, MessageSquare, User, Link, Download, Copy, Share2, CheckCircle, AlertCircle, Palette, Type, Smartphone, Tablet, Monitor, Trash2, History, X } from 'lucide-react';

// QR Code Generator Class
class QRCodeGenerator {
  constructor() {
    this.typeNumber = 4;
    this.errorCorrectionLevel = 'M';
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }

  makeCode(text) {
    this.dataList = [text];
    this.dataCache = null;
    this.makeImpl(false, this.getBestMaskPattern());
  }

  makeImpl(test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);

    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount);
      for (let col = 0; col < this.moduleCount; col++) {
        this.modules[row][col] = null;
      }
    }

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);

    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }

    if (this.dataCache == null) {
      this.dataCache = this.createData(this.typeNumber, this.errorCorrectionLevel, this.dataList);
    }

    this.mapData(this.dataCache, maskPattern);
  }

  setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;

      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;

        if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
            (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  setupPositionAdjustPattern() {
    const pos = [6, 18, 30, 42, 54, 66, 78, 90, 102, 114, 126, 138, 150, 162, 174];

    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];

        if (this.modules[row][col] != null) {
          continue;
        }

        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] != null) {
        continue;
      }
      this.modules[r][6] = (r % 2 == 0);
    }

    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] != null) {
        continue;
      }
      this.modules[6][c] = (c % 2 == 0);
    }
  }

  setupTypeInfo(test, maskPattern) {
    const bits = (1 << 3) | maskPattern;
    const data = bits << 10;

    for (let i = 0; i < 15; i++) {
      const mod = (!test && ((data >> i) & 1) == 1);

      if (i < 6) {
        this.modules[i][8] = mod;
      } else if (i < 8) {
        this.modules[i + 1][8] = mod;
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod;
      }
    }

    for (let i = 0; i < 15; i++) {
      const mod = (!test && ((data >> i) & 1) == 1);

      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1] = mod;
      } else {
        this.modules[8][15 - i - 1] = mod;
      }
    }

    this.modules[this.moduleCount - 8][8] = (!test);
  }

  setupTypeNumber(test) {
    const bits = this.typeNumber << 12;

    for (let i = 0; i < 18; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
    }

    for (let i = 0; i < 18; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  mapData(data, maskPattern) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col--;

      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] == null) {
            let dark = false;

            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
            }

            const mask = this.getMask(maskPattern, row, col - c);

            if (mask) {
              dark = !dark;
            }

            this.modules[row][col - c] = dark;
            bitIndex--;

            if (bitIndex == -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }

        row += inc;

        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  getMask(maskPattern, i, j) {
    switch (maskPattern) {
      case 0: return (i + j) % 2 == 0;
      case 1: return i % 2 == 0;
      case 2: return j % 3 == 0;
      case 3: return (i + j) % 3 == 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
      case 5: return (i * j) % 2 + (i * j) % 3 == 0;
      case 6: return ((i * j) % 2 + (i * j) % 3) % 2 == 0;
      case 7: return ((i * j) % 3 + (i + j) % 2) % 2 == 0;
      default: throw new Error("bad maskPattern:" + maskPattern);
    }
  }

  getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;

    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = this.getLostPoint();

      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }

    return pattern;
  }

  getLostPoint() {
    const moduleCount = this.moduleCount;
    let lostPoint = 0;

    // LEVEL1
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        const sameCount = 0;
        const dark = this.modules[row][col];

        for (let r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) {
            continue;
          }

          for (let c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c) {
              continue;
            }

            if (r == 0 && c == 0) {
              continue;
            }

            if (dark == this.modules[row + r][col + c]) {
              sameCount++;
            }
          }
        }

        if (sameCount > 5) {
          lostPoint += (3 + sameCount - 5);
        }
      }
    }

    return lostPoint;
  }

  createData(typeNumber, errorCorrectionLevel, dataList) {
    const buffer = [];

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      for (let j = 0; j < data.length; j++) {
        buffer.push(data.charCodeAt(j));
      }
    }

    return buffer;
  }

  getModuleCount() {
    return this.moduleCount;
  }

  isDark(row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(row + "," + col);
    }
    return this.modules[row][col];
  }
}

// Toast Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in`}>
      <Icon className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
};

// Storage utilities
const storage = {
  save: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  },
  load: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove from localStorage:', e);
    }
  }
};

// QR Data generation helpers
const generateQRData = (type, formData) => {
  switch (type) {
    case 'text':
      return formData.text || '';
    
    case 'url':
      if (!formData.url) return '';
      return formData.url.startsWith('http://') || formData.url.startsWith('https://')
        ? formData.url
        : `https://${formData.url}`;
    
    case 'vcard':
      if (!formData.name && !formData.phone && !formData.email) return '';
      return `BEGIN:VCARD
VERSION:3.0
FN:${formData.name || ''}
TEL:${formData.phone || ''}
EMAIL:${formData.email || ''}
END:VCARD`;
    
    case 'wifi':
      if (!formData.ssid) return '';
      return `WIFI:T:${formData.encryption || 'WPA'};S:${formData.ssid};P:${formData.password || ''};;`;
    
    case 'phone':
      return formData.phoneNumber ? `tel:${formData.phoneNumber}` : '';
    
    case 'email':
      if (!formData.emailAddress) return '';
      let mailto = `mailto:${formData.emailAddress}`;
      const params = [];
      if (formData.subject) params.push(`subject=${encodeURIComponent(formData.subject)}`);
      if (formData.body) params.push(`body=${encodeURIComponent(formData.body)}`);
      if (params.length > 0) mailto += `?${params.join('&')}`;
      return mailto;
    
    case 'sms':
      if (!formData.smsNumber) return '';
      return `sms:${formData.smsNumber}${formData.smsMessage ? `?body=${encodeURIComponent(formData.smsMessage)}` : ''}`;
    
    default:
      return '';
  }
};

// Export helpers
const downloadCanvasAsPNG = (canvas, filename = 'qr-code.png') => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL();
  link.click();
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

const shareContent = async (title, text) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (err) {
      console.error('Share failed:', err);
      return false;
    }
  }
  return false;
};

// Header Component
const Header = ({ darkMode, toggleTheme, showSettings, setShowSettings }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              QR Code Studio
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// QR Form Component
const QRForm = ({ contentType, setContentType, formData, setFormData, language }) => {
  const contentTypes = [
    { id: 'text', label: 'Text', icon: Globe },
    { id: 'url', label: 'URL', icon: Link },
    { id: 'vcard', label: 'Contact', icon: User },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare }
  ];
  
  useEffect(() => {
    const firstInput = document.querySelector('input[type="text"], input[type="url"], textarea');
    if (firstInput) {
      firstInput.focus();
    }
  }, [contentType]);
  
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        {language === 'es' ? 'Tipo de Contenido' : 'Content Type'}
      </h2>
      
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
        {contentTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setContentType(id)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
              contentType === id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
      
      <div className="space-y-4">
        {contentType === 'text' && (
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              {language === 'es' ? 'Texto' : 'Text Content'}
            </label>
            <textarea
              value={formData.text || ''}
              onChange={(e) => updateField('text', e.target.value)}
              placeholder={language === 'es' ? 'Ingrese su texto aquí...' : 'Enter your text here...'}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="4"
            />
          </div>
        )}
        
        {contentType === 'url' && (
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">URL</label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="example.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              No need to include https:// - we'll add it automatically
            </p>
          </div>
        )}
        
        {contentType === 'vcard' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Nombre' : 'Full Name'}
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Teléfono' : 'Phone'}
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </>
        )}
        
        {contentType === 'wifi' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Nombre de Red (SSID)' : 'Network Name (SSID)'}
              </label>
              <input
                type="text"
                value={formData.ssid || ''}
                onChange={(e) => updateField('ssid', e.target.value)}
                placeholder="MyWiFiNetwork"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Contraseña' : 'Password'}
              </label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Encriptación' : 'Encryption'}
              </label>
              <select
                value={formData.encryption || 'WPA'}
                onChange={(e) => updateField('encryption', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
          </>
        )}
        
        {contentType === 'phone' && (
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              {language === 'es' ? 'Número de Teléfono' : 'Phone Number'}
            </label>
            <input
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={(e) => updateField('phoneNumber', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}
        
        {contentType === 'email' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Dirección de Email' : 'Email Address'}
              </label>
              <input
                type="email"
                value={formData.emailAddress || ''}
                onChange={(e) => updateField('emailAddress', e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Asunto' : 'Subject'}
              </label>
              <input
                type="text"
                value={formData.subject || ''}
                onChange={(e) => updateField('subject', e.target.value)}
                placeholder={language === 'es' ? 'Asunto del email' : 'Email subject'}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Mensaje' : 'Message'}
              </label>
              <textarea
                value={formData.body || ''}
                onChange={(e) => updateField('body', e.target.value)}
                placeholder={language === 'es' ? 'Mensaje del email' : 'Email message'}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
            </div>
          </>
        )}
        
        {contentType === 'sms' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Número de Teléfono' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={formData.smsNumber || ''}
                onChange={(e) => updateField('smsNumber', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {language === 'es' ? 'Mensaje' : 'Message'}
              </label>
              <textarea
                value={formData.smsMessage || ''}
                onChange={(e) => updateField('smsMessage', e.target.value)}
                placeholder={language === 'es' ? 'Mensaje SMS' : 'SMS message'}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// QR Controls Component
const QRControls = ({ qrSize, setQrSize, fgColor, setFgColor, bgColor, setBgColor, overlayText, setOverlayText }) => {
  const sizes = [
    { value: 128, label: 'Small', icon: Smartphone },
    { value: 256, label: 'Medium', icon: Tablet },
    { value: 384, label: 'Large', icon: Monitor }
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Customization</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 dark:text-gray-300">QR Code Size</label>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setQrSize(value)}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-all ${
                qrSize === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">
            <Palette className="inline w-4 h-4 mr-1" />
            Foreground Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="h-10 w-full rounded cursor-pointer"
            />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{fgColor}</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">
            <Palette className="inline w-4 h-4 mr-1" />
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-10 w-full rounded cursor-pointer"
            />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{bgColor}</span>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 dark:text-gray-300">
          <Type className="inline w-4 h-4 mr-1" />
          Text Overlay (Optional)
        </label>
        <input
          type="text"
          value={overlayText}
          onChange={(e) => setOverlayText(e.target.value)}
          placeholder="Add text below QR code"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
    </div>
  );
};

// QR Preview Component
const QRPreview = ({ qrData, size, fgColor, bgColor, overlayText, onSave, showToast }) => {
  const canvasRef = useRef(null);
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    if (!canvasRef.current || !qrData) {
      setIsValid(false);
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    try {
      const qr = new QRCodeGenerator();
      qr.makeCode(qrData);
      
      const moduleCount = qr.getModuleCount();
      const cellSize = Math.floor(size / moduleCount);
      const margin = Math.floor((size - cellSize * moduleCount) / 2);
      
      canvas.width = size;
      canvas.height = overlayText ? size + 40 : size;
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = fgColor;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(
              margin + col * cellSize,
              margin + row * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
      
      if (overlayText) {
        ctx.fillStyle = fgColor;
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(overlayText, canvas.width / 2, size + 20);
      }
      
      setIsValid(true);
    } catch (error) {
      console.error('QR generation error:', error);
      setIsValid(false);
    }
  }, [qrData, size, fgColor, bgColor, overlayText]);
  
  const handleDownload = () => {
    if (canvasRef.current) {
      downloadCanvasAsPNG(canvasRef.current, `qr-code-${Date.now()}.png`);
      showToast('QR code downloaded!', 'success');
    }
  };
  
  const handleCopy = async () => {
    const success = await copyToClipboard(qrData);
    showToast(success ? 'Content copied to clipboard!' : 'Failed to copy', success ? 'success' : 'error');
  };
  
  const handleShare = async () => {
    const success = await shareContent('QR Code', qrData);
    if (!success) {
      showToast('Sharing not supported on this device', 'error');
    }
  };
  
  const handleSave = () => {
    onSave();
    showToast('QR code saved to history!', 'success');
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Preview</h2>
      
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <canvas
            ref={canvasRef}
            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          {!qrData && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-500">Enter content to generate QR code</p>
            </div>
          )}
        </div>
        
        {isValid && qrData && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              
              {navigator.share && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
              
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <History className="w-4 h-4" />
                Save
              </button>
            </div>
            
            <div className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">QR Content:</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                {qrData.length > 150 ? qrData.substring(0, 150) + '...' : qrData}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// QR History Component
const QRHistory = ({ history, onLoad, onClear }) => {
  if (history.length === 0) return null;
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold dark:text-white">Recent QR Codes</h2>
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onLoad(entry)}
          >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {entry.contentType.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(entry.timestamp).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="mt-12 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      <p>QR Code Studio - Generate QR codes for any content</p>
      <p className="mt-1">Built with React • No external QR libraries</p>
    </footer>
  );
};

// Settings Modal Component
const SettingsModal = ({ settings, onUpdate, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  
  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold dark:text-white">Settings</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Default Content Type
            </label>
            <select
              value={localSettings.defaultContentType}
              onChange={(e) => setLocalSettings({...localSettings, defaultContentType: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="text">Plain Text</option>
              <option value="url">URL</option>
              <option value="vcard">Contact</option>
              <option value="wifi">WiFi</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Default QR Size
            </label>
            <select
              value={localSettings.defaultSize}
              onChange={(e) => setLocalSettings({...localSettings, defaultSize: Number(e.target.value)})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value={128}>Small (128px)</option>
              <option value={256}>Medium (256px)</option>
              <option value={384}>Large (384px)</option>
            </select>
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localSettings.rememberLastForm}
                onChange={(e) => setLocalSettings({...localSettings, rememberLastForm: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm dark:text-gray-300">Remember last form data</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Language
            </label>
            <select
              value={localSettings.language}
              onChange={(e) => setLocalSettings({...localSettings, language: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [contentType, setContentType] = useState('text');
  const [formData, setFormData] = useState({});
  const [qrData, setQrData] = useState('');
  
  const [qrSize, setQrSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [overlayText, setOverlayText] = useState('');
  
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [settings, setSettings] = useState({
    defaultContentType: 'text',
    defaultSize: 256,
    rememberLastForm: true,
    language: 'en'
  });

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load saved data on mount
  useEffect(() => {
    const savedTheme = storage.load('theme');
    const savedHistory = storage.load('qrHistory') || [];
    const savedSettings = storage.load('settings') || settings;
    
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    setHistory(savedHistory);
    setSettings(savedSettings);
    setContentType(savedSettings.defaultContentType);
    setQrSize(savedSettings.defaultSize);
    
    if (savedSettings.rememberLastForm) {
      const lastFormData = storage.load('lastFormData');
      if (lastFormData) {
        setFormData(lastFormData);
      }
    }
  }, []);

  // Update QR data when form changes
  useEffect(() => {
    const data = generateQRData(contentType, formData);
    setQrData(data);
    
    if (settings.rememberLastForm && Object.keys(formData).length > 0) {
      storage.save('lastFormData', formData);
    }
  }, [contentType, formData, settings.rememberLastForm]);

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      storage.save('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      storage.save('theme', 'light');
    }
  };

  // Save to history
  const saveToHistory = () => {
    if (!qrData) return;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      contentType,
      formData,
      qrData,
      fgColor,
      bgColor,
      size: qrSize,
      overlayText
    };
    
    const updatedHistory = [newEntry, ...history.slice(0, 9)];
    setHistory(updatedHistory);
    storage.save('qrHistory', updatedHistory);
  };

  // Load from history
  const loadFromHistory = (entry) => {
    setContentType(entry.contentType);
    setFormData(entry.formData);
    setFgColor(entry.fgColor);
    setBgColor(entry.bgColor);
    setQrSize(entry.size);
    setOverlayText(entry.overlayText || '');
  };

  // Update settings
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    storage.save('settings', newSettings);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <Header 
        darkMode={darkMode} 
        toggleTheme={toggleTheme}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <QRForm
              contentType={contentType}
              setContentType={setContentType}
              formData={formData}
              setFormData={setFormData}
              language={settings.language}
            />
            
            <QRControls
              qrSize={qrSize}
              setQrSize={setQrSize}
              fgColor={fgColor}
              setFgColor={setFgColor}
              bgColor={bgColor}
              setBgColor={setBgColor}
              overlayText={overlayText}
              setOverlayText={setOverlayText}
            />
          </div>
          
          <div>
            <QRPreview
              qrData={qrData}
              size={qrSize}
              fgColor={fgColor}
              bgColor={bgColor}
              overlayText={overlayText}
              onSave={saveToHistory}
              showToast={showToast}
            />
          </div>
        </div>
        
        <QRHistory
          history={history}
          onLoad={loadFromHistory}
          onClear={() => {
            setHistory([]);
            storage.save('qrHistory', []);
            showToast('History cleared!', 'success');
          }}
        />
      </main>
      
      <Footer />
      
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default App;