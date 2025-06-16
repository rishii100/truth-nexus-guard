
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

  // Download as HTML file with exact page styling
  const downloadHTMLReport = () => {
    if (!result) return;

    const status = result.isDeepfake ? 'Potential Deepfake Detected' : 'Content Appears Authentic';
    const statusColor = result.isDeepfake ? '#dc2626' : '#059669';
    const statusBg = result.isDeepfake ? '#fef2f2' : '#f0fdf4';
    const statusBorder = result.isDeepfake ? '#fecaca' : '#bbf7d0';
    const iconSvg = result.isDeepfake 
      ? '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>'
      : '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';

    const cleanedExplanation = cleanExplanationText(result.explanation);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AI-Driven Deepfake Detector - Analysis Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #f8fafc; 
            color: #1e293b;
            line-height: 1.6;
            padding: 2rem;
          }
          .container { 
            max-width: 800px;
            margin: 0 auto;
            background: white; 
            border-radius: 0.5rem; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
          }
          .header { 
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e2e8f0;
          }
          .title { 
            font-size: 2rem; 
            font-weight: bold; 
            color: #1e293b;
            margin-bottom: 0.5rem;
          }
          .subtitle { 
            color: #64748b; 
            font-size: 1rem;
          }
          
          .overall-result {
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid;
            background: ${statusBg};
            border-color: ${statusBorder};
          }
          .result-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .result-icon {
            color: ${statusColor};
            flex-shrink: 0;
          }
          .result-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: ${statusColor};
            margin-bottom: 0.25rem;
          }
          .result-details {
            font-size: 0.875rem;
            color: #4b5563;
          }
          
          .analysis-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .analysis-card {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            background: white;
          }
          .analysis-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 0.5rem;
          }
          .analysis-title {
            font-weight: 500;
            color: #111827;
            text-transform: capitalize;
          }
          .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 500;
            margin-left: auto;
          }
          .status-authentic {
            background: #dcfce7;
            color: #166534;
          }
          .status-suspicious {
            background: #fee2e2;
            color: #991b1b;
          }
          .progress-bar {
            width: 100%;
            height: 0.5rem;
            background: #e5e7eb;
            border-radius: 9999px;
            overflow: hidden;
            margin: 0.5rem 0;
          }
          .progress-fill {
            height: 100%;
            border-radius: 9999px;
            transition: width 0.3s ease;
          }
          .progress-green { background: #10b981; }
          .progress-yellow { background: #f59e0b; }
          .progress-red { background: #ef4444; }
          .confidence-text {
            font-size: 0.875rem;
            color: #4b5563;
          }
          
          .ai-insights {
            position: relative;
            overflow: hidden;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%);
            margin-bottom: 1.5rem;
          }
          .ai-insights::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
          }
          .ai-content {
            position: relative;
            padding: 1.5rem;
          }
          .ai-header {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
          }
          .ai-icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .ai-icon svg {
            width: 1.25rem;
            height: 1.25rem;
            color: white;
          }
          .ai-text-content {
            flex: 1;
            min-width: 0;
          }
          .ai-title-section {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .ai-title {
            font-size: 1.125rem;
            font-weight: 600;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .ai-divider {
            height: 0.25rem;
            flex: 1;
            background: linear-gradient(90deg, #bfdbfe, #c7d2fe);
            border-radius: 9999px;
          }
          .ai-explanation {
            color: #374151;
            line-height: 1.625;
            font-weight: 500;
            font-size: 1rem;
            white-space: pre-line;
          }
          
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 0.875rem;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
          }
          
          @media print {
            body { padding: 0; background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">Detection Results</div>
            <div class="subtitle">Analysis Report • ${new Date().toLocaleString()}</div>
          </div>

          <div class="overall-result">
            <div class="result-header">
              <div class="result-icon">${iconSvg}</div>
              <div>
                <div class="result-title">${status}</div>
                <div class="result-details">
                  Processing time: ${result.processingTime}ms
                </div>
              </div>
            </div>
          </div>

          <div class="analysis-grid">
            ${Object.entries(result.analysis).map(([key, value]) => `
              <div class="analysis-card">
                <div class="analysis-header">
                  <div class="analysis-title">${key} Analysis</div>
                  <span class="status-badge ${value.status === 'authentic' ? 'status-authentic' : 'status-suspicious'}">
                    ${value.status}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${
                    value.score > 80 ? 'progress-green' : 
                    value.score > 60 ? 'progress-yellow' : 'progress-red'
                  }" style="width: ${value.score}%"></div>
                </div>
                <div class="confidence-text">${value.score.toFixed(1)}% confidence</div>
              </div>
            `).join('')}
          </div>

          <div class="ai-insights">
            <div class="ai-content">
              <div class="ai-header">
                <div class="ai-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="ai-text-content">
                  <div class="ai-title-section">
                    <div class="ai-title">AI Analysis Insights</div>
                    <div class="ai-divider"></div>
                  </div>
                  <div class="ai-explanation">${cleanedExplanation}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div>File: ${result.fileName || 'N/A'} | Type: ${result.fileType || 'N/A'}</div>
            <div style="margin-top: 0.5rem;">
              Disclaimer: This analysis is generated by AI and should be used as a preliminary assessment.<br/>
              © 2024 AI-Driven Deepfake Detector.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create and trigger the download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deepfake-analysis-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 100);
  };

  // Download JSON report from modal
  const downloadJSONReport = () => {
    if (!result) return;
    const filename = `deepfake-analysis-${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 100);
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

  const getDescriptiveAnalysis = (result: any) => {
    const analysisType = result.isDeepfake ? "suspicious content" : "authentic content";
    const processingDetails = `Our advanced AI model processed this ${result.fileType?.includes('image') ? 'image' : 'media'} using multi-layered analysis techniques`;
    
    const keyFindings = [];
    
    // Extract key findings from the analysis scores
    Object.entries(result.analysis).forEach(([key, value]: [string, any]) => {
      if (value.status === 'suspicious') {
        keyFindings.push(`${key} analysis revealed anomalies`);
      } else {
        keyFindings.push(`${key} characteristics appear natural`);
      }
    });

    const technicalSummary = result.isDeepfake 
      ? "The analysis detected patterns commonly associated with AI-generated or manipulated content, including potential inconsistencies in pixel-level features, lighting artifacts, or unnatural texture distributions."
      : "The content exhibits natural characteristics consistent with authentic media, including realistic texture patterns, proper lighting consistency, and expected photographic artifacts.";

    return `${processingDetails}. Key findings include: ${keyFindings.join(', ')}. ${technicalSummary}`;
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
              Processing time: {result.processingTime}ms
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

      {/* Enhanced AI Explanation */}
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
                  Detailed Analysis Report
                </h4>
                <div className="h-1 flex-1 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed font-medium text-base m-0">
                    {getDescriptiveAnalysis(result)}
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Technical Assessment:</h5>
                  <p className="text-gray-700 leading-relaxed font-medium text-sm whitespace-pre-line">
                    {cleanExplanationText(result.explanation)}
                  </p>
                </div>
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
          onClick={downloadHTMLReport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Download HTML Report
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
                onClick={downloadJSONReport}
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download JSON Report
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
