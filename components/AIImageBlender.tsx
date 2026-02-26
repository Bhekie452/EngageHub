import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Wand2, Loader2, Image as ImageIcon, Type, X, Check, Sparkles } from 'lucide-react';
import { useToast } from '../src/components/common/Toast';

interface AIImageBlenderProps {
  isOpen?: boolean;
  onClose?: () => void;
  onInsert?: (imageData: string) => void;
}

export const AIImageBlender: React.FC<AIImageBlenderProps> = ({ isOpen = true, onClose, onInsert }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [subheading, setSubheading] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [showBackgroundAccent, setShowBackgroundAccent] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [styleSeed, setStyleSeed] = useState<number>(() => Date.now());
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const regenTimerRef = useRef<number | null>(null);

  const headingRef = useRef<HTMLDivElement>(null);
  const subheadingRef = useRef<HTMLDivElement>(null);

  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const mulberry32 = (seed: number) => {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };

  const styleParams = useMemo(() => {
    const rnd = mulberry32(styleSeed);
    const gradientAngle = Math.floor(rnd() * 360);
    const accentAlpha = 0.22 + rnd() * 0.16;
    const accentBarAlpha = 0.55 + rnd() * 0.2;
    const vignetteStrength = 0.18 + rnd() * 0.18;
    const boxRadius = 22 + Math.floor(rnd() * 10);
    const boxWidthFactor = 0.64 + rnd() * 0.1;
    return {
      gradientAngle,
      accentAlpha,
      accentBarAlpha,
      vignetteStrength,
      boxRadius,
      boxWidthFactor,
    };
  }, [styleSeed]);

  const wrapLines = (ctx: CanvasRenderingContext2D, input: string, maxWidth: number) => {
    const words = input.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth) {
        current = next;
        continue;
      }
      if (current) lines.push(current);
      current = word;
    }
    if (current) lines.push(current);
    return lines;
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    // Modern browsers support roundRect; fall back when unavailable.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCtx: any = ctx;
    if (typeof anyCtx.roundRect === 'function') {
      anyCtx.beginPath();
      anyCtx.roundRect(x, y, w, h, radius);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast?.error('File size must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast?.error('Please upload an image file');
        return;
      }
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setGeneratedImage(null);
      setStyleSeed(Date.now());
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
          toast?.error('File size must be less than 10MB');
          return;
        }
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        setGeneratedImage(null);
        setStyleSeed(Date.now());
      } else {
        toast?.error('Please upload an image file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderCompositeToDataUrl = async (opts?: { showToast?: boolean }) => {
    if (!imagePreview || !image) return null;

    const headline = (text || '').trim();
    if (!headline) return null;

    const sub = (subheading || '').trim();

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imagePreview;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200; // square works best across platforms
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // Draw image (cover)
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (imgRatio > canvasRatio) {
      sw = img.height * canvasRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / canvasRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Dark gradient overlay (angle based)
    const angle = (styleParams.gradientAngle * Math.PI) / 180;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const len = Math.max(canvas.width, canvas.height);
    const x0 = cx - Math.cos(angle) * len;
    const y0 = cy - Math.sin(angle) * len;
    const x1 = cx + Math.cos(angle) * len;
    const y1 = cy + Math.sin(angle) * len;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,0.62)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vignette
    const vignette = ctx.createRadialGradient(cx, cy, canvas.width * 0.2, cx, cy, canvas.width * 0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, `rgba(0,0,0,${styleParams.vignetteStrength})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Typography (center)
    const maxTextWidth = Math.floor(canvas.width * styleParams.boxWidthFactor);
    const headingSize = 86;
    const headingLineHeight = Math.round(headingSize * 1.08);
    const subSize = 36;
    const subLineHeight = Math.round(subSize * 1.28);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `800 ${headingSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
    const headingLines = wrapLines(ctx, headline, maxTextWidth);
    const safeHeadingLines = headingLines.slice(0, 6);

    let subLines: string[] = [];
    if (sub) {
      ctx.font = `600 ${subSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
      subLines = wrapLines(ctx, sub, maxTextWidth).slice(0, 3);
    }

    // Measure block
    ctx.font = `800 ${headingSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
    const headingWidths = safeHeadingLines.map((l) => ctx.measureText(l).width);
    ctx.font = `600 ${subSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
    const subWidths = subLines.map((l) => ctx.measureText(l).width);
    const maxLineWidth = Math.max(...headingWidths, ...subWidths, 0);

    const blockHeight = safeHeadingLines.length * headingLineHeight + (subLines.length ? 18 + subLines.length * subLineHeight : 0);
    const boxPaddingX = 48;
    const boxPaddingY = 44;
    const boxW = Math.min(maxTextWidth, Math.ceil(maxLineWidth)) + boxPaddingX * 2;
    const boxH = blockHeight + boxPaddingY * 2;
    const boxX = (canvas.width - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;

    // Accent box + bar (optional)
    if (showBackgroundAccent) {
      ctx.save();
      ctx.fillStyle = hexToRgba(backgroundColor, styleParams.accentAlpha);
      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, styleParams.boxRadius);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = hexToRgba(backgroundColor, styleParams.accentBarAlpha);
      drawRoundedRect(ctx, boxX, boxY, boxW, 10, 10);
      ctx.fill();
      ctx.restore();
    }

    // Text with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = textColor;

    let y = boxY + boxPaddingY;
    ctx.font = `800 ${headingSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
    for (const line of safeHeadingLines) {
      ctx.fillText(line, canvas.width / 2, y);
      y += headingLineHeight;
    }

    if (subLines.length) {
      y += 18;
      ctx.font = `600 ${subSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      for (const line of subLines) {
        ctx.fillText(line, canvas.width / 2, y);
        y += subLineHeight;
      }
    }

    ctx.restore();

    const output = canvas.toDataURL('image/png');
    if (opts?.showToast) toast?.success('Image generated successfully!');
    return output;
  };

  const handleGenerate = async (opts?: { showToast?: boolean }) => {
    if (!image || !imagePreview) {
      toast?.error('Please upload an image first.');
      return;
    }

    const headline = (text || '').trim();
    if (!headline) {
      toast?.error('Please enter the text you want on the image.');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const output = await renderCompositeToDataUrl({ showToast: opts?.showToast ?? true });
      if (!output) throw new Error('Failed to generate image');
      setGeneratedImage(output);
    } catch (error) {
      console.error('Error generating image:', error);
      toast?.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const scheduleRegenerate = () => {
    if (!image || !imagePreview) return;
    if (!(text || '').trim()) return;
    if (regenTimerRef.current) window.clearTimeout(regenTimerRef.current);
    regenTimerRef.current = window.setTimeout(() => {
      handleGenerate({ showToast: false });
    }, 250);
  };

  useEffect(() => {
    scheduleRegenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textColor, backgroundColor, styleSeed, showBackgroundAccent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-600 bg-white/50 hover:bg-white rounded-full transition-all backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Panel: Controls */}
        <div className="w-full md:w-[450px] bg-white p-6 md:p-8 flex flex-col h-full border-r border-gray-100 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">AI Image Blender</h2>
          </div>

          <div className="mb-6 shrink-0">
            <h3 className="text-2xl font-serif italic text-gray-800 mb-2">Create something beautiful</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Upload an image and add text overlays with custom colors. Our AI will blend them seamlessly for you.
            </p>
          </div>

          <div className="space-y-6 flex-1 min-h-0">
            {/* Upload Area */}
            <div 
              className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all h-40 flex flex-col items-center justify-center text-center p-4
                ${image ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleImageChange} 
                accept="image/*" 
              />
              
              {imagePreview ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60 group-hover:opacity-40 transition-opacity" 
                  />
                  <div className="relative z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-xs font-medium text-gray-700">
                    <Check className="w-3 h-3 text-green-500" />
                    Image Selected
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Click to upload</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">or drag and drop</p>
                </>
              )}
            </div>

            {/* Controls Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Headline (editable on image)
                </label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      scheduleRegenerate();
                    }}
                    placeholder="Your Text Here"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-700 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Subheading (optional)
                </label>
                <input
                  type="text"
                  value={subheading}
                  onChange={(e) => {
                    setSubheading(e.target.value);
                    scheduleRegenerate();
                  }}
                  placeholder="Optional supporting line"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-700 placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Text Color
                  </label>
                  <div className="relative h-11 flex items-center gap-3 px-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white group cursor-pointer shadow-sm">
                    <div 
                      className="w-6 h-6 rounded-lg shadow-sm border border-gray-100 ring-1 ring-black/5"
                      style={{ backgroundColor: textColor }}
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase flex-1">{textColor}</span>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Background
                  </label>
                  <div className={`relative h-11 flex items-center gap-3 px-3 border border-gray-200 rounded-xl transition-colors bg-white shadow-sm ${showBackgroundAccent ? 'hover:border-gray-300 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                    <div 
                      className="w-6 h-6 rounded-lg shadow-sm border border-gray-100 ring-1 ring-black/5"
                      style={{ backgroundColor: backgroundColor }}
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase flex-1">{backgroundColor}</span>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => {
                        if (!showBackgroundAccent) return;
                        setBackgroundColor(e.target.value);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBackgroundAccent((v) => !v)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-800 transition-colors"
                title="Toggle the colored background accent behind the text"
              >
                {showBackgroundAccent ? 'Remove Background' : 'Add Background'}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStyleSeed(Date.now())}
                disabled={isGenerating || !image}
                className="h-12 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Generate a different layout/style"
              >
                Refresh
              </button>

              <button
                onClick={() => handleGenerate({ showToast: true })}
                disabled={isGenerating || !image}
                className="h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="flex-1 bg-gray-50/50 p-8 flex items-center justify-center relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
            {imagePreview ? (
              <div className="relative w-full max-w-[620px] aspect-square rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5 bg-white">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient + accent overlays (visual parity with export) */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(${styleParams.gradientAngle}deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.08) 100%)`,
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,${styleParams.vignetteStrength}) 100%)`,
                  }}
                />
                {showBackgroundAccent && (
                  <>
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        width: '82%',
                        height: '48%',
                        background: hexToRgba(backgroundColor, styleParams.accentAlpha),
                        borderRadius: `${styleParams.boxRadius}px`,
                      }}
                    />
                    <div
                      className="absolute left-1/2 top-[26%] -translate-x-1/2 pointer-events-none"
                      style={{
                        width: '82%',
                        height: '10px',
                        background: hexToRgba(backgroundColor, styleParams.accentBarAlpha),
                        borderRadius: '10px',
                      }}
                    />
                  </>
                )}

                {/* On-image editable text overlay */}
                <div className="absolute inset-0 flex items-center justify-center p-10">
                  <div
                    className="w-full max-w-[80%] text-center"
                    style={{ color: textColor }}
                  >
                    <div
                      ref={headingRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        const next = (e.currentTarget.textContent || '').replace(/\s+/g, ' ').trim();
                        setText(next);
                        scheduleRegenerate();
                      }}
                      className="outline-none font-black tracking-tight leading-[1.05] text-[44px] sm:text-[56px] md:text-[64px]"
                      style={{
                        textShadow: '0 12px 28px rgba(0,0,0,0.45)',
                      }}
                    >
                      {text || 'Your Text Here'}
                    </div>

                    <div
                      ref={subheadingRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        const next = (e.currentTarget.textContent || '').replace(/\s+/g, ' ').trim();
                        setSubheading(next);
                        scheduleRegenerate();
                      }}
                      className="outline-none mt-4 text-[14px] sm:text-[16px] md:text-[18px] font-semibold text-white/90"
                      style={{
                        textShadow: '0 10px 24px rgba(0,0,0,0.45)',
                      }}
                    >
                      {subheading || ''}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-gray-100 flex items-center justify-center mx-auto mb-6 transform rotate-3 transition-transform hover:rotate-6 duration-500">
                  <ImageIcon className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Your masterpiece awaits</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Upload an image to start.
                </p>
              </div>
            )}

            {generatedImage && onInsert && (
              <button
                onClick={() => onInsert(generatedImage)}
                className="mt-6 px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-full shadow-lg shadow-gray-200 border border-gray-100 flex items-center gap-2 transition-all hover:-translate-y-1"
              >
                <Check className="w-4 h-4 text-green-500" />
                Use This Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
