import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCode } from "@shared/schema";
import QRPreview from "@/components/QRPreview";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, Download } from "lucide-react";

export default function SharedQR() {
  const { shareId } = useParams<{ shareId: string }>();
  const { darkMode, toggleTheme } = useTheme();

  const { data: qrCode, isLoading, error } = useQuery<QRCode>({
    queryKey: ["/api/qr", shareId],
    enabled: !!shareId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-64 h-64 bg-muted rounded-lg mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !qrCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">QR Code Not Found</h1>
          <p className="text-muted-foreground">The QR code you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <div className="w-6 h-6 grid grid-cols-3 gap-px">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 ${i % 2 === 0 ? 'bg-primary-foreground' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">QR Code Studio</h1>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Shared QR Code</h1>
            <p className="text-muted-foreground">
              Content Type: <span className="font-medium capitalize">{qrCode.contentType}</span>
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-lg border">
            <QRPreview
              qrData={qrCode.qrData}
              size={qrCode.customization.size}
              fgColor={qrCode.customization.fgColor}
              bgColor={qrCode.customization.bgColor}
              overlayText={qrCode.customization.overlayText}
              logoUrl={qrCode.customization.logoUrl}
              showActions={true}
              className="mx-auto"
            />
            
            {qrCode.content && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">QR Content:</p>
                <p className="text-sm text-foreground break-all">
                  {qrCode.content.length > 300 
                    ? qrCode.content.substring(0, 300) + '...' 
                    : qrCode.content
                  }
                </p>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Created on {new Date(qrCode.createdAt).toLocaleDateString()}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Your Own QR Code
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
