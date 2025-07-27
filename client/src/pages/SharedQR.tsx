import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Download, Share2, Copy, QrCode, ArrowLeft } from "lucide-react";
import QRPreview from "@/components/QRPreview";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SharedQR() {
  const { shareId } = useParams();
  const [copied, setCopied] = useState(false);
  
  const { data: qrCode, isLoading, error } = useQuery({
    queryKey: ["/api/qr", shareId],
    queryFn: () => fetch(`/api/qr/${shareId}`).then(res => res.json()),
    enabled: !!shareId,
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The QR code link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually from your browser.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-texture bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-card flex items-center justify-center">
            <QrCode className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <p className="text-white font-medium">Loading QR Code...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !qrCode) {
    return (
      <div className="min-h-screen bg-texture bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 text-center max-w-md mx-4"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">QR Code Not Found</h1>
          <p className="text-gray-400 mb-6">
            This QR code doesn't exist or has been removed.
          </p>
          <motion.a
            href="/"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Create New QR Code
          </motion.a>
        </motion.div>
      </div>
    );
  }

  const contentData = typeof qrCode.content === 'string' ? JSON.parse(qrCode.content) : qrCode.content;

  return (
    <div className="min-h-screen bg-texture bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-3 mb-4"
            >
              <div className="relative">
                <QrCode className="w-8 h-8 text-blue-400" />
                <div className="absolute inset-0 w-8 h-8 bg-blue-400/20 rounded-lg blur-lg"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Shared QR Code
              </h1>
            </motion.div>
          </div>

          {/* QR Code Display */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-8 text-center mb-8"
          >
            <div className="neumorphic-inset rounded-2xl p-6 mb-6">
              <QRPreview
                qrData={qrCode.qrData}
                size={qrCode.customization.size || 256}
                fgColor={qrCode.customization.fgColor || '#000000'}
                bgColor={qrCode.customization.bgColor || '#ffffff'}
                overlayText={qrCode.customization.overlayText}
                logoUrl={qrCode.customization.logoUrl}
                className="mx-auto animate-float"
              />
            </div>
            
            {/* QR Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-400">Type:</span>
                <span className="capitalize font-medium text-blue-300 px-3 py-1 rounded-full bg-blue-500/20 text-sm">
                  {qrCode.contentType}
                </span>
              </div>
              
              {qrCode.customization.overlayText && (
                <p className="text-sm text-gray-300">
                  <span className="text-gray-400">Text:</span> {qrCode.customization.overlayText}
                </p>
              )}
              
              <p className="text-xs text-gray-500">
                Created: {new Date(qrCode.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                onClick={copyToClipboard}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 glass-card px-6 py-3 rounded-xl text-white font-medium hover-lift group"
              >
                <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {copied ? 'Copied!' : 'Copy Link'}
              </motion.button>
              
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                <QrCode className="w-4 h-4" />
                Create Your Own
              </motion.a>
            </div>
          </motion.div>

          {/* Content Preview */}
          {qrCode.contentType !== 'text' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">QR Content Preview</h3>
              <div className="neumorphic-inset rounded-xl p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                  {typeof contentData === 'object' 
                    ? JSON.stringify(contentData, null, 2)
                    : String(contentData)
                  }
                </pre>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}