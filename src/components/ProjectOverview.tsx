
import { Shield, Zap, Globe, Lock, Brain, Users } from "lucide-react";

const ProjectOverview = () => {
  const features = [
    {
      icon: <Brain className="h-6 w-6 text-blue-600" />,
      title: "Multimodal AI Detection",
      description: "Advanced analysis of visual, audio, and temporal patterns to detect deepfakes with >95% accuracy"
    },
    {
      icon: <Zap className="h-6 w-6 text-green-600" />,
      title: "Real-time Processing",
      description: "Sub-200ms inference time for instant detection, optimized for edge and mobile deployment"
    },
    {
      icon: <Lock className="h-6 w-6 text-purple-600" />,
      title: "Blockchain Provenance",
      description: "Tamper-proof content verification with immutable blockchain-based audit trails"
    },
    {
      icon: <Globe className="h-6 w-6 text-orange-600" />,
      title: "Indian Context Optimized",
      description: "Trained on diverse Indian datasets with support for regional contexts"
    },
    {
      icon: <Shield className="h-6 w-6 text-red-600" />,
      title: "Privacy Compliant",
      description: "GDPR and IT Act compliant with end-to-end encryption and data anonymization"
    },
    {
      icon: <Users className="h-6 w-6 text-indigo-600" />,
      title: "Enterprise Ready",
      description: "APIs and integrations for media, law enforcement, and social platform deployment"
    }
  ];

  const stats = [
    { label: "Detection Accuracy", value: ">95%" },
    { label: "Processing Time", value: "<200ms" },
    { label: "Supported Formats", value: "3+" }
    // "Languages Supported" removed
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 rounded-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          AI-Driven Deepfake Detection for Digital Content Integrity
        </h1>
        <p className="text-lg mb-6 opacity-90">
          A production-ready, multimodal AI system designed to combat deepfake threats 
          and restore trust in digital media across India and globally.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div id="features">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features & Innovations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                {feature.icon}
                <h3 className="text-lg font-semibold text-gray-900 ml-3">{feature.title}</h3>
              </div>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Problem Statement */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-900 mb-4">The Deepfake Threat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-red-800 mb-2">Current Risks</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Election interference and political manipulation</li>
              <li>• Financial fraud and voice cloning scams</li>
              <li>• Identity theft and reputation damage</li>
              <li>• Erosion of trust in digital media</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-red-800 mb-2">Real-World Impact</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 2023: Deepfake political speeches affected state elections</li>
              <li>• 2024: AI voice cloning targeted Indian CEOs</li>
              <li>• Rising cases of deepfake harassment and blackmail</li>
              <li>• Spread of misinformation during critical events</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;

