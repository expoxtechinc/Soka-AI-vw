import React, { useState } from 'react';
import { X, Sparkles, Download, Image as ImageIcon, RefreshCw, Wand2, Upload, Layers, Sliders, Palette } from 'lucide-react';

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageGenModal: React.FC<ImageGenModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [operationMode, setOperationMode] = useState('text-to-image');
  const [stylePreset, setStylePreset] = useState('Cyberpunk Neon');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [provider, setProvider] = useState('Auto Router');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageDetails, setImageDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !referenceImage) return;

    setIsLoading(true);
    setGeneratedImage(null);
    setImageDetails(null);

    try {
      const res = await fetch('/api/tools/image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          operationMode,
          stylePreset,
          aspectRatio,
          provider,
          referenceImage,
        }),
      });
      const data = await res.json();
      setGeneratedImage(data.imageUrl);
      if (data.description) {
        setImageDetails(data.description);
      }
    } catch (err) {
      console.error(err);
      setGeneratedImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#080d1a] border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Soka AI Creative Studio</h3>
              <p className="text-xs text-slate-400">Multi-Model Visual Synthesis & Photo Editing Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          
          {/* Operation Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Operation</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'text-to-image', label: 'Text-to-Image' },
                { id: 'image-to-image', label: 'Image-to-Image' },
                { id: 'style-transfer', label: 'Style Transfer' },
                { id: 'background-removal', label: 'Remove BG' },
                { id: 'face-restoration', label: 'Face Restore / Upscale' },
                { id: 'logo-gen', label: 'Logo Generator' },
                { id: 'poster-banner', label: 'Poster & Banner' },
                { id: 'product-mockup', label: 'Product Mockup' },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperationMode(op.id)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                    operationMode === op.id
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference Image Upload (Optional or required for image-to-image/editing) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Reference Image {operationMode !== 'text-to-image' ? '(Recommended)' : '(Optional)'}</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer p-3 rounded-2xl bg-white/5 border border-dashed border-white/20 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>{referenceImage ? 'Change Uploaded Photo' : 'Click to Upload Image File'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {referenceImage && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-cyan-500/40">
                  <img src={referenceImage} alt="Ref Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setReferenceImage(null)}
                    className="absolute top-0 right-0 p-0.5 bg-black/80 text-white rounded-bl"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Describe your image or edit instructions
            </label>
            <textarea
              rows={3}
              required={!referenceImage}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A futuristic cybernetic tiger running through a glowing neon Tokyo alleyway, 8k hyperrealistic lighting..."
              className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Style Preset & Aspect Ratio Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Style Preset</span>
              </label>
              <select
                value={stylePreset}
                onChange={(e) => setStylePreset(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                {['Cyberpunk Neon', 'Studio Ghibli Anime', 'Hyperrealistic 3D', 'Watercolor Impressionism', 'Vector Logo Art', 'Vintage Oil Painting', 'Minimalist Flat', 'Dark Fantasy'].map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Provider Engine</span>
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-cyan-300 font-medium focus:border-cyan-500 focus:outline-none"
              >
                {['Auto Router (Fastest Available)', 'Cloudflare Workers AI', 'Fal AI (FLUX)', 'Together AI', 'Replicate', 'Hugging Face', 'Pollinations AI', 'Gemini Vision'].map((pv) => (
                  <option key={pv} value={pv}>{pv}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['1:1', '16:9', '9:16', '4:3'].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    aspectRatio === ratio
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!prompt.trim() && !referenceImage)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing Visual...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-white" />
                <span>Generate & Render Image</span>
              </>
            )}
          </button>
        </form>

        {/* Generated Image Result Display */}
        {generatedImage && (
          <div className="mt-6 space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-black/60 shadow-2xl">
              <img src={generatedImage} alt={prompt || 'Generated Visual'} className="w-full h-auto object-cover max-h-[400px]" />
            </div>

            {imageDetails && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-cyan-300 block mb-1">✨ Soka AI Image Analysis:</span>
                {imageDetails}
              </div>
            )}

            <a
              href={generatedImage}
              download="soka-ai-artwork.png"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download High-Res Image</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
};

