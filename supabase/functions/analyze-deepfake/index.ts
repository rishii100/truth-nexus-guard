
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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file, fileName, fileType }: AnalyzeRequest = await req.json();
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    console.log(`Analyzing file: ${fileName} (${fileType})`);
    
    // Convert base64 back to binary for analysis
    const binaryData = Uint8Array.from(atob(file), c => c.charCodeAt(0));
    
    // Call Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this ${fileType.split('/')[0]} file for potential deepfake or AI-generated content. Provide a detailed analysis including:
              1. Likelihood of being a deepfake (percentage)
              2. Specific indicators found
              3. Technical anomalies detected
              4. Confidence level in the assessment
              5. Recommendations for further verification
              
              Please be thorough and technical in your analysis.`
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Process the response
    const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis could not be completed";
    
    // Create a structured response
    const analysisResult = {
      fileName,
      fileType,
      timestamp: new Date().toISOString(),
      analysis: analysisText,
      status: 'completed'
    };

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in analyze-deepfake function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'failed'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
