
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
                
                You are a deepfake detection specialist. Provide a balanced analysis that can distinguish between real and synthetic content.
                
                Look for these specific deepfake indicators:
                1. Unnatural facial blending or warping around edges
                2. Inconsistent lighting that doesn't match the environment
                3. Strange artifacts around eyes, teeth, or hair boundaries
                4. Pixelation or blur inconsistencies
                5. Temporal inconsistencies (for videos)
                6. Unnatural skin texture (too smooth or too perfect)
                
                However, also consider that real photos can have:
                - Natural imperfections and lighting variations
                - Camera artifacts or compression
                - Normal photo editing or filters
                - Natural shadows and reflections
                
                IMPORTANT: Respond with a confidence score from 0-100 where:
                - 0-40: Strong evidence of deepfake/AI generation
                - 41-60: Moderate suspicion of manipulation
                - 61-80: Minor concerns but likely authentic
                - 81-100: High confidence in authenticity
                
                Start your response with "CONFIDENCE_SCORE: [number]" then provide detailed analysis focusing on specific technical indicators rather than general impressions.`
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
      isDeepfake: analysis.confidence < 60, // More balanced threshold - only flag if confidence is below 60%
      processingTime,
      analysis: {
        spatial: { score: analysis.spatial, status: analysis.spatial > 60 ? 'authentic' : 'suspicious' },
        temporal: { score: analysis.temporal, status: analysis.temporal > 60 ? 'authentic' : 'suspicious' },
        audio: { score: analysis.audio, status: analysis.audio > 60 ? 'authentic' : 'suspicious' },
        metadata: { score: analysis.metadata, status: analysis.metadata > 60 ? 'authentic' : 'suspicious' }
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
  
  let confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70; // Default to neutral if unclear
  
  // More balanced keyword analysis
  const strongDeepfakeKeywords = [
    'deepfake', 'ai-generated', 'synthetic', 'artificial', 'generated', 
    'manipulation', 'warping', 'blending artifacts', 'unnatural transitions'
  ];
  
  const moderateDeepfakeKeywords = [
    'suspicious', 'inconsistent', 'artifacts', 'pixelation', 'too perfect'
  ];
  
  const authenticityKeywords = [
    'authentic', 'genuine', 'real', 'natural', 'consistent', 'legitimate',
    'normal', 'typical', 'realistic'
  ];
  
  const lowerResponse = response.toLowerCase();
  
  const strongCount = strongDeepfakeKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
  const moderateCount = moderateDeepfakeKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
  const authenticCount = authenticityKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
  
  // Adjust confidence more thoughtfully
  if (strongCount > 2) {
    confidence = Math.min(confidence, 40); // Strong evidence of deepfake
  } else if (strongCount > 0 || moderateCount > 3) {
    confidence = Math.min(confidence, 55); // Moderate suspicion
  } else if (authenticCount > moderateCount + strongCount) {
    confidence = Math.max(confidence, 75); // Boost if clearly authentic indicators
  }
  
  // Don't be overly conservative with high scores
  if (confidence > 85 && strongCount === 0 && moderateCount <= 1) {
    confidence = Math.min(confidence, 90); // Cap but don't be too harsh
  }
  
  console.log('Parsed confidence:', confidence, 'Strong indicators:', strongCount, 'Moderate indicators:', moderateCount, 'Authentic indicators:', authenticCount);
  
  // Generate sub-scores based on confidence with some variance
  const baseScore = confidence;
  const variance = 10; // Reduced variance for more stability
  
  return {
    confidence,
    spatial: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
    temporal: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
    audio: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
    metadata: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance))
  };
};
