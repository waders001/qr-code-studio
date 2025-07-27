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
    // Validation checks
    if (!canvasRef.current) {
      console.warn('Canvas ref not available');
      setIsValid(false);
      return;
    }

    if (!qrData || typeof qrData !== 'string' || qrData.trim() === '') {
      setIsValid(false);
      return;
    }

    // Check QR data size (max ~2953 bytes for QR codes)
    const maxBytes = 2953;
    const dataBytes = new TextEncoder().encode(qrData).length;
    if (dataBytes > maxBytes) {
      console.error(`QR data too large: ${dataBytes} bytes (max: ${maxBytes})`);
      toast({
        title: "QR Code Too Large",
        description: `Content is ${dataBytes} bytes. Maximum is ${maxBytes} bytes.`,
        variant: "destructive",
      });
      setIsValid(false);
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas 2D context');
      toast({
        title: "Canvas Error",
        description: "Unable to initialize canvas for QR rendering.",
        variant: "destructive",
      });
      setIsValid(false);
      return () => clearTimeout(timer);
    }

    try {
      console.log('Starting QR generation:', { 
        qrData: qrData.substring(0, 50) + (qrData.length > 50 ? '...' : ''), 
        qrDataLength: qrData.length,
        size,
        fgColor,
        bgColor 
      });
      
      const qr = new QRCodeGenerator();
      
      // Enhanced error handling for makeCode
      try {
        qr.makeCode(qrData);
        console.log('QR makeCode successful');
      } catch (qrError) {
        console.error('QR makeCode failed:', qrError);
        toast({
          title: "QR Generation Failed",
          description: "Unable to encode the provided data into a QR code.",
          variant: "destructive",
        });
        throw new Error(`QR generation failed: ${qrError instanceof Error ? qrError.message : 'Unknown error'}`);
      }

      const moduleCount = qr.getModuleCount();
      console.log('QR module count:', moduleCount);
      
      if (!moduleCount || moduleCount <= 0) {
        console.error('Invalid module count:', moduleCount);
        toast({
          title: "QR Matrix Error",
          description: "Generated QR code has invalid dimensions.",
          variant: "destructive",
        });
        throw new Error('Invalid QR module count');
      }

      const cellSize = Math.floor(size / moduleCount);
      const margin = Math.floor((size - cellSize * moduleCount) / 2);

      // Validate canvas dimensions
      if (size <= 0 || !isFinite(size)) {
        throw new Error('Invalid canvas size');
      }

      canvas.width = size;
      canvas.height = overlayText ? size + 40 : size;

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = bgColor || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // QR modules with comprehensive error handling
      ctx.fillStyle = fgColor || '#000000';
      console.log('Drawing QR modules:', { moduleCount, cellSize, margin });
      
      let drawErrors = 0;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          try {
            if (qr.isDark(row, col)) {
              const x = margin + col * cellSize;
              const y = margin + row * cellSize;
              
              // Bounds checking before drawing
              if (x >= 0 && y >= 0 && x + cellSize <= size && y + cellSize <= size) {
                ctx.fillRect(x, y, cellSize, cellSize);
              }
            }
          } catch (moduleError) {
            drawErrors++;
            if (drawErrors <= 5) { // Limit error logging
              console.warn(`Error accessing module [${row}][${col}]:`, moduleError);
            }
          }
        }
      }
      
      if (drawErrors > 0) {
        console.warn(`Total drawing errors: ${drawErrors}`);
      }

      // Logo overlay
      if (logoUrl) {
        try {
          const logoSize = Math.floor(size * 0.15);
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;

          // White background circle for logo
          ctx.fillStyle = bgColor || '#ffffff';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, logoSize / 2 + 4, 0, Math.PI * 2);
          ctx.fill();

          // Draw logo
          if (logoUrl.length === 2) {
            // Emoji
            ctx.font = `${logoSize}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = fgColor || '#000000';
            ctx.fillText(logoUrl, size / 2, size / 2);
          } else if (logoUrl.startsWith('data:')) {
            // Uploaded image
            const img = new Image();
            img.onload = () => {
              try {
                ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
              } catch (imgError) {
                console.warn('Error drawing logo image:', imgError);
              }
            };
            img.onerror = () => {
              console.warn('Failed to load logo image');
            };
            img.src = logoUrl;
          }
        } catch (logoError) {
          console.warn('Error rendering logo overlay:', logoError);
        }
      }

      // Text overlay
      if (overlayText && overlayText.trim()) {
        try {
          ctx.fillStyle = fgColor || '#000000';
          ctx.font = 'bold 16px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(overlayText.trim(), canvas.width / 2, size + 20);
        } catch (textError) {
          console.warn('Error rendering text overlay:', textError);
        }
      }

      setIsValid(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      
      console.error('QR generation error:', {
        message: errorMessage,
        stack: errorStack,
        qrData: qrData.substring(0, 100) + (qrData.length > 100 ? '...' : ''),
        size,
        fgColor,
        bgColor
      });
      
      toast({
        title: "QR Generation Failed",
        description: `Unable to render QR Code: ${errorMessage}. Please check input or try a different type.`,
        variant: "destructive",
      });
      
      setIsValid(false);
    }

    return () => clearTimeout(timer);
  }, [qrData, size, fgColor, bgColor, overlayText, logoUrl]);

  const downloadPNG = async () => {
    if (!canvasRef.current || !isValid) {
      toast({
        title: "Download Failed",
        description: "No valid QR code to download",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      await trackEvent('download', 'png');
      toast({
        title: "PNG Downloaded",
        description: "High-quality QR code saved successfully",
      });
    } catch (error) {
      console.error('PNG download failed:', error);
      toast({
        title: "Download Failed",
        description: "Unable to generate PNG file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadSVG = async () => {
    if (!qrData || !isValid) {
      toast({
        title: "Download Failed",
        description: "No valid QR code to download",
        variant: "destructive",
      });
      return;
    }
    
    try {
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
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      await trackEvent('download', 'svg');
      toast({
        title: "SVG Downloaded",
        description: "Vector QR code saved successfully",
      });
    } catch (error) {
      console.error('SVG download failed:', error);
      toast({
        title: "Download Failed",
        description: "Unable to generate SVG file. Please try again.",
        variant: "destructive",
      });
    }
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
      <div className="relative glass-card rounded-2xl p-4 border border-white/10">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={isValid ? `QR code containing: ${qrData.substring(0, 100)}${qrData.length > 100 ? '...' : ''}` : 'QR code preview - no data'}
          className={cn(
            "rounded-xl transition-all duration-300 shadow-2xl",
            isValid ? "animate-float" : "opacity-50 grayscale",
            isAnimating && "animate-pulse scale-105"
          )}
          style={{ 
            maxWidth: '100%', 
            height: 'auto',
            filter: isValid ? 'none' : 'blur(1px)',
            background: 'white',
            borderRadius: '12px'
          }}
        />
        
        {isAnimating && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-shimmer rounded-2xl pointer-events-none" />
        )}
        
        {!qrData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl">
            <div className="w-16 h-16 border-4 border-dashed border-gray-500 rounded-xl mb-4 flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <p className="text-gray-400 text-sm text-center max-w-[200px]">
              Enter content above to generate your QR code
            </p>
          </div>
        )}

        {isValid && (
          <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
        )}
      </div>

      {showActions && isValid && qrData && (
        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          <button
            onClick={downloadPNG}
            className="flex items-center gap-2 glass-card rounded-xl px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all hover-lift"
          >
            <Download className="w-4 h-4" />
            PNG
          </button>
          
          <button
            onClick={downloadSVG}
            className="flex items-center gap-2 glass-card rounded-xl px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all hover-lift"
          >
            <Download className="w-4 h-4" />
            SVG
          </button>
          
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 glass-card rounded-xl px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all hover-lift"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          
          {onSave && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all hover-lift"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          )}
        </div>
      )}

      {isValid && qrData && (
        <div className="w-full max-w-sm mt-4 glass-card rounded-xl p-4 border border-white/10">
          <p className="text-xs font-medium text-gray-400 mb-2">QR Content Preview:</p>
          <p className="text-xs text-gray-300 break-all font-mono">
            {qrData.length > 100 ? qrData.substring(0, 100) + '...' : qrData}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-gray-500">
              {qrData.length} characters
            </span>
            <span className="text-xs text-green-400">
              ✓ Valid QR Code
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
