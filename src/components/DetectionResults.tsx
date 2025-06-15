
import { CheckCircle, AlertTriangle, Info, Eye, Clock, FileText, Download, Share2 } from "lucide-react";
import { useState } from "react";

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
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);

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

  const mockAnalysisHistory = [
    { id: 1, filename: "video_sample.mp4", date: "2024-01-15", confidence: 78.5, isDeepfake: false },
    { id: 2, filename: "suspicious_audio.wav", date: "2024-01-14", confidence: 45.2, isDeepfake: true },
    { id: 3, filename: "profile_image.jpg", date: "2024-01-13", confidence: 92.1, isDeepfake: false },
  ];

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

      {/* Elegant AI Explanation */}
      <div className="relative mb-6 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Info className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Analysis Insights
                </h4>
                <div className="h-1 flex-1 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full"></div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {result.explanation || "Detailed analysis completed using multimodal AI detection algorithms."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setShowDetailedReport(!showDetailedReport)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Detailed Report
        </button>
        <button 
          onClick={() => setShowAnalysisHistory(!showAnalysisHistory)}
          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Clock className="h-4 w-4 mr-2" />
          Analysis History
        </button>
      </div>

      {/* Detailed Report Modal */}
      {showDetailedReport && (
        <div className="border rounded-lg p-6 mb-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis Report</h3>
            <button
              onClick={() => setShowDetailedReport(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Model Version: v2.1.4</li>
                  <li>• Analysis Algorithm: Multi-modal CNN</li>
                  <li>• Processing Time: {result.processingTime}ms</li>
                  <li>• Quality Score: {Math.round(result.confidence * 0.9)}%</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Overall Risk: {result.isDeepfake ? 'High' : 'Low'}</li>
                  <li>• Manipulation Probability: {(100 - result.confidence).toFixed(1)}%</li>
                  <li>• Authenticity Score: {result.confidence.toFixed(1)}%</li>
                  <li>• Recommendation: {result.isDeepfake ? 'Further Investigation' : 'Content Verified'}</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </button>
              <button className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors">
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis History Modal */}
      {showAnalysisHistory && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Analysis History</h3>
            <button
              onClick={() => setShowAnalysisHistory(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {mockAnalysisHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{item.filename}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    item.isDeepfake ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {item.isDeepfake ? 'Suspicious' : 'Authentic'}
                  </p>
                  <p className="text-xs text-gray-500">{item.confidence}% confidence</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionResults;
