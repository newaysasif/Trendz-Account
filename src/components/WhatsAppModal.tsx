import React, { useState } from 'react';
import { Send, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { TrendzLogoMark } from './TrendzLogo';

interface WhatsAppModalProps {
  message: string | null;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ message, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const isInvoice = message.includes('*INVOICE*') || message.includes('Invoice No');
  const isReceipt = message.includes('*RECEIPT*') || message.includes('Receipt No');

  const docTypeLabel = isInvoice ? 'INVOICE' : isReceipt ? 'RECEIPT' : 'DOCUMENT / STATEMENT';

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in border border-slate-200">
        {/* Branded Header */}
        <div className="bg-[#0e1319] border-b border-amber-900/30 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-lg bg-black border border-amber-500/30 shrink-0">
              <TrendzLogoMark size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-[0.18em] font-serif text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] via-[#FFF3D1] to-[#C89D4B]">
                  TRENDZ INTERIOR
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${
                    isInvoice
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : isReceipt
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {docTypeLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 m-0">Send Official {docTypeLabel} to Client via WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold leading-none cursor-pointer">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Dispatched with official Trendz Interior branding</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <Send className="w-3.5 h-3.5" /> WhatsApp Ready
            </span>
          </div>

          <div className="bg-slate-950 text-emerald-300 font-mono text-xs p-4 rounded-xl max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
            {message}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Send on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

