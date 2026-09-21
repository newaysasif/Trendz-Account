import React, { useState } from 'react';
import { Image as ImageIcon, Eye, Download, X } from 'lucide-react';

interface ReceiptThumbnailProps {
  image?: string;
  imageName?: string;
  title?: string;
  size?: 'sm' | 'md';
}

export const ReceiptThumbnail: React.FC<ReceiptThumbnailProps> = ({
  image,
  imageName,
  title = 'Receipt Voucher',
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!image) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title={`View attached ${title}`}
        className={`inline-flex items-center gap-1 font-medium transition-all rounded-md cursor-pointer border ${
          size === 'sm'
            ? 'px-1.5 py-0.5 text-[11px] bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border-blue-800/60'
            : 'px-2 py-1 text-xs bg-blue-950/70 hover:bg-blue-900/90 text-blue-200 border-blue-700/70'
        }`}
      >
        <ImageIcon className="w-3 h-3 text-blue-400" />
        <span>Voucher</span>
      </button>

      {/* Full image viewer modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs no-print"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/90">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">{title}</span>
                {imageName && <span className="text-xs text-slate-400">({imageName})</span>}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={image}
                  download={imageName || 'receipt-voucher.jpg'}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors cursor-pointer"
                  title="Download Voucher"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50">
              <img
                src={image}
                alt={title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] object-contain rounded-md shadow-lg border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
