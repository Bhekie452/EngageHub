import React, { useState } from 'react';
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
} from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { useToast } from '../src/components/common/Toast';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const contentTypes = ['Post', 'Caption', 'Ad Copy', 'Description', 'Story'];
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
          {/* Form Section */}
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
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          {generatedVariations.length === 0 && (
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

          {/* Generated Variations */}
          {generatedVariations.length > 0 && (
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
