import React, { useState } from 'react';
import { Upload, Wand, Loader, Image as ImageIcon, Palette, Type, X } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { useToast } from '../src/components/common/Toast';

interface AIImageBlenderProps {
  isOpen?: boolean;
  onClose?: () => void;
  onInsert?: (imageData: string) => void;
}

export const AIImageBlender: React.FC<AIImageBlenderProps> = ({ isOpen = true, onClose, onInsert }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [text, setText] = useState<string>('Your Text Here');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const toast = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!image) {
      toast?.error('Please upload an image first.');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onloadend = async () => {
      const base64Image = reader.result?.toString().split(',')[1];

      try {
        const { data, error } = await supabase.functions.invoke('ai-image-blender', {
          body: {
            image: base64Image,
            text,
            textColor,
            backgroundColor,
          },
        });

        if (error) {
          throw error;
        }

        // Add proper data URI prefix for image display
        const imageMimeType = image?.type || 'image/png';
        setGeneratedImage(`data:${imageMimeType};base64,${data.image}`);
        toast?.success('Image generated successfully!');
      } catch (error) {
        console.error('Error generating image:', error);
        toast?.error('Failed to generate image. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">AI Image Blender</h2>
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">AI Image Blender</h2>
            <p className="text-muted-foreground">
              Upload an image and add text overlays with custom colors. The AI will blend them for you.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="image-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="rounded-md" />
                <button
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div>
              <label htmlFor="text-overlay" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Type className="h-4 w-4 mr-2" /> Text Overlay
              </label>
              <input
                id="text-overlay"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="text-color" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Palette className="h-4 w-4 mr-2" /> Text Color
                    </label>
                    <input
                        id="text-color"
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-10 px-1 py-1 border border-gray-200 rounded-lg"
                    />
                </div>
                <div>
                    <label htmlFor="bg-color" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Palette className="h-4 w-4 mr-2" /> Background Color
                    </label>
                    <input
                        id="bg-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-full h-10 px-1 py-1 border border-gray-200 rounded-lg"
                    />
                </div>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !image}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>
        </div>
        <div className="flex items-center justify-center bg-gray-100 rounded-lg">
          {generatedImage ? (
            <div className="space-y-4">
              <img src={generatedImage} alt="Generated" className="rounded-md max-h-full max-w-full" />
              {onInsert && (
                <button
                  onClick={() => onInsert(generatedImage)}
                  className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Insert Image
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <ImageIcon className="mx-auto h-12 w-12" />
              <p>Your generated image will appear here</p>
            </div>
          )}
        </div>
      </div>
      </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
