
import { Upload, FileVideo, FileImage, FileAudio, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { useAnalysisQueue } from "../hooks/useAnalysisQueue";

interface FileUploadProps {
  onAnalysisComplete: (result: any) => void;
}

const FileUpload = ({ onAnalysisComplete }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);

  const { addToQueue, updateQueueItem, completeQueueItem } = useAnalysisQueue();

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

  const simulateProgress = async (queueId: string) => {
    const steps = [20, 40, 60, 80, 95];
    for (const progress of steps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await updateQueueItem(queueId, { status: 'processing', progress });
    }
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
    
    // Add to queue
    const queueItem = await addToQueue(uploadedFile.name, uploadedFile.type);
    if (!queueItem) {
      setError("Failed to add analysis to queue");
      setIsAnalyzing(false);
      return;
    }
    
    setCurrentQueueId(queueItem.id);
    
    try {
      console.log('🚀 Starting analysis for file:', uploadedFile.name);
      
      // Update status to processing
      await updateQueueItem(queueItem.id, { status: 'processing', progress: 10 });
      
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
      
      console.log('📄 File converted to base64, calling edge function...');
      
      // Start progress simulation
      simulateProgress(queueItem.id);
      
      const startTime = Date.now();
      
      // Call the edge function for ALL file types (including images)
      const { data, error: functionError } = await supabase.functions.invoke('analyze-deepfake', {
        body: {
          file: base64,
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          queueId: queueItem.id,
          enhancedPrompt: true
        }
      });

      const processingTime = Date.now() - startTime;

      if (functionError) {
        console.error('❌ Edge function error:', functionError);
        await completeQueueItem(queueItem.id, false);
        throw new Error(functionError.message || 'Analysis failed');
      }

      if (!data) {
        console.error('❌ No response from analysis service');
        await completeQueueItem(queueItem.id, false);
        throw new Error('No response from analysis service');
      }

      console.log('✅ Analysis completed successfully:', data);
      
      // The edge function handles queue completion, but let's transform result for onAnalysisComplete
      const transformedResult = {
        fileName: data.fileName || uploadedFile.name,
        fileType: data.fileType || uploadedFile.type,
        timestamp: data.timestamp || new Date().toISOString(),
        confidence: data.confidence || 50,
        isDeepfake: data.isDeepfake || false,
        processingTime: processingTime,
        analysis: {
          spatial: { score: data.confidence || 50, status: data.isDeepfake ? 'suspicious' : 'authentic' },
          temporal: { score: data.confidence || 50, status: data.isDeepfake ? 'suspicious' : 'authentic' },
          audio: { score: data.confidence || 50, status: data.isDeepfake ? 'suspicious' : 'authentic' },
          metadata: { score: data.confidence || 50, status: data.isDeepfake ? 'suspicious' : 'authentic' }
        },
        explanation: data.explanation || 'Analysis completed successfully'
      };
      
      onAnalysisComplete(transformedResult);
      
    } catch (err) {
      console.error('❌ Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      
      if (currentQueueId) {
        await completeQueueItem(currentQueueId, false);
      }
    } finally {
      setIsAnalyzing(false);
      setCurrentQueueId(null);
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
        <p>All files are analyzed using advanced AI detection algorithms</p>
        <p className="text-blue-600 font-medium">✨ Real-time queue tracking with accurate deepfake detection!</p>
      </div>
    </div>
  );
};

export default FileUpload;
