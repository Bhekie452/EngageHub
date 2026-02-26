import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Loader,
  Copy,
  RefreshCw,
  Check,
  AlertCircle,
  Zap,
  ArrowRight,
  Flame,
  Diamond,
  TrendingUp,
  Image,
  Edit3,
  Upload,
  Globe,
  ImagePlus,
  XCircle,
} from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { useToast } from '../src/components/common/Toast';
import { AIImageBlender } from './AIImageBlender';

interface AIContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  selectedPlatforms: string[];
  currentContent?: string;
}

interface GeneratedContent {
  index: number;
  title: string;
  content: string;
  copied: boolean;
  isRefining?: boolean;
}

// New interface for Image Text variations
interface ImageTextVariation {
  id: number;
  text: string;
  style: 'bold' | 'minimal' | 'quote' | 'question' | 'statement';
  fontSize: 'small' | 'medium' | 'large';
  position: 'center' | 'top' | 'bottom';
}

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  isOpen,
  onClose,
  onInsert,
  selectedPlatforms,
  currentContent = '',
}) => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('Post');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('Engaging');
  const [cta, setCta] = useState('');
  const [maxWords, setMaxWords] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refiningVariationIndex, setRefiningVariationIndex] = useState<number | null>(null);
  const [imageTextVariations, setImageTextVariations] = useState<ImageTextVariation[]>([]);
  const [regeneratingImageTextIndex, setRegeneratingImageTextIndex] = useState<number | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('rgba(0,0,0,0.5)');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();

  const contentTypes = ['Post', 'Caption', 'Ad Copy', 'Description', 'Story', 'Image Text', 'AI Image'];
  const tones = ['Engaging', 'Professional', 'Funny', 'Emotional', 'Bold', 'Luxury'];
  const primaryPlatform =
    selectedPlatforms.length > 0
      ? selectedPlatforms[0]
      : 'Multi-Platform';

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVariations([]);

    try {
      const { data, error: invocationError } = await supabase.functions.invoke(
        'ai-content-generator',
        {
          body: {
            platform: primaryPlatform,
            contentType,
            topic,
            audience: audience || 'General audience',
            tone,
            cta: cta || 'Not specified',
            maxWords: maxWords || null,
            currentContent,
          },
        }
      );

      if (invocationError) {
        throw invocationError;
      }

      // Parse the response and extract variations
      const responseText = data?.result || '';
      const variations = parseVariations(responseText);
      setGeneratedVariations(variations);

      if (variations.length === 0) {
        setError('Could not parse variations. Please try again.');
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate content. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const parseVariations = (text: string): GeneratedContent[] => {
    // Split by "Variation X" pattern
    const parts = text.split(/Variation\s+\d+\s*[:\-]?/i).filter((p) => p.trim());

    return parts.slice(0, 3).map((content, index) => ({
      index: index + 1,
      title: `Variation ${index + 1}`,
      content: content.trim(),
      copied: false,
    }));
  };

  const handleCopy = (index: number) => {
    const variation = generatedVariations[index];
    navigator.clipboard.writeText(variation.content);

    const updated = [...generatedVariations];
    updated[index].copied = true;
    setGeneratedVariations(updated);

    setTimeout(() => {
      const resetVariations = [...generatedVariations];
      resetVariations[index].copied = false;
      setGeneratedVariations(resetVariations);
    }, 2000);
  };

  const handleInsert = (index: number) => {
    const content = generatedVariations[index].content;
    onInsert(content);
    toast?.success('Content inserted!');
    onClose();
  };

  const handleRegenerate = () => {
    setGeneratedVariations([]);
    handleGenerate();
  };

  const handleRefineVariation = async (
    index: number,
    refinementType: 'shorter' | 'persuasive' | 'luxury' | 'sales'
  ) => {
    const variation = generatedVariations[index];
    setRefiningVariationIndex(index);

    const refinementPrompts = {
      shorter: 'Make this version significantly shorter while keeping the core message and impact. Aim for 50% shorter.',
      persuasive: 'Rewrite this to be more persuasive and compelling. Add urgency and curiosity. Make it impossible to ignore.',
      luxury: 'Rewrite this with a premium, luxury tone. Make it feel exclusive, sophisticated, and high-end.',
      sales: 'Rewrite this to be more sales-focused and conversion-oriented. Include a stronger call-to-action and create desire.',
    };

    try {
      const { data, error: invocationError } = await supabase.functions.invoke(
        'ai-content-refiner',
        {
          body: {
            platform: primaryPlatform,
            currentContent: variation.content,
            refinementType,
            refinementPrompt: refinementPrompts[refinementType],
          },
        }
      );

      if (invocationError) throw invocationError;

      const refinedContent = data?.result || variation.content;

      // Update the specific variation
      const updated = [...generatedVariations];
      updated[index] = {
        ...updated[index],
        content: refinedContent,
        copied: false,
      };
      setGeneratedVariations(updated);
      toast?.success(`Content refined: ${refinementType}`);
    } catch (err) {
      console.error('Error refining content:', err);
      toast?.error('Failed to refine content');
    } finally {
      setRefiningVariationIndex(null);
    }
  };

  // Handle generating image text variations
  const handleGenerateImageText = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: invocationError } = await supabase.functions.invoke(
        'ai-content-generator',
        {
          body: {
            platform: primaryPlatform,
            contentType: 'Image Text',
            topic,
            audience: audience || 'General audience',
            tone,
            cta: cta || 'Not specified',
            maxWords: maxWords || null,
            currentContent,
            websiteUrl: websiteUrl || null,
          },
        }
      );

      if (invocationError) {
        throw invocationError;
      }

      // Parse the response for image text suggestions
      const responseText = data?.result || '';
      const variations = parseImageTextVariations(responseText);
      setImageTextVariations(variations);

      if (variations.length === 0) {
        setError('Could not generate image text. Please try again.');
      }
    } catch (err) {
      console.error('Error generating image text:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image text. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Parse AI response into image text variations
  const parseImageTextVariations = (text: string): ImageTextVariation[] => {
    const styles: Array<'bold' | 'minimal' | 'quote' | 'question' | 'statement'> = ['bold', 'minimal', 'quote', 'question', 'statement'];
    const variations: ImageTextVariation[] = [];
    
    // Split by numbered items or line breaks
    const lines = text.split(/\n+/).filter(line => line.trim().length > 5);
    
    lines.slice(0, 5).forEach((line, index) => {
      variations.push({
        id: index + 1,
        text: line.trim().slice(0, 100), // Limit text length
        style: styles[index % styles.length],
        fontSize: index < 2 ? 'large' : index < 4 ? 'medium' : 'small',
        position: index % 3 === 0 ? 'center' : index % 3 === 1 ? 'top' : 'bottom',
      });
    });

    return variations;
  };

  // Handle regenerating a single image text variation
  const handleRegenerateImageText = async (index: number) => {
    setRegeneratingImageTextIndex(index);

    try {
      const { data, error: invocationError } = await supabase.functions.invoke(
        'ai-content-generator',
        {
          body: {
            platform: primaryPlatform,
            contentType: 'Image Text Regenerate',
            topic,
            existingText: imageTextVariations[index]?.text || '',
            variationIndex: index,
          },
        }
      );

      if (invocationError) throw invocationError;

      const newText = data?.result?.trim() || imageTextVariations[index]?.text || '';
      
      const updated = [...imageTextVariations];
      updated[index] = {
        ...updated[index],
        text: newText.slice(0, 100),
      };
      setImageTextVariations(updated);
      toast?.success('Text regenerated!');
    } catch (err) {
      console.error('Error regenerating image text:', err);
      toast?.error('Failed to regenerate text');
    } finally {
      setRegeneratingImageTextIndex(null);
    }
  };

  // Handle updating image text manually
  const handleUpdateImageText = (index: number, newText: string) => {
    const updated = [...imageTextVariations];
    updated[index] = {
      ...updated[index],
      text: newText,
    };
    setImageTextVariations(updated);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setUploadedImage(previewUrl);
      toast?.success('Image attached!');
    } catch (err) {
      console.error('Error uploading image:', err);
      toast?.error('Failed to attach image');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
    }
    setUploadedImage(null);
  };

  // Download image with text overlay using Canvas API (client-side)
  const handleDownloadImage = async (text: string, position: 'top' | 'center' | 'bottom') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 630;

    try {
      if (uploadedImage) {
        // Load uploaded image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = uploadedImage;
        });

        // Draw image scaled to cover canvas
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgRatio > canvasRatio) {
          sw = img.height * canvasRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / canvasRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      } else {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#d946ef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Add overlay
      ctx.fillStyle = backgroundColor;
      if (position === 'top') {
        ctx.fillRect(0, 0, canvas.width, 120);
      } else if (position === 'bottom') {
        ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
      } else {
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Configure text
      const fontSize = 56;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

      // Add text shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Calculate position
      let y: number;
      if (position === 'top') y = 60;
      else if (position === 'bottom') y = canvas.height - 60;
      else y = canvas.height / 2;

      // Word wrap
      const maxWidth = canvas.width - 100;
      const words = text.split(' ');
      let line = '';
      const lines: string[] = [];

      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      // Draw text lines
      const lineHeight = fontSize * 1.3;
      const startY = y - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), canvas.width / 2, startY + (i * lineHeight));
      });

      // Download
      const link = document.createElement('a');
      link.download = `image-text-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast?.success('Image downloaded!');
    } catch (err) {
      console.error('Error downloading image:', err);
      toast?.error('Failed to download image');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Content Generator</h2>
              <p className="text-xs text-gray-500">
                Powered by Gemini • Optimized for {primaryPlatform}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Form Section - Hide when AI Image is selected */}
          {contentType !== 'AI Image' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Topic / Product Name
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Launch of new AI feature, Summer sale, Blog post..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {tones.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Audience (Optional)
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Tech entrepreneurs, Students, Small business owners..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Call-to-Action (Optional)
              </label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g., Learn more, Sign up now, Get your free trial..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Words (Optional)
              </label>
              <input
                type="number"
                value={maxWords}
                onChange={(e) => setMaxWords(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="e.g., 50, 100, 200..."
                min={10}
                max={2000}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Image Text Options - Show when Image Text is selected */}
            {contentType === 'Image Text' && (
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                    <ImagePlus size={16} />
                    Image & Company Details (Optional)
                  </h4>
                  
                  {/* Image Upload */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Attach Product/Image
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-all ${
                        uploadedImage ? 'border-purple-400 bg-purple-100' : 'border-gray-300 hover:border-purple-400'
                      }`}>
                        {isUploading ? (
                          <Loader size={16} className="animate-spin text-purple-600" />
                        ) : uploadedImage ? (
                          <>
                            <Image size={16} className="text-purple-600" />
                            <span className="text-sm text-purple-700">Image attached!</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-500">Click to upload image</span>
                          </>
                        )}
                      </div>
                    </div>
                    {uploadedImage && (
                      <div className="mt-2 relative inline-block">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="h-20 w-auto rounded-lg object-cover"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Website URL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Company Website (for AI context)
                    </label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      AI will fetch company info from website to create relevant content
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Generate Button - Hide for Image Text and AI Image */}
          {generatedVariations.length === 0 && contentType !== 'Image Text' && contentType !== 'AI Image' && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Content
                </>
              )}
            </button>
          )}

          {/* Generate Image Text Button */}
          {contentType === 'Image Text' && imageTextVariations.length === 0 && (
            <button
              onClick={handleGenerateImageText}
              disabled={isGenerating || !topic.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating Image Text...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4" />
                  Generate Image Text
                </>
              )}
            </button>
          )}

          {/* Generated Variations - Hide for Image Text and AI Image */}
          {generatedVariations.length > 0 && contentType !== 'Image Text' && contentType !== 'AI Image' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">
                  ✨ Generated Variations ({generatedVariations.length})
                </h3>
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-all"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </button>
              </div>

              {generatedVariations.map((variation, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all space-y-3"
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                      Variation {variation.index}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {variation.content.length} characters
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-5">
                    {variation.content}
                  </p>

                  {/* Refinement Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleRefineVariation(index, 'shorter')}
                      disabled={refiningVariationIndex === index}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Make this version shorter"
                    >
                      {refiningVariationIndex === index ? (
                        <Loader size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      <span>Shorter</span>
                    </button>

                    <button
                      onClick={() => handleRefineVariation(index, 'persuasive')}
                      disabled={refiningVariationIndex === index}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Make this more persuasive"
                    >
                      {refiningVariationIndex === index ? (
                        <Loader size={12} className="animate-spin" />
                      ) : (
                        <Flame size={12} />
                      )}
                      <span>Persuasive</span>
                    </button>

                    <button
                      onClick={() => handleRefineVariation(index, 'luxury')}
                      disabled={refiningVariationIndex === index}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Make this more luxury/premium"
                    >
                      {refiningVariationIndex === index ? (
                        <Loader size={12} className="animate-spin" />
                      ) : (
                        <Diamond size={12} />
                      )}
                      <span>Luxury</span>
                    </button>

                    <button
                      onClick={() => handleRefineVariation(index, 'sales')}
                      disabled={refiningVariationIndex === index}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Make this more sales-focused"
                    >
                      {refiningVariationIndex === index ? (
                        <Loader size={12} className="animate-spin" />
                      ) : (
                        <TrendingUp size={12} />
                      )}
                      <span>Sales</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleCopy(index)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-semibold text-gray-700 transition-all"
                    >
                      {generatedVariations[index].copied ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleInsert(index)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/20 rounded-lg text-xs font-semibold text-white transition-all"
                    >
                      <ArrowRight size={14} />
                      Insert
                    </button>
                  </div>
                </div>
              ))}

              {/* Generate More Button */}
              <button
                onClick={() => setGeneratedVariations([])}
                className="w-full py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-lg text-sm transition-all"
              >
                Generate New Set
              </button>
            </div>
          )}

          {/* Image Text Variations */}
          {imageTextVariations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Image size={16} className="text-purple-500" />
                  Image Text Designs ({imageTextVariations.length})
                </h3>
                <button
                  onClick={handleGenerateImageText}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-all"
                >
                  <RefreshCw size={14} />
                  Generate More
                </button>
              </div>

              {imageTextVariations.map((variation, index) => (
                <div
                  key={variation.id}
                  className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-4 hover:shadow-md transition-all space-y-3"
                >
                  {/* Preview Box */}
                  <div 
                    className={`
                      relative h-32 rounded-lg flex items-center justify-center overflow-hidden
                      ${variation.position === 'center' ? 'items-center' : variation.position === 'top' ? 'items-start' : 'items-end'}
                      ${uploadedImage ? '' : 'bg-gradient-to-br from-gray-800 to-gray-900'}
                    `}
                    style={{
                      padding: variation.position === 'center' ? '2rem' : '1rem',
                      backgroundImage: uploadedImage ? `url(${uploadedImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Overlay for text readability */}
                    {uploadedImage && (
                      <div className="absolute inset-0 bg-black/40" />
                    )}
                    <span 
                      className={`
                        relative z-10 text-white text-center font-bold
                        ${variation.fontSize === 'large' ? 'text-xl' : variation.fontSize === 'medium' ? 'text-lg' : 'text-base'}
                        ${variation.style === 'bold' ? 'font-extrabold' : variation.style === 'minimal' ? 'font-light' : variation.style === 'quote' ? 'italic' : ''}
                        drop-shadow-lg
                      `}
                    >
                      {variation.text}
                    </span>
                    
                    {/* Style indicator */}
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full">
                        {variation.style}
                      </span>
                    </div>
                  </div>

                  {/* Editable Text */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Edit3 size={14} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600">Edit Text</span>
                    </div>
                    <textarea
                      value={variation.text}
                      onChange={(e) => handleUpdateImageText(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={2}
                      placeholder="Enter your text..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerateImageText(index)}
                      disabled={regeneratingImageTextIndex === index}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-purple-200 hover:border-purple-300 rounded-lg text-xs font-semibold text-purple-600 transition-all disabled:opacity-50"
                    >
                      {regeneratingImageTextIndex === index ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Refresh Text
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(variation.text);
                        toast?.success('Text copied to clipboard!');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-semibold text-white transition-all"
                    >
                      <Copy size={14} />
                      Copy Text
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Image Section - Use dedicated AIImageBlender component */}
          {contentType === 'AI Image' && (
            <div className="py-4">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                  <Image size={20} className="text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">AI Image Blender</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload an image and add custom text overlays with AI-powered blending.
                </p>
                <AIImageBlender />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500" />
            <span>Powered by Gemini</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
