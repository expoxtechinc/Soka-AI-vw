import React from 'react';
import { User } from '../types';
import { Settings, Shield, LogOut, Download } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  deferredInstallPrompt: any;
  onInstallPWA: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenSettings,
  onOpenAdmin,
  onOpenAuth,
  onLogout,
  onGoHome,
  deferredInstallPrompt,
  onInstallPWA,
}) => {
  const logoUrl = "https://cdn.phototourl.com/free/2026-07-31-00e9c962-b18e-4b0d-9def-a1d53246cb53.png";

  return (
    <header className="sticky top-0 z-40 w-full bg-[#010209]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <button 
          onClick={onGoHome}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-cyan-500 via-purple-500 to-blue-500 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <img 
              src={logoUrl} 
              alt="Soka AI Logo" 
              className="w-full h-full object-cover rounded-[10px]" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                Soka AI
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v2.5 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Futuristic Multi-Model Assistant
            </p>
          </div>
        </button>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Install PWA Button */}
          {deferredInstallPrompt && (
            <button
              onClick={onInstallPWA}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all shadow-sm shadow-cyan-500/10"
              title="Install Soka AI as App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Admin Dashboard Button */}
          {user?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all shadow-sm shadow-purple-500/10"
              title="Admin Dashboard & WhatsApp Bot Hub"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Admin Hub</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              {/* User Avatar & Name */}
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <span className="text-xs font-medium text-slate-200 hidden xs:inline max-w-[100px] truncate">
                  {user.name}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {/* Settings Icon */}
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Settings & App Data"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
