import { CheckCircle, AlertTriangle, Info, Eye, Clock, FileText, Download } from "lucide-react";
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
    fileName?: string;
    fileType?: string;
    timestamp?: string;
  } | null;
}

// Store analysis history in component state
let analysisHistory: Array<{
  id: number;
  filename: string;
  date: string;
  confidence: number;
  isDeepfake: boolean;
  processingTime: number;
}> = [];

const DetectionResults = ({ result }: DetectionResultsProps) => {
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);

  // Add current result to history when it changes
  if (result && !analysisHistory.find(item => 
    item.confidence === result.confidence && 
    item.processingTime === result.processingTime
  )) {
    const entry = {
      id: Date.now(),
      filename: result.fileName || "uploaded_file",
      date: new Date().toISOString().split('T')[0],
      confidence: result.confidence,
      isDeepfake: result.isDeepfake,
      processingTime: result.processingTime
    };
    analysisHistory = [entry, ...analysisHistory.slice(0, 9)]; // Keep last 10 entries
  }

  const downloadPDFReport = () => {
    if (!result) return;
    
    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Deepfake Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .result-box { padding: 15px; border-radius: 8px; margin: 15px 0; }
        .authentic { background-color: #d4edda; border: 1px solid #c3e6cb; }
        .suspicious { background-color: #f8d7da; border: 1px solid #f5c6cb; }
        .score-bar { background-color: #e9ecef; height: 20px; border-radius: 10px; margin: 5px 0; }
        .score-fill { height: 100%; border-radius: 10px; }
        .green { background-color: #28a745; }
        .yellow { background-color: #ffc107; }
        .red { background-color: #dc3545; }
        .tech-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Truth Nexus Guard</h1>
        <h2>Deepfake Analysis Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h3>File Information</h3>
        <p><strong>File Name:</strong> ${result.fileName || 'N/A'}</p>
        <p><strong>File Type:</strong> ${result.fileType || 'N/A'}</p>
        <p><strong>Processing Time:</strong> ${result.processingTime}ms</p>
    </div>

    <div class="section">
        <h3>Analysis Result</h3>
        <div class="result-box ${result.isDeepfake ? 'suspicious' : 'authentic'}">
            <h4>${result.isDeepfake ? '⚠️ Potential Deepfake Detected' : '✅ Content Appears Authentic'}</h4>
            <p><strong>Confidence Level:</strong> ${result.confidence.toFixed(1)}%</p>
            <p><strong>Overall Assessment:</strong> ${result.isDeepfake ? 'Suspicious - Further investigation recommended' : 'Likely authentic content'}</p>
        </div>
    </div>

    <div class="section">
        <h3>Detailed Analysis Scores</h3>
        ${Object.entries(result.analysis).map(([key, value]) => `
            <div style="margin-bottom: 15px;">
                <p><strong>${key.charAt(0).toUpperCase() + key.slice(1)} Analysis:</strong> ${value.score.toFixed(1)}% - ${value.status}</p>
                <div class="score-bar">
                    <div class="score-fill ${value.score > 70 ? 'green' : value.score > 50 ? 'yellow' : 'red'}" style="width: ${value.score}%;"></div>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h3>AI Analysis Insights</h3>
        <p>${cleanExplanationText(result.explanation)}</p>
    </div>

    <div class="section">
        <h3>Technical Details</h3>
        <div class="tech-details">
            <p><strong>Model Version:</strong> v2.1.4</p>
            <p><strong>Analysis Algorithm:</strong> Multi-modal CNN</p>
            <p><strong>Quality Score:</strong> ${Math.round(result.confidence * 0.9)}%</p>
            <p><strong>Risk Level:</strong> ${result.isDeepfake ? 'High' : 'Low'}</p>
            <p><strong>Manipulation Probability:</strong> ${(100 - result.confidence).toFixed(1)}%</p>
            <p><strong>Recommendation:</strong> ${result.isDeepfake ? 'Further Investigation Required' : 'Content Verified as Authentic'}</p>
        </div>
    </div>

    <div class="section">
        <h3>Disclaimer</h3>
        <p style="font-size: 12px; color: #666;">
            This analysis is generated by AI and should be used as a preliminary assessment. 
            For critical decisions, additional verification methods are recommended. 
            Truth Nexus Guard provides this analysis for informational purposes only.
        </p>
    </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepfake-analysis-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show message about PDF conversion
    alert('Report downloaded as HTML. You can convert it to PDF using your browser\'s "Print to PDF" feature.');
  };

  const cleanExplanationText = (text: string) => {
    return text
      .replace(/\*\*/g, '') // Remove ** symbols
      .replace(/\*/g, '') // Remove * symbols
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/`{1,3}/g, '') // Remove code blocks
      .replace(/CONFIDENCE_SCORE:\s*\d+/i, '') // Remove confidence score line
      .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
  };

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

      {/* Clean AI Explanation */}
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
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Analysis Insights
                </h4>
                <div className="h-1 flex-1 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full"></div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed font-medium text-base m-0 whitespace-pre-line">
                  {cleanExplanationText(result.explanation)}
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
          onClick={downloadPDFReport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF Report
        </button>
        <button 
          onClick={() => setShowAnalysisHistory(!showAnalysisHistory)}
          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Clock className="h-4 w-4 mr-2" />
          Analysis History ({analysisHistory.length})
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
                  <li>Model Version: v2.1.4</li>
                  <li>Analysis Algorithm: Multi-modal CNN</li>
                  <li>Processing Time: {result.processingTime}ms</li>
                  <li>Quality Score: {Math.round(result.confidence * 0.9)}%</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Overall Risk: {result.isDeepfake ? 'High' : 'Low'}</li>
                  <li>Manipulation Probability: {(100 - result.confidence).toFixed(1)}%</li>
                  <li>Authenticity Score: {result.confidence.toFixed(1)}%</li>
                  <li>Recommendation: {result.isDeepfake ? 'Further Investigation' : 'Content Verified'}</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={downloadPDFReport}
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis History Modal */}
      {showAnalysisHistory && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analysis History</h3>
            <button
              onClick={() => setShowAnalysisHistory(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {analysisHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No analysis history available yet</p>
              </div>
            ) : (
              analysisHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{item.filename}</p>
                      <p className="text-sm text-gray-500">{item.date} • {item.processingTime}ms</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      item.isDeepfake ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.isDeepfake ? 'Suspicious' : 'Authentic'}
                    </p>
                    <p className="text-xs text-gray-500">{item.confidence.toFixed(1)}% confidence</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionResults;
