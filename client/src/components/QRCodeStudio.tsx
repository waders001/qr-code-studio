import { useState, useEffect } from "react";
import { QrCode, Settings, BarChart3, Share2 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useIndexedDB } from "@/lib/indexeddb";
import QRPreview from "./QRPreview";
import QRHistory from "./QRHistory";
import Analytics from "./Analytics";
import Tutorial from "./Tutorial";
import { WelcomeModal, useWelcomeModal } from "./WelcomeModal";
import { InstallButton } from "./InstallButton";
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
import { motion } from "framer-motion";

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
  const { isOpen: welcomeModalOpen, close: closeWelcomeModal } = useWelcomeModal();
  
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
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    return localStorage.getItem('hasSeenTutorial') === 'true';
  });
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Generate QR data when content changes
  useEffect(() => {
    const errors = validateInput(contentType, formData);
    setInputErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      const data = generateQRData(contentType, formData);
      setQrData(data);
    } else {
      setQrData('');
    }
  }, [contentType, formData]);

  const loadHistory = async () => {
    const historyData = await getHistory();
    setHistory(historyData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (inputErrors[field]) {
      setInputErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateCustomization = (field: keyof QRCustomization, value: any) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  // Input validation function
  const validateInput = (type: ContentType, data: FormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    const maxBytes = 2953;

    switch (type) {
      case 'text':
        if (!data.text || data.text.trim() === '') {
          errors.text = 'Text content is required';
        } else if (new TextEncoder().encode(data.text).length > maxBytes) {
          errors.text = `Text too long (max ${maxBytes} bytes)`;
        }
        break;
      
      case 'url':
        if (!data.url || data.url.trim() === '') {
          errors.url = 'URL is required';
        } else if (!/^https?:\/\/.+/.test(data.url)) {
          errors.url = 'URL must start with http:// or https://';
        }
        break;
      
      case 'vcard':
        if (!data.name || data.name.trim() === '') {
          errors.name = 'Name is required for vCard';
        }
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          errors.email = 'Invalid email format';
        }
        break;
      
      case 'wifi':
        if (!data.ssid || data.ssid.trim() === '') {
          errors.ssid = 'WiFi network name (SSID) is required';
        }
        break;
      
      case 'phone':
        if (!data.phoneNumber || data.phoneNumber.trim() === '') {
          errors.phoneNumber = 'Phone number is required';
        }
        break;
      
      case 'email':
        if (!data.emailAddress || data.emailAddress.trim() === '') {
          errors.emailAddress = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailAddress)) {
          errors.emailAddress = 'Invalid email format';
        }
        break;
      
      case 'sms':
        if (!data.smsNumber || data.smsNumber.trim() === '') {
          errors.smsNumber = 'Phone number is required';
        }
        if (!data.smsMessage || data.smsMessage.trim() === '') {
          errors.smsMessage = 'Message is required';
        }
        break;
    }

    return errors;
  };

  // Tutorial functions
  const completeTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const nextTutorialStep = () => {
    if (tutorialStep < 2) {
      setTutorialStep(tutorialStep + 1);
    } else {
      completeTutorial();
    }
  };

  const tutorialSteps = [
    {
      title: "Choose Content Type",
      description: "Select what type of information you want to encode in your QR code",
      target: "content-types"
    },
    {
      title: "Customize Your QR",
      description: "Adjust colors, size, and add logos or text overlays",
      target: "customization"
    },
    {
      title: "Preview & Share",
      description: "See your QR code live and download or create shareable links",
      target: "preview"
    }
  ];

  const handleSaveQR = async () => {
    if (!qrData) {
      toast({
        title: "No QR Code",
        description: "Please generate a QR code first.",
        variant: "destructive",
      });
      return;
    }
    
    if (isSaving) return; // Prevent double-clicks
    setIsSaving(true);
    
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
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleShareQR = async () => {
    if (!qrData) {
      toast({
        title: "No QR Code",
        description: "Please generate a QR code first.",
        variant: "destructive",
      });
      return;
    }
    
    if (isSharing) return; // Prevent double-clicks
    setIsSharing(true);
    
    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          content: JSON.stringify(formData),
          qrData,
          customization,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const { shareUrl } = await response.json();
      const fullUrl = `${window.location.origin}${shareUrl}`;
      
      // Try clipboard copy with fallback
      try {
        await navigator.clipboard.writeText(fullUrl);
      } catch (clipError) {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      await trackEvent('share', contentType);
      
      toast({
        title: "Share Link Created!",
        description: "Link copied to clipboard - share it with anyone!",
      });
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share Failed",
        description: "Unable to create shareable link. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updateCustomization('logoUrl', result);
        toast({
          title: "Logo Uploaded",
          description: "Your logo has been added to the QR code",
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Upload Failed",
        description: "Failed to read the image file",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const selectPresetLogo = (logoId: string) => {
    const logo = PRESET_LOGOS.find(l => l.id === logoId);
    if (logo) {
      updateCustomization('logoUrl', logo.icon);
      toast({
        title: "Logo Selected",
        description: `${logo.label} logo added to your QR code`,
      });
    }
  };

  const handleReset = () => {
    setFormData({});
    setQrData('');
    setInputErrors({});
    setCustomization({
      size: 256,
      fgColor: '#000000',
      bgColor: '#ffffff',
      overlayText: '',
      logoUrl: undefined
    });
    
    // Reset file input if present
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    toast({
      title: "Reset Complete",
      description: "All fields and settings have been cleared.",
    });
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <span className="text-white font-bold text-lg font-mono">QR</span>
                </div>
                <div className="absolute inset-0 w-12 h-12 bg-indigo-400/20 rounded-xl blur-lg animate-glow"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent tracking-tight">
                  QR Genius
                </h1>
                <span className="text-xs text-indigo-300/80 font-medium tracking-wider">
                  Professional QR Generator
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30">
                <span className="text-xs font-semibold text-indigo-300">Pro</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <InstallButton />
              </div>
              
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="relative p-3 rounded-xl glass-card hover-lift group"
                title="View Analytics"
              >
                <BarChart3 className="w-5 h-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-xl glass-card hover-lift group"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              </button>
              
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl glass-card hover-lift"
                title="Toggle Theme"
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {PRESET_LOGOS.map((logo) => (
                          <button
                            key={logo.id}
                            onClick={() => selectPresetLogo(logo.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all group ${
                              customization.logoUrl === logo.icon 
                                ? 'bg-gradient-to-br from-orange-500/30 to-orange-600/20 border border-orange-400/50 text-orange-200 shadow-lg shadow-orange-500/20' 
                                : 'glass-card text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                            title={logo.label}
                          >
                            <span className="text-xl group-hover:scale-110 transition-transform">{logo.icon}</span>
                            <span className="text-xs font-medium">{logo.label}</span>
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          placeholder="Or enter custom emoji/text"
                          value={customization.logoUrl?.startsWith('data:') ? '' : customization.logoUrl || ''}
                          onChange={(e) => updateCustomization('logoUrl', e.target.value)}
                          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                        />
                        <label className="glass-card rounded-xl px-4 py-2 cursor-pointer hover-lift group">
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-300 group-hover:text-white">
                            <span className="text-lg">📤</span>
                            Upload
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="sr-only"
                          />
                        </label>
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
                    
                    {/* QR Data Info and Share Button */}
                    {qrData && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 space-y-4"
                      >
                        {/* Capacity Display */}
                        <div className="glass-card rounded-xl p-4 border border-green-400/20 bg-green-500/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-green-300">Ready to Scan</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {qrData.length} / 2953 chars
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (qrData.length / 2953) * 100)}%` }}
                            />
                          </div>
                          {qrData.length > 2000 && (
                            <p className="text-xs text-yellow-400 mt-2">
                              ⚠️ Large QR codes may be harder to scan
                            </p>
                          )}
                        </div>

                        {/* Share Button */}
                        <div className="flex justify-center">
                          <motion.button
                            onClick={handleShareQR}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                          >
                            <Share2 className="w-4 h-4" />
                            Create Share Link
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
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

      {/* Welcome Modal */}
      <WelcomeModal isOpen={welcomeModalOpen} onClose={closeWelcomeModal} />

      {/* Footer */}
      <footer className="glass-card-dark border-t border-white/10 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm font-mono">QR</span>
              </div>
              <div className="text-sm text-gray-400">
                <span className="font-semibold text-white">QR Genius</span> - Professional QR Generator
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>Made with ❤️ for professionals</span>
              <a 
                href="https://github.com/qr-genius/qr-generator" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
