
import Header from "../components/Header";
import FileUpload from "../components/FileUpload";
import DetectionResults from "../components/DetectionResults";
import ProjectOverview from "../components/ProjectOverview";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detection' | 'results'>('overview');
  const [detectionResult, setDetectionResult] = useState(null);

  const handleAnalysisComplete = (result: any) => {
    setDetectionResult(result);
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Project Overview
            </button>
            <button
              onClick={() => setActiveTab('detection')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'detection'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Detection Tool
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Results {detectionResult && <span className="ml-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && <ProjectOverview />}
          {activeTab === 'detection' && <FileUpload onAnalysisComplete={handleAnalysisComplete} />}
          {activeTab === 'results' && <DetectionResults result={detectionResult} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">Truth Nexus Guard</h3>
              <p className="text-gray-400 text-sm">
                Advanced AI-driven deepfake detection for digital content integrity.
                Protecting truth in the age of synthetic media.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Use Cases</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>Media Verification</li>
                <li>Law Enforcement</li>
                <li>Social Media Platforms</li>
                <li>Financial Services</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <div className="text-gray-400 text-sm space-y-2">
                <p>Research & Development Team</p>
                <p>truthnexus@research.in</p>
                <p>+91-XXX-XXX-XXXX</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Truth Nexus Guard. Built for digital integrity and trust.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
