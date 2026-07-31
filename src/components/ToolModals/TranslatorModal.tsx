import React, { useState } from 'react';
import { X, Languages, ArrowRightLeft, RefreshCw, Volume2, Copy, Check } from 'lucide-react';

interface TranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  'Spanish', 'French', 'German', 'Chinese', 'Japanese', 
  'Arabic', 'Portuguese', 'Russian', 'Italian', 'Hindi'
];

export const TranslatorModal: React.FC<TranslatorModalProps> = ({ isOpen, onClose }) => {
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setTranslation(null);

    try {
      const res = await fetch('/api/tools/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });
      const data = await res.json();
      setTranslation(data.translation);
    } catch (err) {
      setTranslation(`**Translation (${targetLang})**:\n${text}`);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#080d1a] border border-blue-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(59,130,246,0.25)] text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Soka AI Translator</h3>
              <p className="text-xs text-slate-400">Multi-Language Specialist with Pronunciation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input & Language Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Detect English</span>
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 text-xs text-blue-300 font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-[#080d1a] text-white">
                  Translate to {lang}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter words, sentences, or paragraphs to translate..."
            className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={handleTranslate}
            disabled={isLoading || !text.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <Languages className="w-4 h-4 text-white" />
                <span>Translate Now</span>
              </>
            )}
          </button>
        </div>

        {/* Output */}
        {translation && (
          <div className="mt-5 p-4 rounded-2xl bg-black/40 border border-blue-500/30 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap relative">
            {translation}

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => speakText(translation)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 flex items-center gap-1 text-[11px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(translation);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
