
import { Shield, Zap, Globe, Lock, Brain, Users, Languages } from "lucide-react";

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
      description: "Trained on diverse Indian datasets with support for 22+ languages and regional contexts"
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
    { label: "Supported Formats", value: "3+" },
    { label: "Languages Supported", value: "22+" }
  ];

  const languageExamples = [
    {
      language: "English",
      text: "Detecting synthetic media with AI precision",
      flag: "🇺🇸"
    },
    {
      language: "हिंदी (Hindi)",
      text: "एआई सटीकता के साथ सिंथेटिक मीडिया का पता लगाना",
      flag: "🇮🇳"
    },
    {
      language: "বাংলা (Bengali)",
      text: "এআই নির্ভুলতার সাথে সিন্থেটিক মিডিয়া সনাক্তকরণ",
      flag: "🇧🇩"
    }
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

      {/* Multilingual Support Demo */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Languages className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Multilingual AI Detection</h2>
        </div>
        <p className="text-gray-700 mb-6">
          Our system can analyze and detect deepfakes in content across 22+ languages, 
          understanding context and cultural nuances specific to different regions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {languageExamples.map((example, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{example.flag}</span>
                <span className="font-semibold text-gray-800">{example.language}</span>
              </div>
              <p className="text-gray-600 text-sm italic">"{example.text}"</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <strong>Supported Languages Include:</strong> Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, 
          Urdu, Kannada, Malayalam, Punjabi, Odia, Assamese, and 10+ more Indian regional languages plus English.
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
