import React from 'react';
import { motion } from 'motion/react';
import { Mic, Sparkles, Bot, Zap, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onGetStarted,
  onSignIn,
}) => {
  const logoUrl = "https://cdn.phototourl.com/free/2026-07-31-00e9c962-b18e-4b0d-9def-a1d53246cb53.png";

  return (
    <div className="relative min-h-[92vh] flex flex-col items-center justify-between px-4 py-8 overflow-hidden bg-[#010209]">
      
      {/* Background Neon Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header Tag */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-cyan-500/30 backdrop-blur-md text-xs font-semibold text-cyan-300 shadow-inner"
      >
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Next-Generation Intelligence Engine</span>
      </motion.div>

      {/* Center Interactive Microphone Circle with Multi-layered Glowing Rings */}
      <div className="my-auto py-8 flex flex-col items-center text-center">
        
        {/* Animated Concentric Neon Rings */}
        <div className="relative flex items-center justify-center">
          
          {/* Outer Pulsing Glow Ring 3 */}
          <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-cyan-500/30 bg-cyan-500/5 blur-sm"
          />

          {/* Outer Pulsing Glow Ring 2 */}
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-purple-500/40 bg-purple-500/10"
          />

          {/* Inner Glowing Ring 1 */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 border-dashed border-cyan-400/50"
          />

          {/* Center Main Circular AI Microphone Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-600 to-blue-500 p-1 shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center group cursor-pointer"
          >
            <div className="w-full h-full rounded-full bg-[#010209] flex flex-col items-center justify-center border border-white/20 group-hover:bg-[#080d1a] transition-colors">
              <Mic className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase mt-1">Tap to Start</span>
            </div>
          </motion.button>
        </div>

        {/* Center Text Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-8 max-w-lg px-2"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Experience smarter with{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              Soka AI
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            Multi-model AI router, document scanner, visual synthesis, voice assistant, and 24/7 WhatsApp integration — built for speed & elegance.
          </p>

          {/* Feature Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Multi-Model Router
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              PDF OCR & Photos
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp Bot +231889792996
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Stacked Action Pill Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-sm space-y-3 z-10"
      >
        <button
          onClick={onGetStarted}
          className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 group active:scale-[0.98]"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onSignIn}
          className="w-full py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Sign In</span>
        </button>
      </motion.div>

    </div>
  );
};
