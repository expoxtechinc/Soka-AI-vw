import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, AICategory } from '../types';
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Bot, 
  X, 
  Code2, 
  FileText, 
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface ActiveChatScreenProps {
  category: AICategory;
  messages: ChatMessage[];
  onSendMessage: (text: string, attachedFile?: { name: string; type: string; url?: string }) => void;
  onRegenerate: () => void;
  onClearChat: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export const ActiveChatScreen: React.FC<ActiveChatScreenProps> = ({
  category,
  messages,
  onSendMessage,
  onRegenerate,
  onClearChat,
  onBack,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; url?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const logoUrl = "https://cdn.phototourl.com/free/2026-07-31-00e9c962-b18e-4b0d-9def-a1d53246cb53.png";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Speech Recognition (Web Speech API)
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported on this browser. Try Chrome or Android browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error("Voice Error:", err);
      setIsListening(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({
          name: file.name,
          type: 'image',
          url: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachedFile({
        name: file.name,
        type: 'document',
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    onSendMessage(input, attachedFile || undefined);
    setInput('');
    setAttachedFile(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Basic Markdown Renderer for Code Blocks, Checkmarks, and Lists
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    return lines.map((line, idx) => {
      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const codeText = codeBuffer.join('\n');
          codeBuffer = [];
          return (
            <div key={`code_${idx}`} className="my-3 rounded-2xl bg-[#040814] border border-cyan-500/20 overflow-hidden font-mono text-xs">
              <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
                  <Code2 className="w-3.5 h-3.5" />
                  Code Block
                </span>
                <button
                  onClick={() => copyToClipboard(codeText, `code_${idx}`)}
                  className="hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                >
                  <Copy className="w-3 h-3" />
                  {copiedId === `code_${idx}` ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return null;
      }

      // Checkmarks highlight
      if (line.includes('✅') || line.trim().startsWith('- [x]')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1.5 text-emerald-300 font-medium text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{line.replace('✅', '').replace('- [x]', '').trim()}</span>
          </div>
        );
      }

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 my-1 text-xs sm:text-sm">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      }

      // Headings
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-bold text-cyan-300 mt-3 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-base font-extrabold text-white mt-4 mb-2">{line.replace('## ', '')}</h2>;
      }

      if (!line.trim()) return <div key={idx} className="h-2" />;

      return (
        <p key={idx} className="text-slate-200 text-xs sm:text-sm leading-relaxed my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between max-w-4xl mx-auto px-3 sm:px-4 py-3">
      
      {/* Top Header Bar */}
      <div className="sticky top-14 z-30 flex items-center justify-between p-3 rounded-2xl bg-[#080d1a]/90 border border-white/10 backdrop-blur-xl mb-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5">
              <img src={logoUrl} alt="Soka AI" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Soka AI Assistant</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Model: <span className="text-cyan-400 font-medium">{selectedModel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Model Selector Dropdown & Clear */}
        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-white/5 border border-white/10 text-xs text-slate-200 font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 hidden sm:block"
          >
            <option value="Gemini 2.5 Flash">Gemini 2.5 Flash</option>
            <option value="Groq Llama 3.3 70B">Groq Llama 3.3 70B</option>
            <option value="DeepSeek R1">DeepSeek R1</option>
            <option value="Mistral PDF">Mistral PDF</option>
          </select>

          <button
            onClick={onClearChat}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-32">
        {messages.length === 0 ? (
          <div className="my-auto py-16 text-center text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Soka AI Conversation Initialized</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Ask any question, request code debugging, translate text, or analyze document files!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Header Badge */}
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-semibold text-slate-400">
                  {msg.role === 'user' ? 'You' : 'Soka AI'}
                </span>
                {msg.modelUsed && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {msg.modelUsed}
                  </span>
                )}
              </div>

              {/* Message Speech Bubble */}
              <div
                className={`relative max-w-[88%] sm:max-w-[80%] p-4 rounded-3xl backdrop-blur-md shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm border border-cyan-400/30'
                    : 'bg-[#080d1a] border border-white/10 text-slate-100 rounded-tl-sm shadow-[0_0_20px_rgba(0,0,0,0.4)]'
                }`}
              >
                {/* File Attachment Preview */}
                {msg.attachedFile && (
                  <div className="mb-3 p-2 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-2.5">
                    {msg.attachedFile.type === 'image' && msg.attachedFile.url ? (
                      <img src={msg.attachedFile.url} alt="Attached" className="w-12 h-12 object-cover rounded-xl" />
                    ) : (
                      <FileText className="w-6 h-6 text-cyan-400" />
                    )}
                    <span className="text-xs font-mono text-slate-300 truncate max-w-[180px]">
                      {msg.attachedFile.name}
                    </span>
                  </div>
                )}

                {/* Content */}
                {msg.role === 'user' ? (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.content}
                  </p>
                ) : (
                  <div>{renderMarkdown(msg.content)}</div>
                )}

                {/* Actions Row for AI Response */}
                {msg.role === 'assistant' && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={onRegenerate}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-3xl bg-[#080d1a] border border-cyan-500/30 max-w-xs shadow-lg"
          >
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center animate-spin">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs font-semibold text-cyan-300 animate-pulse">
              Soka AI Multi-Model Router Processing...
            </span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Pill Chat Input Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-3">
        
        {/* Attached File Indicator */}
        {attachedFile && (
          <div className="mb-2 p-2 px-3 rounded-2xl bg-[#080d1a] border border-cyan-500/40 backdrop-blur-md flex items-center justify-between text-xs text-cyan-300 shadow-xl">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{attachedFile.name}</span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Stretched Pill Contour Input */}
        <form
          onSubmit={handleFormSubmit}
          className="relative flex items-center gap-2 p-1.5 pl-4 rounded-full bg-[#080d1a]/95 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.25)] backdrop-blur-2xl"
        >
          {/* File Upload Trigger */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
            title="Upload File or Photo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2 rounded-full transition-colors ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
            }`}
            title={isListening ? 'Stop Speech Recognition' : 'Start Voice Input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening to voice...' : 'Ask anything...'}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none px-2"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() && !attachedFile}
            className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:hover:from-cyan-500 text-white transition-all shadow-lg shadow-cyan-500/30 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
