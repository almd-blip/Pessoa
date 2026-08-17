import React, { useEffect, useState } from 'react';
import { Printer, Copy, Check, X, FileText } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rawTextToCopy?: string;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  rawTextToCopy,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow DOM to render modal before triggering print dialog
      const timer = setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Browser iframe print dialog suppressed:', e);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSystemPrint = () => {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.warn('System print failed:', e);
    }
  };

  const handleCopyText = async () => {
    if (!rawTextToCopy) return;
    try {
      await navigator.clipboard.writeText(rawTextToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn no-print">
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Action Bar */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-[#912A4A] dark:text-rose-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-sans font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                Print & Offline Preview
              </h2>
              <p className="font-sans text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 truncate max-w-[200px] sm:max-w-xs">
                {title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {rawTextToCopy && (
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 sm:px-3 py-1.5 rounded-md border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy formatted document text to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSystemPrint}
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-[#912A4A] hover:bg-[#78223d] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              title="Trigger browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-md text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 border border-stone-200/80 dark:border-stone-700 shadow-2xs"
              aria-label="Close preview"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Paper Document Canvas */}
        <div className="p-3 sm:p-6 md:p-8 overflow-y-auto bg-stone-200/50 dark:bg-stone-950/80 flex-1">
          <div className="bg-white text-stone-900 p-4 sm:p-8 md:p-12 rounded-lg border border-stone-200 shadow-md max-w-2xl mx-auto space-y-6 font-sans leading-relaxed">
            {/* Document Header */}
            <div className="border-b-2 border-stone-900 pb-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                    Pessoa — Printable Document
                  </span>
                  <h1 className="text-2xl font-serif font-bold text-stone-900 mt-1">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-stone-600 italic mt-1">{subtitle}</p>
                  )}
                </div>
                <div className="text-right text-[10px] font-mono text-stone-500 shrink-0">
                  <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div>Offline Reading Format</div>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div>
              {children}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-stone-200 text-center text-[10px] font-mono text-stone-400">
              Printed from Pessoa — Human-Centric Research & Writing Companion
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
