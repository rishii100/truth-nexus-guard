
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  file: string; // base64 encoded file
  fileName: string;
  fileType: string;
  enhancedPrompt?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { file, fileName, fileType, enhancedPrompt }: AnalyzeRequest = requestBody;
    
    if (!file || !fileName || !fileType) {
      throw new Error("Missing required fields: file, fileName, or fileType");
    }
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    console.log(`Analyzing file: ${fileName} (${fileType})`);
    
    // Validate base64 string
    if (!file || file.length === 0) {
      throw new Error("Invalid or empty file data");
    }
    
    // Enhanced prompt for better detection
    const analysisPrompt = enhancedPrompt ? 
      `You are an expert deepfake and AI-generated content detector. Analyze this ${fileType.split('/')[0]} with EXTREME precision to determine if it's REAL or AI-GENERATED.

CRITICAL ANALYSIS POINTS:

FOR REAL PHOTOGRAPHS, look for:
✓ Natural skin texture with visible pores, minor blemishes, realistic imperfections
✓ Natural lighting that matches the environment and creates realistic shadows
✓ Facial asymmetry (real faces are naturally asymmetric)
✓ Natural eye reflections that match the lighting
✓ Realistic hair texture with individual strands and natural variations
✓ Camera grain/noise patterns typical of photography
✓ Natural depth of field and background interactions
✓ Spontaneous, natural expressions and micro-expressions
✓ Realistic fabric textures and clothing details
✓ Environmental consistency (lighting, shadows, reflections match setting)

FOR AI-GENERATED/FAKE CONTENT, look for:
✗ Overly perfect/smooth skin without natural texture or pores
✗ Plastic-like or waxy appearance
✗ Unnatural lighting that doesn't match the environment
✗ Perfect symmetrical features (too perfect to be natural)
✗ Digital artifacts around face/hair edges
✗ Impossibly perfect teeth or unrealistic dental work
✗ Eyes with unnatural reflections or misaligned pupils
✗ Hair that looks painted or lacks realistic texture
✗ Background inconsistencies or obvious artificial blurring
✗ Overly polished appearance without natural imperfections
✗ Lighting inconsistencies across the image

INSTRUCTIONS:
1. Examine EVERY detail meticulously
2. State "APPEARS AUTHENTIC" if it shows clear signs of being a real photograph
3. State "APPEARS ARTIFICIAL" if it shows signs of AI generation
4. Be SPECIFIC about what features led to your conclusion
5. Confidence should reflect the strength of evidence (90%+ for clear cases)

Provide detailed technical analysis of specific visual elements that support your conclusion.` :

      `Analyze this ${fileType.split('/')[0]} file for potential deepfake or AI-generated content. Provide a detailed analysis including:
      1. Likelihood of being a deepfake (percentage)
      2. Specific indicators found
      3. Technical anomalies detected
      4. Confidence level in the assessment
      5. Recommendations for further verification
      
      Please be thorough and technical in your analysis.`;
    
    // Call Google Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: analysisPrompt
            },
            {
              inline_data: {
                mime_type: fileType,
                data: file
              }
            }
          ]
        }]
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }

    const result = await geminiResponse.json();
    
    // Process the response
    const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!analysisText) {
      console.error('Invalid response structure:', result);
      throw new Error("Invalid response from AI analysis service");
    }
    
    // Create a structured response
    const analysisResult = {
      fileName,
      fileType,
      timestamp: new Date().toISOString(),
      analysis: analysisText,
      status: 'completed'
    };

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in analyze-deepfake function:", error);
    
    // Return a proper error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        status: 'failed',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
