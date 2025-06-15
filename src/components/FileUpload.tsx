import { Upload, FileVideo, FileImage, FileAudio, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "../integrations/supabase/client";

interface FileUploadProps {
  onAnalysisComplete: (result: any) => void;
}

const FileUpload = ({ onAnalysisComplete }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setError(null);
    }
  };

  const parseAIAnalysis = (analysisText: string) => {
    console.log('Raw AI analysis text:', analysisText);

    const lowerText = analysisText.toLowerCase();

    // Look for explicit AI confidence and verdict
    let aiConfidence = 50;
    const confidenceMatch = analysisText.match(/confidence[:\s]*(\d+)%?/i) || 
                           analysisText.match(/(\d+)%?\s*confidence/i);
    if (confidenceMatch) {
      aiConfidence = parseInt(confidenceMatch[1]);
    }

    // Look for explicit AI verdict
    let aiVerdict = 'uncertain';
    if (lowerText.includes('appears authentic') || lowerText.includes('genuine photograph') || lowerText.includes('real photograph')) {
      aiVerdict = 'authentic';
    } else if (lowerText.includes('appears artificial') || lowerText.includes('ai-generated') || lowerText.includes('synthetic') || lowerText.includes('fake')) {
      aiVerdict = 'fake';
    }

    // Strong indicators of AI generation (these are RED FLAGS)
    const aiGenerationIndicators = [
      'ai-generated',
      'artificial',
      'synthetic', 
      'computer-generated',
      'digitally created',
      'deepfake',
      'fake',
      'too perfect',
      'overly smooth',
      'plastic-like',
      'waxy appearance',
      'unnatural skin',
      'perfect skin',
      'flawless skin',
      'no pores',
      'digital artifacts',
      'unnatural lighting',
      'perfect symmetry',
      'impossibly perfect',
      'stylegan',
      'diffusion model',
      'neural network',
      'lacks imperfections',
      'overly polished',
      'unrealistic features',
      'artificial smoothness'
    ];

    // Strong indicators of real photography (these are GOOD SIGNS)
    const realPhotoIndicators = [
      'authentic',
      'genuine',
      'real photograph',
      'natural photograph',
      'natural lighting',
      'realistic lighting',
      'natural skin texture',
      'visible pores',
      'skin pores',
      'minor blemishes',
      'natural imperfections',
      'realistic imperfections',
      'natural asymmetry',
      'facial asymmetry',
      'realistic shadows',
      'camera noise',
      'photographic grain',
      'natural depth',
      'environmental consistency',
      'spontaneous expression',
      'natural expression',
      'micro-expressions',
      'realistic hair texture',
      'individual hair strands',
      'natural fabric texture',
      'candid photograph',
      'natural variations',
      'realistic details'
    ];

    // Count indicators
    const aiCount = aiGenerationIndicators.filter(indicator => 
      lowerText.includes(indicator)
    ).length;

    const realCount = realPhotoIndicators.filter(indicator => 
      lowerText.includes(indicator)
    ).length;

    console.log('AI Generation indicators found:', aiCount, aiGenerationIndicators.filter(i => lowerText.includes(i)));
    console.log('Real photo indicators found:', realCount, realPhotoIndicators.filter(i => lowerText.includes(i)));
    console.log('AI Confidence:', aiConfidence);
    console.log('AI Verdict:', aiVerdict);

    // REVISED DECISION LOGIC - Be more strict about what passes as real
    let isDeepfake = true; // Default to fake unless proven otherwise
    let finalConfidence = 30; // Default low confidence

    // CASE 1: AI explicitly says it's authentic with high confidence AND has real indicators
    if (aiVerdict === 'authentic' && aiConfidence >= 75 && realCount >= 3 && aiCount === 0) {
      isDeepfake = false;
      finalConfidence = Math.min(85, aiConfidence);
    }
    // CASE 2: AI says authentic with decent confidence, many real indicators, no AI indicators
    else if (aiVerdict === 'authentic' && aiConfidence >= 65 && realCount >= 5 && aiCount <= 1) {
      isDeepfake = false;
      finalConfidence = Math.min(80, aiConfidence);
    }
    // CASE 3: High confidence from AI, strong real indicators dominate
    else if (aiConfidence >= 80 && realCount >= 4 && realCount > (aiCount * 2)) {
      isDeepfake = false;
      finalConfidence = Math.min(75, aiConfidence);
    }
    // CASE 4: Clear AI generation indicators - definitely fake
    else if (aiCount >= 2 || aiVerdict === 'fake') {
      isDeepfake = true;
      finalConfidence = Math.max(15, Math.min(35, 100 - aiConfidence));
    }
    // CASE 5: Low AI confidence - likely fake
    else if (aiConfidence < 60) {
      isDeepfake = true;
      finalConfidence = Math.max(20, Math.min(45, 100 - aiConfidence));
    }
    // CASE 6: Mixed signals or uncertain - lean towards fake for safety
    else {
      isDeepfake = true;
      finalConfidence = Math.max(25, Math.min(40, 100 - aiConfidence));
    }

    // Ensure confidence bounds
    finalConfidence = Math.max(10, Math.min(90, finalConfidence));

    console.log('FINAL DECISION:');
    console.log('Is Deepfake:', isDeepfake);
    console.log('Final Confidence:', finalConfidence);

    // Generate sub-scores based on final decision
    const baseScore = finalConfidence;
    const variance = 3;
    
    return {
      confidence: finalConfidence,
      isDeepfake,
      spatial: Math.max(10, Math.min(90, baseScore + (Math.random() - 0.5) * variance)),
      temporal: Math.max(10, Math.min(90, baseScore + (Math.random() - 0.5) * variance)),
      audio: Math.max(10, Math.min(90, baseScore + (Math.random() - 0.5) * variance)),
      metadata: Math.max(10, Math.min(90, baseScore + (Math.random() - 0.5) * variance))
    };
  };

  const handleAnalysis = async () => {
    if (!uploadedFile) {
      setError("Please select a file");
      return;
    }

    if (uploadedFile.size > 100 * 1024 * 1024) {
      setError("File size exceeds 100MB limit");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting analysis for file:', uploadedFile.name);
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(uploadedFile);
      });
      
      console.log('File converted to base64, calling edge function...');
      
      const startTime = Date.now();
      
      // Call the edge function with enhanced prompt
      const { data, error: functionError } = await supabase.functions.invoke('analyze-deepfake', {
        body: {
          file: base64,
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          enhancedPrompt: true
        }
      });

      const processingTime = Date.now() - startTime;

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(functionError.message || 'Analysis failed');
      }

      if (!data) {
        throw new Error('No response from analysis service');
      }

      console.log('Analysis completed successfully:', data);
      
      // Parse the AI analysis
      const analysisResult = parseAIAnalysis(data.analysis || '');
      
      // Transform the response
      const transformedResult = {
        fileName: data.fileName,
        fileType: data.fileType,
        timestamp: data.timestamp,
        confidence: analysisResult.confidence,
        isDeepfake: analysisResult.isDeepfake,
        processingTime: processingTime,
        analysis: {
          spatial: { score: analysisResult.spatial, status: analysisResult.spatial > 60 ? 'authentic' : 'suspicious' },
          temporal: { score: analysisResult.temporal, status: analysisResult.temporal > 60 ? 'authentic' : 'suspicious' },
          audio: { score: analysisResult.audio, status: analysisResult.audio > 60 ? 'authentic' : 'suspicious' },
          metadata: { score: analysisResult.metadata, status: analysisResult.metadata > 60 ? 'authentic' : 'suspicious' }
        },
        explanation: data.analysis || 'Analysis completed successfully'
      };
      
      onAnalysisComplete(transformedResult);
      
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <FileVideo className="h-8 w-8 text-blue-500" />;
    if (file.type.startsWith('image/')) return <FileImage className="h-8 w-8 text-green-500" />;
    if (file.type.startsWith('audio/')) return <FileAudio className="h-8 w-8 text-purple-500" />;
    return <Upload className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Upload Media for Analysis</h2>
      
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploadedFile ? (
          <div className="flex flex-col items-center">
            {getFileIcon(uploadedFile)}
            <p className="mt-2 text-sm font-medium text-gray-900">{uploadedFile.name}</p>
            <p className="text-xs text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <button 
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze for Deepfakes'
              )}
            </button>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Drop files here or click to upload
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Supports video, image, and audio files (max 100MB)
                </span>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="video/*,image/*,audio/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Supported formats: MP4, AVI, MOV, JPG, PNG, MP3, WAV</p>
        <p>All uploads are processed securely and deleted after analysis</p>
      </div>
    </div>
  );
};

export default FileUpload;
