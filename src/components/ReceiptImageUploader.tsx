import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Eye, UploadCloud } from 'lucide-react';
import { processImageFile } from '../utils/imageCompressor';

interface ReceiptImageUploaderProps {
  idPrefix?: string;
  receiptImage?: string;
  receiptImageName?: string;
  onChange: (imageUri?: string, imageName?: string) => void;
  label?: string;
  helperText?: string;
  compact?: boolean;
}

export const ReceiptImageUploader: React.FC<ReceiptImageUploaderProps> = ({
  idPrefix = 'receipt',
  receiptImage,
  receiptImageName,
  onChange,
  label = 'Attach Receipt / Voucher Image (Optional)',
  helperText = 'Upload stamped slip, online transfer screenshot, or voucher receipt (PNG, JPG, JPEG)',
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    try {
      setIsProcessing(true);
      const res = await processImageFile(file, 1400, 1400, 0.82);
      onChange(res.dataUrl, res.name);
    } catch (err) {
      console.error(err);
      alert('Failed to process image file. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset file input value so selecting the same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined, undefined);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            {label}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Optional voucher/receipt</span>
        </label>
      )}

      <input
        ref={fileInputRef}
        id={`${idPrefix}-file-input`}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {receiptImage ? (
        <div className="flex items-center justify-between p-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg hover:border-slate-600 transition-all">
          <div
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
            title="Click to view full image"
          >
            <div className="w-12 h-12 rounded bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0 relative">
              <img
                src={receiptImage}
                alt="Receipt attachment"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                <Eye className="w-4 h-4 text-white drop-shadow-md opacity-80 group-hover:opacity-100" />
              </div>
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <span>Receipt Attached</span>
                <span className="text-[10px] text-slate-400">({receiptImageName || 'image.jpg'})</span>
              </div>
              <p className="text-[11px] text-slate-400 group-hover:text-blue-300 transition-colors m-0 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click to view full image
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 text-xs bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 transition-colors cursor-pointer"
              title="Replace image"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
          }`}
        >
          {isProcessing ? (
            <div className="py-2 text-xs text-blue-400 flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span>Optimizing & attaching image...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2.5 text-slate-300">
              <UploadCloud className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium text-slate-200 m-0">
                  <span className="text-blue-400 font-semibold underline">Click to upload</span> or drag & drop receipt
                </p>
                <p className="text-[10px] text-slate-400 m-0">
                  {compact ? 'Slip / Online transfer / Voucher image' : helperText}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Size Preview Modal */}
      {showPreviewModal && receiptImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs no-print"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">
                  Attached Voucher / Receipt
                </span>
                {receiptImageName && (
                  <span className="text-xs text-slate-400">({receiptImageName})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={receiptImage}
                  download={receiptImageName || 'receipt-image.jpg'}
                  className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors cursor-pointer"
                  title="Download Image"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
              <img
                src={receiptImage}
                alt="Full receipt"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] object-contain rounded-md shadow-lg border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
