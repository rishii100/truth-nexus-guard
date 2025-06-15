
import { CheckCircle, AlertTriangle, Info, Eye, Clock } from "lucide-react";

interface DetectionResultsProps {
  result: {
    confidence: number;
    isDeepfake: boolean;
    processingTime: number;
    analysis: {
      spatial: { score: number; status: string };
      temporal: { score: number; status: string };
      audio: { score: number; status: string };
      metadata: { score: number; status: string };
    };
    explanation: string;
  } | null;
}

const DetectionResults = ({ result }: DetectionResultsProps) => {
  if (!result) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Detection Results</h2>
        <div className="text-center py-8">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Upload and analyze a file to see detection results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Detection Results</h2>
      
      {/* Overall Result */}
      <div className={`p-4 rounded-lg mb-6 ${
        result.isDeepfake 
          ? 'bg-red-50 border border-red-200' 
          : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center">
          {result.isDeepfake ? (
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          ) : (
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${
              result.isDeepfake ? 'text-red-800' : 'text-green-800'
            }`}>
              {result.isDeepfake ? 'Potential Deepfake Detected' : 'Content Appears Authentic'}
            </h3>
            <p className="text-sm text-gray-600">
              Confidence: {result.confidence.toFixed(1)}% | Processing time: {result.processingTime}ms
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(result.analysis).map(([key, value]) => (
          <div key={key} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 capitalize">{key} Analysis</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                value.status === 'authentic' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {value.status}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  value.score > 80 ? 'bg-green-500' : 
                  value.score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${value.score}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{value.score.toFixed(1)}% confidence</p>
          </div>
        ))}
      </div>

      {/* AI Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">AI Analysis Explanation</h4>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">
              {result.explanation || "Detailed analysis completed using multimodal AI detection algorithms."}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Eye className="h-4 w-4 mr-2" />
          View Detailed Report
        </button>
        <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Clock className="h-4 w-4 mr-2" />
          Analysis History
        </button>
      </div>
    </div>
  );
};

export default DetectionResults;
