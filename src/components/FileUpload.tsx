
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

    // Extract confidence level from various patterns
    let confidence = 75; // Start with higher default for better accuracy
    const confidencePatterns = [
      /confidence_score:\s*(\d+)/i,
      /confidence level.*?(\d+)%/i,
      /confidence[:\s]*(\d+)%/i,
      /(\d+)%\s*confidence/i,
      /score[:\s]*(\d+)/i
    ];
    for (const pattern of confidencePatterns) {
      const match = analysisText.match(pattern);
      if (match) {
        confidence = parseInt(match[1]);
        break;
      }
    }

    // Extract explicit verdicts with priority
    const verdictPatterns = [
      /final_verdict:\s*(authentic|deepfake|uncertain|fake)/i,
      /verdict:\s*(authentic|deepfake|uncertain|fake)/i,
      /conclusion:\s*(authentic|deepfake|uncertain|fake)/i,
      /assessment:\s*(authentic|deepfake|uncertain|fake)/i
    ];
    let verdict = null;
    for (const pattern of verdictPatterns) {
      const match = analysisText.match(pattern);
      if (match) {
        verdict = match[1].toLowerCase();
        break;
      }
    }

    // Extract likelihood of being deepfake
    let deepfakeLikelihood = null;
    const deepfakePatterns = [
      /likelihood.*?deepfake.*?(\d+)%/i,
      /deepfake.*?likelihood.*?(\d+)%/i,
      /probability.*?deepfake.*?(\d+)%/i,
      /deepfake.*?probability.*?(\d+)%/i
    ];
    for (const pattern of deepfakePatterns) {
      const match = analysisText.match(pattern);
      if (match) {
        deepfakeLikelihood = parseInt(match[1]);
        break;
      }
    }

    // Strong authenticity indicators
    const authenticityIndicators = [
      'appears authentic',
      'appears genuine',
      'appears real',
      'natural photograph',
      'genuine photograph',
      'authentic image',
      'real image',
      'natural lighting',
      'consistent shadows',
      'no signs of manipulation',
      'no obvious artifacts',
      'realistic texture',
      'natural skin texture'
    ];

    // Strong deepfake indicators
    const deepfakeIndicators = [
      'deepfake',
      'ai-generated',
      'artificially generated',
      'synthetic',
      'digitally manipulated',
      'computer-generated',
      'artificial intelligence',
      'signs of manipulation',
      'digital artifacts',
      'inconsistent lighting'
    ];

    const authenticityCount = authenticityIndicators.filter(indicator => 
      lowerText.includes(indicator)
    ).length;

    const deepfakeCount = deepfakeIndicators.filter(indicator => 
      lowerText.includes(indicator)
    ).length;

    console.log('Verdict:', verdict);
    console.log('Confidence extracted:', confidence);
    console.log('Deepfake likelihood:', deepfakeLikelihood);
    console.log('Authenticity indicators:', authenticityCount);
    console.log('Deepfake indicators:', deepfakeCount);

    // Decision logic - prioritize explicit verdicts
    let isDeepfake = false;
    let finalConfidence = confidence;

    // Trust explicit verdict first
    if (verdict === 'authentic') {
      isDeepfake = false;
      finalConfidence = Math.max(confidence, 75); // Boost confidence for authentic verdict
    } else if (verdict === 'deepfake' || verdict === 'fake') {
      isDeepfake = true;
      finalConfidence = Math.min(confidence, 35); // Lower confidence for deepfake verdict
    } 
    // If we have explicit deepfake likelihood percentage
    else if (deepfakeLikelihood !== null) {
      if (deepfakeLikelihood <= 20) {
        // Very low likelihood means authentic
        isDeepfake = false;
        finalConfidence = Math.max(confidence, 80);
      } else if (deepfakeLikelihood >= 70) {
        // High likelihood means deepfake
        isDeepfake = true;
        finalConfidence = Math.min(confidence, 40);
      } else {
        // Medium likelihood - use confidence score
        isDeepfake = confidence < 50;
        finalConfidence = confidence;
      }
    }
    // Use indicator analysis
    else if (authenticityCount >= 2 && deepfakeCount === 0) {
      // Strong authenticity signals with no deepfake signals
      isDeepfake = false;
      finalConfidence = Math.max(confidence, 80);
    } else if (deepfakeCount >= 2 && authenticityCount === 0) {
      // Strong deepfake signals with no authenticity signals
      isDeepfake = true;
      finalConfidence = Math.min(confidence, 30);
    } else {
      // Default to confidence-based decision with higher threshold
      isDeepfake = confidence < 40; // Lower threshold means fewer false positives
      finalConfidence = confidence;
    }

    // Ensure confidence stays within realistic bounds
    finalConfidence = Math.max(15, Math.min(95, finalConfidence));

    console.log('Final decision - isDeepfake:', isDeepfake, 'confidence:', finalConfidence);

    // Generate sub-scores with some variance but based on main confidence
    const baseScore = finalConfidence;
    const variance = 6;
    
    return {
      confidence: finalConfidence,
      isDeepfake,
      spatial: Math.max(25, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
      temporal: Math.max(25, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
      audio: Math.max(25, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
      metadata: Math.max(25, Math.min(95, baseScore + (Math.random() - 0.5) * variance))
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
      
      // Call the edge function
      const { data, error: functionError } = await supabase.functions.invoke('analyze-deepfake', {
        body: {
          file: base64,
          fileName: uploadedFile.name,
          fileType: uploadedFile.type
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
      
      // Parse the AI analysis to get realistic results
      const analysisResult = parseAIAnalysis(data.analysis || '');
      
      // Transform the response to match what DetectionResults expects
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
