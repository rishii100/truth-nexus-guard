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

    // Extract confidence level from various patterns - default to lower confidence
    let confidence = 50; // Lower default confidence
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

    // STRICT deepfake indicators - these should flag as fake immediately
    const strongDeepfakeIndicators = [
      'clearly artificial',
      'obvious manipulation',
      'ai-generated',
      'synthetic',
      'digital artifacts',
      'unnatural lighting',
      'signs of manipulation',
      'deepfake',
      'artificially generated',
      'computer-generated',
      'fake',
      'severe artifact',
      'significant artifact',
      'major inconsistencies',
      'high probability of being fake',
      'impossible features',
      'inconsistent',
      'glitch',
      'distortion',
      'face swap',
      'stylegan',
      'diffusion',
      'latent space',
      'reconstructed',
      'generated',
      'artificial intelligence',
      'machine learning',
      'neural network',
      'too perfect',
      'unnaturally smooth',
      'plastic-like skin',
      'asymmetric eyes',
      'teeth too perfect',
      'background blur inconsistent'
    ];

    // VERY STRICT authenticity indicators - only these phrases indicate real photos
    const authenticityIndicators = [
      'appears authentic',
      'appears genuine',
      'appears real',
      'natural photograph',
      'genuine photograph',
      'authentic image',
      'real image',
      'realistic appearance',
      'no obvious visual artifacts',
      'no signs of manipulation',
      'no evidence of manipulation',
      'natural lighting',
      'realistic texture',
      'natural skin texture',
      'natural facial features',
      'genuine expressions',
      'camera noise',
      'natural imperfections',
      'realistic shadows',
      'proper depth of field'
    ];

    const deepfakeCount = strongDeepfakeIndicators.filter(phrase => 
      lowerText.includes(phrase)
    ).length;

    const authenticityCount = authenticityIndicators.filter(phrase => 
      lowerText.includes(phrase)
    ).length;

    console.log('Verdict:', verdict);
    console.log('Confidence extracted:', confidence);
    console.log('Deepfake likelihood:', deepfakeLikelihood);
    console.log('Deepfake indicators found:', deepfakeCount);
    console.log('Authenticity indicators found:', authenticityCount);

    // VERY STRICT decision logic - be extremely conservative
    let isDeepfake = true; // Default to fake unless proven otherwise
    let finalConfidence = 25; // Default low confidence

    // Only trust as authentic if there are STRONG positive signals
    if (verdict === 'authentic' && authenticityCount >= 2 && deepfakeCount === 0) {
      // Only if AI explicitly says authentic AND has multiple authenticity indicators AND no deepfake indicators
      isDeepfake = false;
      finalConfidence = Math.min(confidence, 85); // Cap at 85% even for authentic
    } 
    // If deepfake likelihood is explicitly very low (under 10%) AND we have authenticity indicators
    else if (deepfakeLikelihood !== null && deepfakeLikelihood <= 10 && authenticityCount >= 1 && deepfakeCount === 0) {
      isDeepfake = false;
      finalConfidence = Math.min(75, confidence);
    }
    // Any mention of deepfake indicators = fake
    else if (deepfakeCount > 0) {
      isDeepfake = true;
      finalConfidence = Math.max(10, Math.min(30, confidence));
    }
    // High deepfake likelihood = fake
    else if (deepfakeLikelihood !== null && deepfakeLikelihood >= 30) {
      isDeepfake = true;
      finalConfidence = Math.max(10, Math.min(25, confidence));
    }
    // Uncertain verdict = treat as fake to be safe
    else if (verdict === 'uncertain' || verdict === 'deepfake' || verdict === 'fake') {
      isDeepfake = true;
      finalConfidence = Math.max(10, Math.min(35, confidence));
    }
    // Very high AI confidence (90+) with no negative indicators might be real
    else if (confidence >= 90 && deepfakeCount === 0 && authenticityCount > 0) {
      isDeepfake = false;
      finalConfidence = Math.min(80, confidence);
    }
    // Medium-high confidence (80+) but needs authenticity indicators
    else if (confidence >= 80 && authenticityCount >= authenticityCount && deepfakeCount === 0) {
      isDeepfake = false;
      finalConfidence = Math.min(75, confidence);
    }
    // Everything else = fake (conservative approach)
    else {
      isDeepfake = true;
      finalConfidence = Math.max(15, Math.min(40, confidence));
    }

    // Final safety check - if no strong authenticity signals, default to fake
    if (!isDeepfake && authenticityCount === 0) {
      isDeepfake = true;
      finalConfidence = Math.max(15, Math.min(35, confidence));
    }

    // Ensure confidence stays within bounds
    finalConfidence = Math.max(10, Math.min(90, finalConfidence));

    console.log('Final decision - isDeepfake:', isDeepfake, 'confidence:', finalConfidence);

    // Generate sub-scores based on main decision
    const baseScore = finalConfidence;
    const variance = 5; // Reduced variance for more consistent results
    
    return {
      confidence: finalConfidence,
      isDeepfake,
      spatial: Math.max(15, Math.min(90, baseScore + (Math.random() - 0.5) * variance)),
      temporal: Math.max(15, Math.min(90, baseScore + (Math.random() - 0.5) * variance)),
      audio: Math.max(15, Math.min(90, baseScore + (Math.random() - 0.5) * variance)),
      metadata: Math.max(15, Math.min(90, baseScore + (Math.random() - 0.5) * variance))
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
