import { useState, useEffect } from "react";
import { QrCode, Settings, BarChart3 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useIndexedDB } from "@/lib/indexeddb";
import QRPreview from "./QRPreview";
import QRHistory from "./QRHistory";
import Analytics from "./Analytics";
import { generateQRData } from "@/lib/qr-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type ContentType = 'text' | 'url' | 'vcard' | 'wifi' | 'phone' | 'email' | 'sms';

interface FormData {
  text?: string;
  url?: string;
  name?: string;
  phone?: string;
  email?: string;
  ssid?: string;
  password?: string;
  encryption?: string;
  phoneNumber?: string;
  emailAddress?: string;
  subject?: string;
  body?: string;
  smsNumber?: string;
  smsMessage?: string;
}

interface QRCustomization {
  size: number;
  fgColor: string;
  bgColor: string;
  overlayText: string;
  logoUrl?: string;
}

const CONTENT_TYPES = [
  { id: 'text' as ContentType, label: 'Text', icon: '📝' },
  { id: 'url' as ContentType, label: 'URL', icon: '🔗' },
  { id: 'vcard' as ContentType, label: 'Contact', icon: '👤' },
  { id: 'wifi' as ContentType, label: 'WiFi', icon: '📶' },
  { id: 'phone' as ContentType, label: 'Phone', icon: '📞' },
  { id: 'email' as ContentType, label: 'Email', icon: '✉️' },
  { id: 'sms' as ContentType, label: 'SMS', icon: '💬' }
];

const PRESET_LOGOS = [
  { id: 'star', icon: '⭐', label: 'Star' },
  { id: 'heart', icon: '❤️', label: 'Heart' },
  { id: 'building', icon: '🏢', label: 'Business' },
  { id: 'wifi', icon: '📶', label: 'WiFi' },
  { id: 'phone', icon: '📞', label: 'Phone' },
  { id: 'email', icon: '✉️', label: 'Email' },
];

export default function QRCodeStudio() {
  const { darkMode, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { saveQR, getHistory, trackEvent } = useIndexedDB();
  
  const [contentType, setContentType] = useState<ContentType>('text');
  const [formData, setFormData] = useState<FormData>({});
  const [customization, setCustomization] = useState<QRCustomization>({
    size: 256,
    fgColor: '#000000',
    bgColor: '#ffffff',
    overlayText: '',
  });
  
  const [qrData, setQrData] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Generate QR data when content changes
  useEffect(() => {
    const data = generateQRData(contentType, formData);
    setQrData(data);
  }, [contentType, formData]);

  const loadHistory = async () => {
    const historyData = await getHistory();
    setHistory(historyData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCustomization = (field: keyof QRCustomization, value: any) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveQR = async () => {
    if (!qrData) return;
    
    try {
      const qrRecord = {
        contentType,
        content: JSON.stringify(formData),
        qrData,
        customization,
        timestamp: Date.now(),
      };
      
      await saveQR(qrRecord);
      await trackEvent('create', contentType);
      await loadHistory();
      
      toast({
        title: "QR Code Saved",
        description: "Your QR code has been saved to history.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save QR code.",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateCustomization('logoUrl', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPresetLogo = (logoId: string) => {
    const logo = PRESET_LOGOS.find(l => l.id === logoId);
    if (logo) {
      updateCustomization('logoUrl', logo.icon);
    }
  };

  const renderContentForm = () => {
    switch (contentType) {
      case 'text':
        return (
          <div className="space-y-4">
            <label htmlFor="text" className="block text-sm font-medium text-gray-300 mb-2">Text Content</label>
            <textarea
              id="text"
              value={formData.text || ''}
              onChange={(e) => updateFormData('text', e.target.value)}
              placeholder="Enter your text here..."
              rows={4}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
            />
          </div>
        );
      
      case 'url':
        return (
          <div className="space-y-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">URL</label>
            <input
              id="url"
              type="url"
              value={formData.url || ''}
              onChange={(e) => updateFormData('url', e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
            <p className="text-xs text-gray-400">
              No need to include https:// - we'll add it automatically
            </p>
          </div>
        );
      
      case 'vcard':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                id="name"
                value={formData.name || ''}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="John Doe"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
              <input
                id="contact-phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                id="contact-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
          </div>
        );
      
      case 'wifi':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="ssid" className="block text-sm font-medium text-gray-300 mb-2">Network Name (SSID)</label>
              <input
                id="ssid"
                value={formData.ssid || ''}
                onChange={(e) => updateFormData('ssid', e.target.value)}
                placeholder="MyWiFiNetwork"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="wifi-password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                id="wifi-password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="encryption" className="block text-sm font-medium text-gray-300 mb-2">Encryption</label>
              <select
                value={formData.encryption || 'WPA'}
                onChange={(e) => updateFormData('encryption', e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
          </div>
        );
      
      case 'phone':
        return (
          <div className="space-y-4">
            <label htmlFor="phone-number" className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <input
              id="phone-number"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>
        );
      
      case 'email':
        return (
          <div className="space-y-4">
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              id="email-address"
              type="email"
              value={formData.email || ''}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>
        );
      
      case 'sms':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="sms-phone" className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <input
                id="sms-phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="sms-message" className="block text-sm font-medium text-gray-300 mb-2">Message (Optional)</label>
              <textarea
                id="sms-message"
                value={formData.message || ''}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="Pre-filled message text..."
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-texture">
      {/* Header */}
      <header className="glass-card-dark border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <QrCode className="w-10 h-10 text-blue-400 animate-pulse-glow" />
                <div className="absolute inset-0 w-10 h-10 bg-blue-400/20 rounded-lg blur-lg animate-glow"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                  QR Code Studio
                </h1>
                <span className="text-xs text-blue-300/80 font-medium tracking-wider">
                  Professional QR Generator
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                <span className="text-xs font-semibold text-blue-300">Enhanced</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="relative p-3 rounded-xl glass-card hover-lift group"
              >
                <BarChart3 className="w-5 h-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-xl glass-card hover-lift group"
              >
                <Settings className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              </button>
              
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl glass-card hover-lift"
              >
                <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="generator" className="space-y-8">
          <div className="flex justify-center">
            <div className="glass-card rounded-2xl p-2">
              <TabsList className="grid w-full grid-cols-2 bg-transparent border-0">
                <TabsTrigger 
                  value="generator" 
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200 data-[state=active]:shadow-lg text-gray-400 font-medium px-8 py-3 rounded-xl transition-all duration-300"
                >
                  QR Generator
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-200 data-[state=active]:shadow-lg text-gray-400 font-medium px-8 py-3 rounded-xl transition-all duration-300"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="generator" className="animate-fade-in">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column: Form Controls */}
              <div className="xl:col-span-2 space-y-6">
                {/* Content Type Selection */}
                <div className="glass-card rounded-2xl p-6 hover-lift">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-white">Content Type</h2>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    {CONTENT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setContentType(type.id)}
                        className={`
                          flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 group
                          ${contentType === type.id 
                            ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 border border-blue-400/50 text-blue-200 shadow-lg shadow-blue-500/20' 
                            : 'glass-card text-gray-300 hover:text-white hover:bg-white/10'
                          }
                        `}
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{type.icon}</span>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Input */}
                <div className="glass-card rounded-2xl p-6 hover-lift">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-white">Content</h2>
                  </div>
                  <div className="space-y-4">
                    {renderContentForm()}
                  </div>
                </div>

                {/* Customization */}
                <div className="glass-card rounded-2xl p-6 hover-lift">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-white">Customization</h2>
                  </div>
                  <div className="space-y-8">
                    {/* Size Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-4">QR Code Size</label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: 128, label: 'Small', icon: '📱' },
                          { value: 256, label: 'Medium', icon: '📟' },
                          { value: 384, label: 'Large', icon: '🖥️' }
                        ].map((size) => (
                          <button
                            key={size.value}
                            onClick={() => updateCustomization('size', size.value)}
                            className={`
                              flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 group
                              ${customization.size === size.value 
                                ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/20 border border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20' 
                                : 'glass-card text-gray-300 hover:text-white hover:bg-white/10'
                              }
                            `}
                          >
                            <span className="text-xl group-hover:scale-110 transition-transform duration-200">{size.icon}</span>
                            <span className="text-sm font-medium">{size.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">Foreground Color</label>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-xl border border-white/20 cursor-pointer hover:scale-105 transition-transform glass-card"
                            style={{ backgroundColor: customization.fgColor }}
                            onClick={() => document.getElementById('fg-color-input')?.click()}
                          />
                          <input
                            id="fg-color-input"
                            type="color"
                            value={customization.fgColor}
                            onChange={(e) => updateCustomization('fgColor', e.target.value)}
                            className="sr-only"
                          />
                          <input
                            value={customization.fgColor}
                            onChange={(e) => updateCustomization('fgColor', e.target.value)}
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">Background Color</label>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-xl border border-white/20 cursor-pointer hover:scale-105 transition-transform glass-card"
                            style={{ backgroundColor: customization.bgColor }}
                            onClick={() => document.getElementById('bg-color-input')?.click()}
                          />
                          <input
                            id="bg-color-input"
                            type="color"
                            value={customization.bgColor}
                            onChange={(e) => updateCustomization('bgColor', e.target.value)}
                            className="sr-only"
                          />
                          <input
                            value={customization.bgColor}
                            onChange={(e) => updateCustomization('bgColor', e.target.value)}
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Overlay */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-4">Logo Overlay (Optional)</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <label className="glass-card rounded-xl px-4 py-3 cursor-pointer hover-lift group">
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-300 group-hover:text-white">
                            <span className="text-lg">📤</span>
                            Upload Logo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="sr-only"
                          />
                        </label>
                        <span className="text-sm text-gray-400">or choose preset:</span>
                        <div className="flex gap-2">
                          {PRESET_LOGOS.slice(0, 3).map((logo) => (
                            <button
                              key={logo.id}
                              onClick={() => selectPresetLogo(logo.id)}
                              className="w-12 h-12 glass-card rounded-xl flex items-center justify-center hover-lift group"
                              title={logo.label}
                            >
                              <span className="text-lg group-hover:scale-110 transition-transform">{logo.icon}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Text Overlay */}
                    <div>
                      <label htmlFor="overlay-text" className="block text-sm font-medium text-gray-300 mb-3">Text Overlay (Optional)</label>
                      <input
                        id="overlay-text"
                        value={customization.overlayText}
                        onChange={(e) => updateCustomization('overlayText', e.target.value)}
                        placeholder="Add text below QR code"
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Preview */}
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 hover-lift sticky top-24">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-white">Live Preview</h2>
                    <div className="flex-1"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="neumorphic-inset rounded-2xl p-6">
                    <QRPreview
                      qrData={qrData}
                      size={customization.size}
                      fgColor={customization.fgColor}
                      bgColor={customization.bgColor}
                      overlayText={customization.overlayText}
                      logoUrl={customization.logoUrl}
                      onSave={handleSaveQR}
                      className="mx-auto animate-float"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* History Section */}
            <QRHistory history={history} onRefresh={loadHistory} />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
