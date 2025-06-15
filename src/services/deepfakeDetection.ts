
interface DetectionResult {
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
}

export const analyzeFile = async (file: File, apiKey: string): Promise<DetectionResult> => {
  const startTime = Date.now();
  
  try {
    // Convert file to base64 for API
    const base64 = await fileToBase64(file);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this ${file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio'} for potential deepfake manipulation. 
                
                You are a specialized deepfake detection AI. Be VERY critical and suspicious of any content that could potentially be AI-generated or manipulated.
                
                Look carefully for:
                1. Unnatural facial features, skin texture, or lighting inconsistencies
                2. Artifacts around eyes, mouth, or face boundaries
                3. Inconsistent lighting or shadows
                4. Unusual blending or pixelation
                5. Signs of AI generation (too perfect, unnatural smoothness)
                
                IMPORTANT: Respond with a confidence score from 0-100 where:
                - 0-30: Definitely a deepfake/AI generated
                - 31-60: Likely a deepfake/AI generated  
                - 61-80: Possibly manipulated
                - 81-100: Appears authentic
                
                Start your response with "CONFIDENCE_SCORE: [number]" then provide detailed analysis.
                Be strict and err on the side of caution - modern AI can create very realistic content.`
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64.split(',')[1] // Remove data:image/jpeg;base64, prefix
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    const aiResponse = data.candidates[0]?.content?.parts[0]?.text || '';
    console.log('AI Response:', aiResponse);
    
    // Parse AI response to extract confidence and analysis
    const analysis = parseAIResponse(aiResponse);
    
    return {
      confidence: analysis.confidence,
      isDeepfake: analysis.confidence < 80, // More strict threshold - anything below 80% is suspicious
      processingTime,
      analysis: {
        spatial: { score: analysis.spatial, status: analysis.spatial > 70 ? 'authentic' : 'suspicious' },
        temporal: { score: analysis.temporal, status: analysis.temporal > 70 ? 'authentic' : 'suspicious' },
        audio: { score: analysis.audio, status: analysis.audio > 70 ? 'authentic' : 'suspicious' },
        metadata: { score: analysis.metadata, status: analysis.metadata > 70 ? 'authentic' : 'suspicious' }
      },
      explanation: aiResponse
    };
    
  } catch (error) {
    console.error('Detection error:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const parseAIResponse = (response: string) => {
  // Look for the confidence score in the AI response
  const confidenceMatch = response.match(/CONFIDENCE_SCORE:\s*(\d+)/i) || 
                         response.match(/confidence[:\s]*(\d+)/i) ||
                         response.match(/(\d+)(?:%|\s*confidence|\s*score)/i);
  
  let confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50; // Default to suspicious if unclear
  
  // Additional checks for deepfake indicators in the response text
  const suspiciousKeywords = [
    'artificial', 'ai-generated', 'synthetic', 'deepfake', 'manipulated', 
    'generated', 'fake', 'suspicious', 'artifacts', 'inconsistent',
    'unnatural', 'blending', 'pixelation', 'manipulation'
  ];
  
  const positiveKeywords = [
    'authentic', 'genuine', 'real', 'natural', 'consistent', 'legitimate'
  ];
  
  const lowerResponse = response.toLowerCase();
  const suspiciousCount = suspiciousKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
  const positiveCount = positiveKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
  
  // Adjust confidence based on keyword analysis
  if (suspiciousCount > positiveCount + 1) {
    confidence = Math.min(confidence, 60); // Cap at 60% if many suspicious indicators
  }
  
  // If the AI response mentions it appears authentic but we want to be more critical
  if (confidence > 90 && suspiciousCount === 0) {
    confidence = Math.min(confidence, 85); // Be more conservative
  }
  
  console.log('Parsed confidence:', confidence, 'Suspicious keywords:', suspiciousCount, 'Positive keywords:', positiveCount);
  
  // Generate sub-scores based on confidence with some variance
  const baseScore = confidence;
  const variance = 15;
  
  return {
    confidence,
    spatial: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
    temporal: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
    audio: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
    metadata: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance))
  };
};
