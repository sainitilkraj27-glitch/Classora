import React from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  BookOpen,
  ExternalLink,
  Download,
  Calendar,
  User,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';
import { CourseMaterial } from '../../types';

interface MaterialViewerModalProps {
  material: CourseMaterial;
  onClose: () => void;
}

export const MaterialViewerModal: React.FC<MaterialViewerModalProps> = ({
  material,
  onClose,
}) => {
  const [copiedText, setCopiedText] = React.useState(false);

  const handleCopyNotes = () => {
    if (material.textContent) {
      navigator.clipboard.writeText(material.textContent);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const getViewerContent = () => {
    switch (material.type) {
      case 'pdf':
        return (
          <div className="space-y-3">
            <div className="w-full h-[60vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-4">
              {material.downloadURL ? (
                <iframe
                  src={material.downloadURL}
                  title={material.title}
                  className="w-full h-full rounded-xl"
                />
              ) : (
                <div className="text-center space-y-3">
                  <FileText className="w-12 h-12 text-red-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">PDF Document Ready</p>
                  <p className="text-xs text-slate-400 max-w-sm">{material.fileName || material.title}</p>
                </div>
              )}
            </div>
            {material.downloadURL && (
              <div className="flex justify-end gap-2">
                <a
                  href={material.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={material.fileName || `${material.title}.pdf`}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-purple-950/40"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div className="w-full max-h-[65vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-2">
              <img
                src={material.downloadURL}
                alt={material.title}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
            {material.downloadURL && (
              <div className="flex justify-end gap-2">
                <a
                  href={material.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={material.fileName || `${material.title}.png`}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" /> Save Image
                </a>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-3">
            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
              <video
                src={material.downloadURL}
                controls
                className="w-full max-h-[60vh] object-contain rounded-xl"
                autoPlay={false}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            {material.downloadURL && (
              <div className="flex justify-end gap-2">
                <a
                  href={material.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={material.fileName || `${material.title}.mp4`}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" /> Download Video
                </a>
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Notes & Study Content</span>
              <button
                onClick={handleCopyNotes}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Text
                  </>
                )}
              </button>
            </div>
            <div className="w-full min-h-[260px] max-h-[60vh] overflow-y-auto bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-sans">
              {material.textContent || 'No text content provided.'}
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">External Study Resource</h4>
              <p className="text-xs text-slate-400 break-all max-w-md mx-auto">
                {material.externalLink || material.downloadURL}
              </p>
            </div>
            <a
              href={material.externalLink || material.downloadURL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-950/40"
            >
              Open External Link <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center text-slate-400">
            <p>Unsupported material format.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {material.type}
              </span>
              {material.chapter && (
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300">
                  {material.chapter}
                </span>
              )}
              {material.fileSizeFormatted && material.fileSizeFormatted !== '0 B' && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> {material.fileSizeFormatted}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{material.title}</h2>
            {material.description && (
              <p className="text-xs text-slate-400 leading-normal">{material.description}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        {getViewerContent()}

        {/* Footer Meta */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" /> Uploaded by {material.uploadedByName || 'Teacher'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {new Date(material.uploadedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};
