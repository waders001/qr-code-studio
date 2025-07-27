import { useRef, useEffect, useState } from "react";
import { Download, Copy, Share2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QRCodeGenerator } from "@/lib/qr-generator";
import { generateSVG } from "@/lib/svg-export";
import { useIndexedDB } from "@/lib/indexeddb";
import { cn } from "@/lib/utils";

interface QRPreviewProps {
  qrData: string;
  size: number;
  fgColor: string;
  bgColor: string;
  overlayText?: string;
  logoUrl?: string;
  onSave?: () => void;
  showActions?: boolean;
  className?: string;
}

export default function QRPreview({
  qrData,
  size,
  fgColor,
  bgColor,
  overlayText,
  logoUrl,
  onSave,
  showActions = true,
  className
}: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isValid, setIsValid] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const { trackEvent } = useIndexedDB();

  useEffect(() => {
    if (!canvasRef.current || !qrData) {
      setIsValid(false);
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const qr = new QRCodeGenerator();
      qr.makeCode(qrData);

      const moduleCount = qr.getModuleCount();
      const cellSize = Math.floor(size / moduleCount);
      const margin = Math.floor((size - cellSize * moduleCount) / 2);

      canvas.width = size;
      canvas.height = overlayText ? size + 40 : size;

      // Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // QR modules
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

      // Logo overlay
      if (logoUrl) {
        const logoSize = Math.floor(size * 0.15);
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // White background circle for logo
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, logoSize / 2 + 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw logo
        if (logoUrl.length === 2) {
          // Emoji
          ctx.font = `${logoSize}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(logoUrl, size / 2, size / 2);
        } else if (logoUrl.startsWith('data:')) {
          // Uploaded image
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
          };
          img.src = logoUrl;
        }
      }

      // Text overlay
      if (overlayText) {
        ctx.fillStyle = fgColor;
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(overlayText, canvas.width / 2, size + 20);
      }

      setIsValid(true);
    } catch (error) {
      console.error('QR generation error:', error);
      setIsValid(false);
    }

    return () => clearTimeout(timer);
  }, [qrData, size, fgColor, bgColor, overlayText, logoUrl]);

  const downloadPNG = async () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    
    await trackEvent('download', 'png');
    toast({
      title: "Download Complete",
      description: "QR code downloaded as PNG",
    });
  };

  const downloadSVG = async () => {
    if (!qrData) return;
    
    const svg = generateSVG(qrData, {
      size,
      fgColor,
      bgColor,
      overlayText,
      logoUrl
    });
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    
    await trackEvent('download', 'svg');
    toast({
      title: "Download Complete",
      description: "QR code downloaded as SVG",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      await trackEvent('copy');
      toast({
        title: "Copied",
        description: "QR content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QR Code',
          text: qrData,
        });
        await trackEvent('share');
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      toast({
        title: "Share Not Supported",
        description: "Sharing is not supported on this device",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={cn(
            "border-2 border-border rounded-lg transition-all duration-300",
            isAnimating && "animate-pulse"
          )}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {isAnimating && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-lg pointer-events-none" />
        )}
        
        {!qrData && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground text-sm">Enter content to generate QR code</p>
          </div>
        )}
      </div>

      {showActions && isValid && qrData && (
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={downloadPNG} variant="default" size="sm">
            <Download className="w-4 h-4 mr-2" />
            PNG
          </Button>
          
          <Button onClick={downloadSVG} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            SVG
          </Button>
          
          <Button onClick={copyToClipboard} variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          
          {navigator.share && (
            <Button onClick={shareQR} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
          
          {onSave && (
            <Button onClick={onSave} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      )}

      {isValid && qrData && (
        <div className="w-full p-3 bg-muted rounded-lg mt-4 max-w-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">QR Content:</p>
          <p className="text-xs text-foreground break-all">
            {qrData.length > 100 ? qrData.substring(0, 100) + '...' : qrData}
          </p>
        </div>
      )}
    </div>
  );
}
