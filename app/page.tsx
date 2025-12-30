'use client';

import { useState, useRef } from 'react';

type MediaType = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video';
type AspectRatio = '1:1' | '16:9' | '9:16';
type MotionStrength = 'low' | 'medium' | 'high';
type SceneCount = 'single' | 'multi';
type VideoDuration = 10 | 20 | 30 | 40 | 50 | 60;

export default function Home() {
  const [mediaType, setMediaType] = useState<MediaType>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [motionStrength, setMotionStrength] = useState<MotionStrength>('medium');
  const [sceneCount, setSceneCount] = useState<SceneCount>('single');
  const [characterConsistency, setCharacterConsistency] = useState(true);
  const [loopable, setLoopable] = useState(false);
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(30);
  const [style, setStyle] = useState('realistic');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType,
          prompt,
          aspectRatio,
          motionStrength,
          sceneCount,
          characterConsistency,
          loopable,
          videoDuration,
          style,
          sourceImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const isVideoMode = mediaType === 'text-to-video' || mediaType === 'image-to-video';
  const needsImage = mediaType === 'image-to-image' || mediaType === 'image-to-video';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Creative Media Generator
        </h1>
        <p className="text-center text-gray-400 mb-8">AI-powered image and video creation</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-gray-700">
            <div className="space-y-6">
              {/* Media Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Generation Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'text-to-image', label: 'Text → Image' },
                    { value: 'image-to-image', label: 'Image → Image' },
                    { value: 'text-to-video', label: 'Text → Video' },
                    { value: 'image-to-video', label: 'Image → Video' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setMediaType(type.value as MediaType)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        mediaType === type.value
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              {needsImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Source Image
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  >
                    {sourceImage ? (
                      <img
                        src={sourceImage}
                        alt="Source"
                        className="max-h-40 mx-auto rounded-lg"
                      />
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">📁</div>
                        <p className="text-gray-400">Click to upload image</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {needsImage ? 'Modification Prompt (Optional)' : 'Prompt'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="realistic">Realistic</option>
                  <option value="anime">Anime</option>
                  <option value="2d">2D Art</option>
                  <option value="3d">3D Render</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="oil-painting">Oil Painting</option>
                  <option value="watercolor">Watercolor</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        aspectRatio === ratio
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Options */}
              {isVideoMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Video Duration (seconds)
                    </label>
                    <select
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(Number(e.target.value) as VideoDuration)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={10}>10 seconds</option>
                      <option value={20}>20 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={40}>40 seconds</option>
                      <option value={50}>50 seconds</option>
                      <option value={60}>60 seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Motion Strength
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['low', 'medium', 'high'] as MotionStrength[]).map((strength) => (
                        <button
                          key={strength}
                          onClick={() => setMotionStrength(strength)}
                          className={`px-4 py-3 rounded-lg font-medium capitalize transition-all ${
                            motionStrength === strength
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {strength}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Scene Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['single', 'multi'] as SceneCount[]).map((scene) => (
                        <button
                          key={scene}
                          onClick={() => setSceneCount(scene)}
                          className={`px-4 py-3 rounded-lg font-medium transition-all ${
                            sceneCount === scene
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {scene === 'single' ? 'Single Scene' : 'Multi-Scene'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={characterConsistency}
                        onChange={(e) => setCharacterConsistency(e.target.checked)}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-300">Character Consistency</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loopable}
                        onChange={(e) => setLoopable(e.target.checked)}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-300">Loopable Video</span>
                    </label>
                  </div>
                </>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt || (needsImage && !sourceImage)}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Result */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">Output</h2>
            <div className="flex items-center justify-center min-h-[500px] bg-gray-900/50 rounded-lg">
              {isGenerating ? (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Creating your {isVideoMode ? 'video' : 'image'}...</p>
                </div>
              ) : error ? (
                <div className="text-center p-6">
                  <div className="text-5xl mb-4">⚠️</div>
                  <p className="text-red-400">{error}</p>
                </div>
              ) : result ? (
                <div className="w-full">
                  {isVideoMode ? (
                    <video
                      src={result}
                      controls
                      autoPlay
                      loop={loopable}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <img
                      src={result}
                      alt="Generated"
                      className="w-full rounded-lg"
                    />
                  )}
                  <a
                    href={result}
                    download
                    className="mt-4 block w-full py-3 bg-gray-700 text-white rounded-lg text-center hover:bg-gray-600 transition-colors"
                  >
                    Download {isVideoMode ? 'Video' : 'Image'}
                  </a>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">✨</div>
                  <p>Your creation will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
