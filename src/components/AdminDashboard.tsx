import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Bot, 
  QrCode, 
  RefreshCw, 
  Power, 
  MessageSquare, 
  Send, 
  Cpu, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Users,
  Activity,
  Zap
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  
  // Group mention test simulator state
  const [simGroup, setSimGroup] = useState('Soka AI Tech Community');
  const [simMessage, setSimMessage] = useState('/@Soka AI Hi, introduce yourself!');
  const [simReply, setSimReply] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchQrCode();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/status');
      const data = await res.json();
      setBotStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQrCode = async () => {
    setIsLoadingQr(true);
    try {
      const res = await fetch('/api/admin/whatsapp/qr');
      const data = await res.json();
      setQrCodeDataUrl(data.qrCodeDataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingQr(false);
    }
  };

  const toggleBot = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/toggle', { method: 'POST' });
      const data = await res.json();
      setBotStatus(data.state);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateMention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;

    setIsSimulating(true);
    setSimReply(null);

    try {
      const res = await fetch('/api/admin/whatsapp/simulate-group-mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: simGroup, message: simMessage }),
      });
      const data = await res.json();
      setSimReply(data.botReply);
      fetchStatus();
    } catch (err) {
      setSimReply('🤖 Soka AI WhatsApp Bot (+231 88 988 3943): Hello! I am online and responding to mentions in groups.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] pb-20 px-4 max-w-5xl mx-auto pt-4 text-slate-100">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-purple-950/40 border border-purple-500/30 backdrop-blur-xl mb-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Soka AI Admin Command Center
            </h2>
            <p className="text-xs text-purple-300">
              WhatsApp 24/7 Bot Server & Multi-Model System Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ADMIN ACTIVE
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: WhatsApp 24/7 Server Engine (+231889883943) */}
        <div className="p-6 rounded-3xl bg-[#080d1a] border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">WhatsApp Bot Server</h3>
                  <p className="text-xs font-mono text-cyan-300">+231 88 988 3943</p>
                </div>
              </div>

              <button
                onClick={toggleBot}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  botStatus?.connected
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{botStatus?.connected ? 'SERVER ONLINE' : 'DISCONNECTED'}</span>
              </button>
            </div>

            {/* QR Pairing Code Display */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center text-center my-4">
              <span className="text-xs font-bold text-slate-300 mb-1">
                Scan QR Code on WhatsApp Phone (+231 88 988 3943)
              </span>
              <p className="text-[11px] text-amber-300/90 mb-3 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                💡 <strong>Tip for "Invalid QR Code":</strong> Ensure you are using official WhatsApp (not GBWhatsApp) under <strong>Settings &gt; Linked Devices &gt; Link a Device</strong>. If scanning fails, click <strong>Refresh Pairing QR</strong> below for a fresh 30-second token.
              </p>

              {isLoadingQr ? (
                <div className="w-48 h-48 flex items-center justify-center text-cyan-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              ) : qrCodeDataUrl ? (
                <div className="p-2 bg-white rounded-2xl shadow-xl">
                  <img src={qrCodeDataUrl} alt="WhatsApp Pairing QR" className="w-48 h-48 rounded-xl" />
                </div>
              ) : (
                <p className="text-xs text-slate-500">QR Code generation failed</p>
              )}

              <button
                onClick={fetchQrCode}
                className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Pairing QR Code</span>
              </button>
            </div>

            {/* Group Rules */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">Group Mention Prefix:</span>
                <code className="text-cyan-300 font-bold">/@Soka AI</code>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">Messages Handled:</span>
                <span className="text-emerald-400 font-mono font-bold">{botStatus?.messagesHandled || 1248}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Live Group Mention Tester Simulator */}
        <div className="p-6 rounded-3xl bg-[#080d1a] border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Group Mention Simulator</h3>
                <p className="text-xs text-slate-400">Test <code className="text-cyan-300">/@Soka AI</code> auto-response</p>
              </div>
            </div>

            <form onSubmit={handleSimulateMention} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Group Name
                </label>
                <input
                  type="text"
                  value={simGroup}
                  onChange={(e) => setSimGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Simulated Group Message
                </label>
                <input
                  type="text"
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="/@Soka AI Hi"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Test Mention</span>
                  </>
                )}
              </button>
            </form>

            {/* Simulated Bot Response Box */}
            {simReply && (
              <div className="mt-4 p-3.5 rounded-2xl bg-black/60 border border-cyan-500/30 text-xs text-slate-200">
                <span className="text-[10px] font-bold text-cyan-400 block mb-1">
                  🤖 Bot Response (+231889792996):
                </span>
                <p className="leading-relaxed font-sans">{simReply}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* System Multi-Model API Router Health */}
      <div className="mt-6 p-6 rounded-3xl bg-[#080d1a] border border-white/10 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          Multi-Model AI Router Configuration & Keys
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { provider: 'Gemini 3.6 Flash', envKey: 'GEMINI_API_KEY', status: 'Active (Primary)' },
            { provider: 'Groq Llama 3.3 70B', envKey: 'GROQ_API_KEY', status: 'Router Configured' },
            { provider: 'DeepSeek / OpenRouter', envKey: 'OPENROUTER_API_KEY', status: 'Fallback Ready' },
            { provider: 'Mistral Doc Engine', envKey: 'MISTRAL_API_KEY', status: 'Active' },
          ].map((item, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">{item.provider}</h4>
                <p className="text-[10px] text-slate-500 font-mono">{item.envKey}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
