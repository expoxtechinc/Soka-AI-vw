import React from 'react';
import { motion } from 'motion/react';
import { User, AICategory, AITool } from '../types';
import { AI_TOOLS } from '../data/toolsData';
import { 
  Mic, 
  MessageSquare, 
  Image as ImageIcon, 
  Languages, 
  FileText, 
  PenTool, 
  Code2, 
  GraduationCap,
  Sparkles,
  Settings,
  ChevronRight,
  Bot
} from 'lucide-react';

interface MainDashboardProps {
  user: User | null;
  selectedCategory: AICategory;
  onSelectCategory: (cat: AICategory) => void;
  onSelectTool: (tool: AITool) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
}

const CATEGORIES: AICategory[] = [
  'AI Chat',
  'AI Photo',
  'PDF Scanner',
  'Translator',
  'Coding',
  'Assistant',
];

export const MainDashboard: React.FC<MainDashboardProps> = ({
  user,
  selectedCategory,
  onSelectCategory,
  onSelectTool,
  onNewChat,
  onOpenSettings,
  onOpenAdmin,
}) => {
  // Helper to render tool icon based on string name
  const renderIcon = (name: string) => {
    switch (name) {
      case 'Image': return <ImageIcon className="w-6 h-6 text-cyan-400" />;
      case 'Languages': return <Languages className="w-6 h-6 text-blue-400" />;
      case 'FileText': return <FileText className="w-6 h-6 text-purple-400" />;
      case 'PenTool': return <PenTool className="w-6 h-6 text-emerald-400" />;
      case 'Code2': return <Code2 className="w-6 h-6 text-cyan-300" />;
      case 'GraduationCap': return <GraduationCap className="w-6 h-6 text-violet-400" />;
      default: return <MessageSquare className="w-6 h-6 text-cyan-400" />;
    }
  };

  const filteredTools = AI_TOOLS.filter(
    tool => selectedCategory === 'AI Chat' || tool.category === selectedCategory
  );

  return (
    <div className="relative min-h-[90vh] pb-28 px-4 max-w-5xl mx-auto pt-4">
      
      {/* Background Neon Orbs */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Welcome / Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl mb-6 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-500 to-blue-500 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full rounded-full bg-[#080d1a] flex items-center justify-center font-bold text-white text-lg">
              {user ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Hello, {user ? user.name : 'Explorer'} 👋
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Soka AI Multi-Model Router Ready
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          title="App Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Horizontal Scrollable Category Filter Row */}
      <div className="mb-6 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-2.5 min-w-max">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/50 scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Tools Bento Glassmorphism Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            AI Intelligence Suite
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {filteredTools.length} Tools Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool, idx) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTool(tool)}
              className="group relative p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between overflow-hidden"
            >
              {/* Top Row: Icon & Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${tool.accentColor} bg-opacity-20 border border-white/10 shadow-md`}>
                  {renderIcon(tool.iconName)}
                </div>
                {tool.badge && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {tool.badge}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>{tool.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                  {tool.description}
                </p>
              </div>

              {/* Subtle Glowing Corner Accent */}
              <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* WhatsApp Bot Banner Alert for Admin / Users */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 border border-emerald-500/20 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs border border-emerald-500/30">
            WA
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-300">
              WhatsApp 24/7 AI Bot Connection
            </h4>
            <p className="text-[11px] text-slate-400">
              Bot Number: <span className="text-cyan-300 font-mono">+231889792996</span> — Responds to group mentions <code className="text-slate-300">/@Soka AI</code>
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAdmin}
          className="px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
        >
          View Bot
        </button>
      </div>

      {/* Floating Bottom Action Pill Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 w-full max-w-xs">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onNewChat}
          className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-sm tracking-wide transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-cyan-400/40 flex items-center justify-center gap-2.5 group cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Mic className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
          </div>
          <span>New Chat</span>
        </motion.button>
      </div>

    </div>
  );
};
