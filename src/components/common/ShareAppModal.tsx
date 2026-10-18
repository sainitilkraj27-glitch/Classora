import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Smartphone,
  ExternalLink,
  QrCode,
  Sparkles,
  Shield,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose, userProfile }) => {
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  // App Link
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://classora-app.web.app';
  const shareMessage = `🎓 Join me on Classora - The Smart College Portal with Attendance, Groups, Notes & Spoken English Learning!\n\nOpen & Install App:\n${appUrl}`;

  // Catch PWA Install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Classora - College & English Learning App',
          text: shareMessage,
          url: appUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install this app on your phone:\n1. Tap the browser menu (3 dots or share icon)\n2. Select "Add to Home screen" or "Install App".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-[#0c0f20] to-[#070914] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Share & Download App
              </h3>
              <p className="text-[11px] text-slate-400">Invite classmates or install on mobile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* App Info Card */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center gap-3.5 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-cyan-950/60 shrink-0">
            C
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white">Classora Portal & English Hub</h4>
            <p className="text-[11px] text-slate-400 line-clamp-1">
              Classes, Attendance, Messenger & English Learning
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Web & Mobile App (PWA)
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            Scan QR Code to Open / Download:
          </span>

          <div className="p-3 bg-white rounded-2xl shadow-md inline-block">
            {/* Clean SVG QR Code Representation */}
            <svg
              className="w-32 h-32"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner position markers */}
              <rect x="5" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="13" width="10" height="10" rx="2" fill="#0f172a" />

              <rect x="69" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="77" y="13" width="10" height="10" rx="2" fill="#0f172a" />

              <rect x="5" y="69" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="77" width="10" height="10" rx="2" fill="#0f172a" />

              {/* Data modules */}
              <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="46" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="56" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="36" y="18" width="6" height="6" fill="#0f172a" />
              <rect x="50" y="20" width="8" height="8" rx="1" fill="#0284c7" />

              <rect x="8" y="38" width="6" height="6" fill="#0f172a" />
              <rect x="20" y="42" width="6" height="6" fill="#0f172a" />
              <rect x="36" y="36" width="28" height="28" rx="6" fill="#0284c7" />
              <text x="50" y="54" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">C</text>

              <rect x="72" y="38" width="8" height="8" fill="#0f172a" />
              <rect x="84" y="48" width="6" height="6" fill="#0f172a" />

              <rect x="36" y="72" width="6" height="6" fill="#0f172a" />
              <rect x="48" y="76" width="8" height="6" fill="#0f172a" />
              <rect x="62" y="72" width="6" height="6" fill="#0f172a" />
              <rect x="76" y="68" width="6" height="6" fill="#0f172a" />
              <rect x="86" y="82" width="6" height="6" fill="#0f172a" />
            </svg>
          </div>
          <p className="text-[10px] text-slate-400">Scan using any phone camera or Google Lens</p>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition"
          >
            <span>Share on WhatsApp</span>
          </button>

          {/* Native System Share / Copy Link */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share App</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Download & Install Direct Button */}
          <button
            type="button"
            onClick={handleInstallApp}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download / Install App on Phone (Add to Home Screen)</span>
          </button>
        </div>

        {/* Install instructions guide */}
        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1.5 text-[11px] text-slate-400">
          <p className="font-bold text-slate-300 flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            How to Install as App on Mobile:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400 pl-1">
            <li><strong>Android / Chrome:</strong> Tap top-right (⋮) menu ➔ Click <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</li>
            <li><strong>iPhone / Safari:</strong> Tap Share button (<ExternalLink className="w-2.5 h-2.5 inline" />) ➔ Select <strong>"Add to Home Screen"</strong>.</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};
