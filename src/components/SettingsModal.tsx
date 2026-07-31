import React from 'react';
import { User } from '../types';
import { X, Trash2, Download, Shield, LogOut, CheckCircle, Smartphone } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onClearData: () => void;
  deferredInstallPrompt: any;
  onInstallPWA: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onClearData,
  deferredInstallPrompt,
  onInstallPWA,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#080d1a] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white">Soka AI App Settings</h3>
          <p className="text-xs text-slate-400 mt-1">Manage user account & site stored data</p>
        </div>

        {/* User Info */}
        {user ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 font-bold text-lg text-white flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{user.name}</h4>
              <p className="text-xs text-slate-400">{user.email}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mt-1 inline-block">
                Role: {user.role.toUpperCase()}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 text-center text-xs text-slate-400">
            No user account signed in. You are operating as Guest.
          </div>
        )}

        {/* PWA Install Action */}
        {deferredInstallPrompt && (
          <button
            onClick={onInstallPWA}
            className="w-full mb-3 p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Install Soka AI on Home Screen</span>
          </button>
        )}

        {/* Delete Store Data Action */}
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2 mb-4">
          <h4 className="text-xs font-bold text-red-300 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-red-400" />
            Delete Stored Site Data
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Clearing stored data will erase all saved user information, chat histories, and settings from this browser device.
          </p>
          <button
            onClick={onClearData}
            className="w-full mt-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Delete All Store Data & Reset</span>
          </button>
        </div>

      </div>
    </div>
  );
};
