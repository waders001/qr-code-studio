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
            <Label htmlFor="text">Text Content</Label>
            <Textarea
              id="text"
              value={formData.text || ''}
              onChange={(e) => updateFormData('text', e.target.value)}
              placeholder="Enter your text here..."
              rows={4}
            />
          </div>
        );
      
      case 'url':
        return (
          <div className="space-y-4">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url || ''}
              onChange={(e) => updateFormData('url', e.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-xs text-muted-foreground">
              No need to include https:// - we'll add it automatically
            </p>
          </div>
        );
      
      case 'vcard':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>
        );
      
      case 'wifi':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ssid">Network Name (SSID)</Label>
              <Input
                id="ssid"
                value={formData.ssid || ''}
                onChange={(e) => updateFormData('ssid', e.target.value)}
                placeholder="MyWiFiNetwork"
              />
            </div>
            <div>
              <Label htmlFor="wifi-password">Password</Label>
              <Input
                id="wifi-password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="encryption">Encryption</Label>
              <Select
                value={formData.encryption || 'WPA'}
                onValueChange={(value) => updateFormData('encryption', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">QR Code Studio</h1>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                Enhanced
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="relative"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {darkMode ? '☀️' : '🌙'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator">QR Generator</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-2 space-y-6">
                {/* Content Type Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {CONTENT_TYPES.map((type) => (
                        <Button
                          key={type.id}
                          variant={contentType === type.id ? "default" : "outline"}
                          className="flex flex-col items-center gap-2 p-4 h-auto"
                          onClick={() => setContentType(type.id)}
                        >
                          <span className="text-xl">{type.icon}</span>
                          <span className="text-xs">{type.label}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Input */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderContentForm()}
                  </CardContent>
                </Card>

                {/* Customization */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Size Selection */}
                    <div>
                      <Label>QR Code Size</Label>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {[
                          { value: 128, label: 'Small', icon: '📱' },
                          { value: 256, label: 'Medium', icon: '📟' },
                          { value: 384, label: 'Large', icon: '🖥️' }
                        ].map((size) => (
                          <Button
                            key={size.value}
                            variant={customization.size === size.value ? "default" : "outline"}
                            className="flex items-center gap-2"
                            onClick={() => updateCustomization('size', size.value)}
                          >
                            <span>{size.icon}</span>
                            <span>{size.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fg-color">Foreground Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div 
                            className="w-10 h-10 rounded border-2 border-border cursor-pointer"
                            style={{ backgroundColor: customization.fgColor }}
                            onClick={() => document.getElementById('fg-color-input')?.click()}
                          />
                          <Input
                            id="fg-color-input"
                            type="color"
                            value={customization.fgColor}
                            onChange={(e) => updateCustomization('fgColor', e.target.value)}
                            className="sr-only"
                          />
                          <Input
                            value={customization.fgColor}
                            onChange={(e) => updateCustomization('fgColor', e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="bg-color">Background Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div 
                            className="w-10 h-10 rounded border-2 border-border cursor-pointer"
                            style={{ backgroundColor: customization.bgColor }}
                            onClick={() => document.getElementById('bg-color-input')?.click()}
                          />
                          <Input
                            id="bg-color-input"
                            type="color"
                            value={customization.bgColor}
                            onChange={(e) => updateCustomization('bgColor', e.target.value)}
                            className="sr-only"
                          />
                          <Input
                            value={customization.bgColor}
                            onChange={(e) => updateCustomization('bgColor', e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Overlay */}
                    <div>
                      <Label>Logo Overlay (Optional)</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Button asChild variant="outline">
                          <label>
                            <span>📤 Upload Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="sr-only"
                            />
                          </label>
                        </Button>
                        <span className="text-sm text-muted-foreground">or choose preset:</span>
                        <div className="flex gap-2">
                          {PRESET_LOGOS.slice(0, 3).map((logo) => (
                            <Button
                              key={logo.id}
                              variant="outline"
                              size="icon"
                              onClick={() => selectPresetLogo(logo.id)}
                              title={logo.label}
                            >
                              {logo.icon}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Text Overlay */}
                    <div>
                      <Label htmlFor="overlay-text">Text Overlay (Optional)</Label>
                      <Input
                        id="overlay-text"
                        value={customization.overlayText}
                        onChange={(e) => updateCustomization('overlayText', e.target.value)}
                        placeholder="Add text below QR code"
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QRPreview
                      qrData={qrData}
                      size={customization.size}
                      fgColor={customization.fgColor}
                      bgColor={customization.bgColor}
                      overlayText={customization.overlayText}
                      logoUrl={customization.logoUrl}
                      onSave={handleSaveQR}
                      className="mx-auto"
                    />
                  </CardContent>
                </Card>
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
