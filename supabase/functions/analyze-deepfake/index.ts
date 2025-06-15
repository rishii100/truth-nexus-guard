
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
    
    // COMPLETELY REVISED PROMPT - More precise and technical
    const analysisPrompt = `You are a professional deepfake detection expert. Analyze this image with extreme precision to determine if it's REAL or AI-GENERATED.

CRITICAL ANALYSIS FRAMEWORK:

FOR REAL PHOTOGRAPHS (Score 70-90), look for ALL of these:
✓ NATURAL SKIN TEXTURE: Visible pores, minor blemishes, realistic skin grain
✓ NATURAL LIGHTING: Consistent shadows, realistic light fall-off, environmental matching
✓ FACIAL ASYMMETRY: Real faces have subtle asymmetry - one eye slightly different, uneven features
✓ NATURAL IMPERFECTIONS: Small scars, wrinkles, uneven skin tone, realistic aging
✓ CAMERA ARTIFACTS: Natural grain, slight blur, realistic depth of field
✓ HAIR TEXTURE: Individual strands, natural flow, realistic highlights
✓ EYE DETAILS: Natural reflections matching environment, slight bloodshot, natural iris patterns
✓ FABRIC/CLOTHING: Realistic textures, natural wrinkles, proper material behavior
✓ BACKGROUND INTERACTION: Natural depth, realistic perspective, environmental consistency

FOR AI-GENERATED/FAKE CONTENT (Score 10-40), look for ANY of these:
✗ PERFECT SKIN: Overly smooth, plastic-like, waxy appearance, no visible pores
✗ UNNATURAL LIGHTING: Impossible light sources, inconsistent shadows, artificial glow
✗ PERFECT SYMMETRY: Impossibly symmetrical features, too perfect proportions
✗ DIGITAL ARTIFACTS: Weird edges around face/hair, color bleeding, compression artifacts
✗ UNNATURAL EYES: Perfect alignment, identical pupils, unnatural reflections
✗ HAIR ANOMALIES: Painted look, unnatural flow, missing individual strands
✗ BACKGROUND ISSUES: Blurred inconsistencies, impossible perspectives, artificial bokeh
✗ OVERALL PERFECTION: Too polished, lacks natural randomness of real photography

ANALYSIS PROTOCOL:
1. Examine skin texture closely - real skin has pores, minor imperfections, natural variation
2. Check facial symmetry - real faces are naturally asymmetric
3. Analyze lighting consistency - does it match the environment?
4. Look for camera/photographic artifacts - grain, slight imperfections
5. Check background consistency and realistic depth

RESPONSE FORMAT:
- Start with "CONFIDENCE: [10-90]"
- State "APPEARS AUTHENTIC" for real photos or "APPEARS ARTIFICIAL" for AI-generated
- List specific evidence that supports your conclusion
- Be thorough and technical in your analysis

IMPORTANT: Real photographs should score 70+ unless there are clear manipulation signs. Only score below 60 if you find definitive AI generation indicators.`;
    
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
