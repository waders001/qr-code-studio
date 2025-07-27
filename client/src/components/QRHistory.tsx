import { useState } from "react";
import { Trash2, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useIndexedDB } from "@/lib/indexeddb";
import QRPreview from "./QRPreview";

interface QRHistoryItem {
  id: string;
  contentType: string;
  content: string;
  qrData: string;
  customization: any;
  timestamp: number;
}

interface QRHistoryProps {
  history: QRHistoryItem[];
  onRefresh: () => void;
}

export default function QRHistory({ history, onRefresh }: QRHistoryProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { toast } = useToast();
  const { clearHistory } = useIndexedDB();

  const handleClearAll = async () => {
    try {
      await clearHistory();
      onRefresh();
      toast({
        title: "History Cleared",
        description: "All QR codes have been removed from history.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear history.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent QR Codes
          </CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAll}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="relative group cursor-pointer"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="bg-muted rounded-lg p-4 border transition-all duration-200 hover:shadow-lg hover:scale-105">
                {/* Mini QR Preview */}
                <div className="w-16 h-16 bg-background rounded flex items-center justify-center mx-auto mb-3 border">
                  <div className="grid grid-cols-4 gap-px">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 ${
                          (i + Math.floor(i / 4)) % 2 === 0 ? 'bg-foreground' : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground truncate capitalize">
                    {item.contentType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>

              {/* Hover Preview */}
              {hoveredItem === item.id && (
                <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                  <div className="bg-card border rounded-lg p-4 shadow-xl animate-fade-in">
                    <QRPreview
                      qrData={item.qrData}
                      size={96}
                      fgColor={item.customization.fgColor}
                      bgColor={item.customization.bgColor}
                      overlayText={item.customization.overlayText}
                      logoUrl={item.customization.logoUrl}
                      showActions={false}
                    />
                  </div>
                  {/* Arrow */}
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border mx-auto"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
