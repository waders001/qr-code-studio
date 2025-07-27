import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  target: string;
}

interface TutorialProps {
  isVisible: boolean;
  currentStep: number;
  steps: TutorialStep[];
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export default function Tutorial({
  isVisible,
  currentStep,
  steps,
  onNext,
  onPrevious,
  onComplete,
  onSkip
}: TutorialProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isVisible && steps[currentStep]) {
      const element = document.querySelector(`[data-tutorial="${steps[currentStep].target}"]`) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.position = 'relative';
        element.style.zIndex = '1001';
      }
    }
  }, [isVisible, currentStep, steps]);

  if (!isVisible || !steps[currentStep]) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[1000]"
            onClick={onSkip}
          />
          
          {/* Tutorial Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1001] max-w-md w-full mx-4"
          >
            <div className="glass-card rounded-2xl p-6 border border-white/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {currentStep + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {currentStepData.title}
                  </h3>
                </div>
                <button
                  onClick={onSkip}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Skip tutorial"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'bg-blue-400 w-6' 
                        : index < currentStep 
                          ? 'bg-green-400' 
                          : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={onPrevious}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentStep === 0
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onSkip}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                  >
                    Skip
                  </button>
                  
                  <motion.button
                    onClick={isLastStep ? onComplete : onNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    {isLastStep ? 'Get Started' : 'Next'}
                    {!isLastStep && <ArrowRight className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Highlight Target Element */}
          {targetElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed pointer-events-none z-[999]"
              style={{
                top: targetElement.offsetTop - 10,
                left: targetElement.offsetLeft - 10,
                width: targetElement.offsetWidth + 20,
                height: targetElement.offsetHeight + 20,
              }}
            >
              <div className="w-full h-full rounded-xl border-2 border-blue-400 shadow-lg shadow-blue-400/50 animate-pulse" />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}