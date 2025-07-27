import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { QrCode, Sparkles, Download, Share2, BarChart3, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const features = [
    {
      icon: QrCode,
      title: "Professional QR Generation",
      description: "Create stunning QR codes for text, URLs, vCards, WiFi, and more with real-time preview"
    },
    {
      icon: Download,
      title: "Multiple Export Formats",
      description: "Download as high-quality PNG or scalable SVG with custom sizing and branding"
    },
    {
      icon: Share2,
      title: "Instant Sharing",
      description: "Generate shareable links instantly and track engagement with built-in analytics"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Monitor QR code performance, track scans, and analyze user engagement patterns"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-2xl glass-card rounded-3xl p-8 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full glass-card hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <span className="text-white font-bold text-2xl font-mono">QR</span>
                </div>
                <Sparkles className="w-6 h-6 text-yellow-400 ml-2 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent mb-2">
                Welcome to QR Genius
              </h2>
              <p className="text-gray-300 text-lg">
                The most powerful QR code generator for professionals
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-400/30">
                      <feature.icon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
              >
                Start Creating QR Codes
              </Button>
              <p className="text-xs text-gray-400 mt-3">
                Free to use • No registration required • Professional features included
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('qr-genius-welcome-seen');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const close = () => {
    setIsOpen(false);
    localStorage.setItem('qr-genius-welcome-seen', 'true');
  };

  return { isOpen, close };
}