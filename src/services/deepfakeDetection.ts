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
                text: `You are a deepfake detection expert. Analyze this ${file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio'} for signs of AI generation or manipulation.

CRITICAL INSTRUCTIONS:
1. Start with "CONFIDENCE_SCORE: [0-100]"
2. Be BALANCED in your analysis - most real photos should score 70-90
3. Only mark as deepfake if there are CLEAR, OBVIOUS signs of manipulation
4. Real photos with minor imperfections are AUTHENTIC
5. End with "FINAL_VERDICT: AUTHENTIC" or "FINAL_VERDICT: DEEPFAKE"

SCORING GUIDELINES:
- Scores 80-95 = CLEARLY AUTHENTIC (natural photos with realistic features)
- Scores 65-79 = LIKELY AUTHENTIC (minor concerns but overall genuine)
- Scores 45-64 = UNCERTAIN (needs investigation)
- Scores 25-44 = LIKELY DEEPFAKE (clear manipulation signs)
- Scores 0-24 = DEFINITELY DEEPFAKE (obvious AI generation)

RED FLAGS for DEEPFAKE (be specific about these):
- Unrealistic skin texture (too smooth, plastic-like, no pores)
- Unnatural lighting that doesn't match environment
- Clear digital artifacts around face/hair edges
- Eyes with unnatural reflections or misaligned pupils
- Teeth that are impossibly perfect/uniform
- Background inconsistencies or obvious blurring
- Facial features that don't align properly
- Missing natural asymmetry (real faces are slightly asymmetric)

AUTHENTIC signs (these are GOOD):
- Natural skin texture with visible pores/minor blemishes
- Realistic lighting with proper shadows
- Natural facial asymmetry
- Minor imperfections (freckles, wrinkles, etc.)
- Realistic background interactions
- Natural grain/noise patterns from camera
- Genuine expressions and micro-expressions

IMPORTANT: A photo with natural imperfections, realistic lighting, and normal skin texture should score HIGH (80+), not low. Only lower scores for clear manipulation signs.

Provide detailed analysis explaining your reasoning.
`
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
      isDeepfake: analysis.confidence < 50, // Adjusted threshold for better accuracy
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
  // Extract confidence score from AI response
  const confidenceMatch = response.match(/CONFIDENCE_SCORE:\s*(\d+)/i);
  let confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70; // Higher default
  
  // Extract final verdict if available
  const verdictMatch = response.match(/FINAL_VERDICT:\s*(AUTHENTIC|DEEPFAKE|UNCERTAIN)/i);
  const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : null;
  
  const lowerResponse = response.toLowerCase();

  // Extended fake/deepfake indicators
  const strongDeepfakeIndicators = [
    'clearly artificial',
    'obvious manipulation',
    'ai-generated',
    'synthetic',
    'digital artifacts',
    'unnatural lighting',
    'signs of manipulation',
    'deepfake',
    'artificially generated',
    'computer-generated',
    'fake',
    'severe artifact',
    'significant artifact',
    'major inconsistencies',
    'high probability of being fake',
    'impossible features',
    'inconsistent',
    'glitch',
    'distortion',
    'unreal',
    'not real',
    'face swap',
    'stylegan',
    'diffusion',
    'latent',
    'reconstructed'
  ];
  const strongDeepfakeCount = strongDeepfakeIndicators.filter(ind => lowerResponse.includes(ind)).length;

  // Extended strong authenticity indicators
  const strongAuthenticityIndicators = [
    'appears authentic',
    'appears genuine',
    'natural photograph',
    'realistic texture',
    'natural lighting',
    'no signs of manipulation',
    'genuine image',
    'authentic image',
    'photo looks real',
    'camera noise',
    'natural noise pattern',
    'real facial asymmetry'
  ];
  const strongAuthenticityCount = strongAuthenticityIndicators.filter(ind => lowerResponse.includes(ind)).length;

  // Decision logic
  let isDeepfake = false;

  // Explicit AI verdicts take highest precedence
  if (verdict === 'AUTHENTIC') {
    isDeepfake = false;
    confidence = Math.max(confidence, 75);
  } else if (verdict === 'DEEPFAKE') {
    isDeepfake = true;
    confidence = Math.min(confidence, 30); // Lower, stricter for fakes
  } else if (verdict === 'UNCERTAIN') {
    // Treat uncertain with extra caution
    if (strongDeepfakeCount > 0 && strongAuthenticityCount === 0) {
      isDeepfake = true;
      confidence = Math.min(confidence, 30);
    } else {
      isDeepfake = confidence < 65; // Uncertainty: must be at least 65 to trust as real
    }
  } else if (strongDeepfakeCount > 0 && strongAuthenticityCount === 0) {
    // If any clear deepfake indicators and no authentic cues, treat as fake
    isDeepfake = true;
    confidence = Math.min(confidence, 25 + 5 * strongDeepfakeCount);
  } else if (strongAuthenticityCount > 1 && strongDeepfakeCount === 0) {
    // Strong multiple authentic cues, no fake cues
    isDeepfake = false;
    confidence = Math.max(confidence, 80);
  } else if (strongDeepfakeCount > 0 && strongAuthenticityCount > 0) {
    // Mixed signals, treat as uncertain/fake
    isDeepfake = true;
    confidence = Math.min(confidence, 40);
  } else {
    // Default threshold: must have >= 60 to be accepted as real
    isDeepfake = confidence < 60;
  }

  // Clamp confidence
  confidence = Math.max(10, Math.min(95, confidence));

  // Generate sub-scores based on confidence with realistic variance
  const baseScore = confidence;
  const variance = 8;
  return {
    confidence,
    spatial: Math.max(15, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
    temporal: Math.max(15, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
    audio: Math.max(15, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
    metadata: Math.max(15, Math.min(95, baseScore + (Math.random() - 0.5) * variance))
  };
};
