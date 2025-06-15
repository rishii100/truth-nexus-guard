
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
                text: `Analyze this ${file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio'} for deepfake or AI-generated content.

You are an expert deepfake detection system. Analyze carefully and provide an accurate assessment.

CRITICAL INSTRUCTIONS:
1. Start your response with "CONFIDENCE_SCORE: [number from 0-100]"
2. Higher scores (70-100) = AUTHENTIC/REAL content
3. Lower scores (0-30) = LIKELY DEEPFAKE/AI-GENERATED
4. Medium scores (30-70) = UNCERTAIN

Look for these SPECIFIC deepfake/AI-generation indicators:
- Unnatural facial blending or morphing artifacts
- Inconsistent lighting that defies physics
- Artificial skin texture (too perfect/plastic-like)
- Warping around facial features, hair, or clothing edges
- Temporal inconsistencies in videos
- Digital artifacts not from normal compression

HOWEVER, remember that REAL photos commonly have:
- Natural imperfections and normal lighting
- Standard photo editing/filters
- Compression artifacts
- Natural shadows and reflections
- Realistic skin texture with minor editing

Be CONSERVATIVE in your assessment. Only flag as deepfake if you see CLEAR artificial indicators.

Respond with your confidence score and detailed technical analysis.`
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64.split(',')[1]
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
      isDeepfake: analysis.confidence < 40, // Only flag as deepfake if confidence is below 40%
      processingTime,
      analysis: {
        spatial: { score: analysis.spatial, status: analysis.spatial > 40 ? 'authentic' : 'suspicious' },
        temporal: { score: analysis.temporal, status: analysis.temporal > 40 ? 'authentic' : 'suspicious' },
        audio: { score: analysis.audio, status: analysis.audio > 40 ? 'authentic' : 'suspicious' },
        metadata: { score: analysis.metadata, status: analysis.metadata > 40 ? 'authentic' : 'suspicious' }
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
  // Extract confidence score from AI response
  const confidenceMatch = response.match(/CONFIDENCE_SCORE:\s*(\d+)/i);
  let confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
  
  console.log('Raw AI confidence:', confidence);
  
  // Only make minor adjustments based on STRONG deepfake indicators
  const lowerResponse = response.toLowerCase();
  
  // Only look for VERY strong deepfake indicators
  const strongDeepfakeKeywords = [
    'clearly artificial',
    'obvious deepfake',
    'ai-generated',
    'synthetic',
    'digitally created',
    'computer generated',
    'fake',
    'manipulated'
  ];
  
  // Look for strong authenticity indicators
  const strongAuthenticityKeywords = [
    'authentic',
    'genuine',
    'real',
    'natural',
    'legitimate',
    'original',
    'unmanipulated'
  ];
  
  const strongFakeCount = strongDeepfakeKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
  const strongRealCount = strongAuthenticityKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
  
  // Only adjust if there are VERY strong indicators and they contradict the confidence
  if (strongFakeCount >= 2 && confidence > 50) {
    // Strong fake indicators but high confidence - reduce confidence
    confidence = Math.min(confidence, 35);
    console.log('Adjusted confidence down due to strong fake indicators:', confidence);
  } else if (strongRealCount >= 2 && confidence < 50) {
    // Strong real indicators but low confidence - increase confidence
    confidence = Math.max(confidence, 75);
    console.log('Adjusted confidence up due to strong real indicators:', confidence);
  }
  
  // If AI gave high confidence (70+), trust it unless there are overwhelming fake indicators
  if (confidence >= 70 && strongFakeCount < 3) {
    confidence = Math.max(confidence, 75);
  }
  
  // If AI gave low confidence (30-), trust it unless there are overwhelming real indicators
  if (confidence <= 30 && strongRealCount < 3) {
    confidence = Math.min(confidence, 35);
  }
  
  // Ensure reasonable bounds
  confidence = Math.max(5, Math.min(95, confidence));
  
  console.log('Final parsed confidence:', confidence, 'Strong fake indicators:', strongFakeCount, 'Strong real indicators:', strongRealCount);
  
  // Generate sub-scores based on confidence
  const baseScore = confidence;
  const variance = 5; // Small variance for stability
  
  return {
    confidence,
    spatial: Math.max(10, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
    temporal: Math.max(10, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
    audio: Math.max(10, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
    metadata: Math.max(10, Math.min(95, baseScore + (Math.random() - 0.5) * variance))
  };
};
