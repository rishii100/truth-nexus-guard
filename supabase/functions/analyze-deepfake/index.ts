
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  file: string; // base64 encoded file
  fileName: string;
  fileType: string;
  queueId: string;
  enhancedPrompt?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { file, fileName, fileType, queueId, enhancedPrompt }: AnalyzeRequest = requestBody;
    
    if (!file || !fileName || !fileType || !queueId) {
      throw new Error("Missing required fields: file, fileName, fileType, or queueId");
    }
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Analyzing file: ${fileName} (${fileType}) - Queue ID: ${queueId}`);
    
    // Update queue status to processing
    await supabase
      .from('analysis_queue')
      .update({ 
        status: 'processing',
        progress: 10 
      })
      .eq('id', queueId);
    
    // Validate base64 string
    if (!file || file.length === 0) {
      throw new Error("Invalid or empty file data");
    }
    
    // Simple but effective prompt for deepfake detection
    const analysisPrompt = `You are an expert deepfake detection system. Analyze this image and determine if it's REAL or AI-GENERATED/FAKE.

Look for these key indicators:

FAKE/AI-GENERATED signs:
- Perfect/unnatural skin texture (too smooth, waxy, no pores)
- Unnatural lighting or shadows
- Weird artifacts around edges, especially hair/face boundaries  
- Too-perfect symmetry in facial features
- Unnatural eye reflections or pupil alignment
- Background inconsistencies or artificial blur

REAL photo signs:
- Natural skin texture with visible pores/imperfections
- Realistic lighting and shadows
- Natural facial asymmetry
- Camera noise/grain patterns
- Natural imperfections (blemishes, wrinkles)

RESPOND WITH EXACTLY THIS FORMAT:
RESULT: [REAL or FAKE]  
CONFIDENCE: [number 1-100]
EXPLANATION: [brief explanation of key indicators found]`;
    
    // Update progress
    await supabase
      .from('analysis_queue')
      .update({ progress: 50 })
      .eq('id', queueId);
    
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
    
    console.log('Raw AI analysis:', analysisText);
    
    // Parse the AI response more robustly
    const resultMatch = analysisText.match(/RESULT:\s*(REAL|FAKE)/i);
    const confidenceMatch = analysisText.match(/CONFIDENCE:\s*(\d+)/i);
    const explanationMatch = analysisText.match(/EXPLANATION:\s*(.*?)(?=\n|$)/is);
    
    const detectionResult = resultMatch ? resultMatch[1].toUpperCase() : 'UNKNOWN';
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
    const explanation = explanationMatch ? explanationMatch[1].trim() : analysisText;
    
    // Determine if it's a deepfake - FAKE means deepfake
    const isDeepfake = detectionResult === 'FAKE';
    
    console.log(`Analysis Results:
    - Detection: ${detectionResult}
    - Is Deepfake: ${isDeepfake}  
    - Confidence: ${confidence}
    - Explanation: ${explanation}`);
    
    // Create structured analysis result
    const analysisResult = {
      fileName,
      fileType,
      timestamp: new Date().toISOString(),
      confidence,
      result: detectionResult,
      isDeepfake: isDeepfake,
      explanation: explanation,
      rawAnalysis: analysisText,
      status: 'completed'
    };

    console.log('Saving to database:', {
      status: 'completed',
      progress: 100,
      is_deepfake: isDeepfake,
      confidence: confidence,
      analysis_result: analysisResult
    });

    // Update the queue item with results
    const { error: updateError } = await supabase
      .from('analysis_queue')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        is_deepfake: isDeepfake,
        confidence: confidence,
        analysis_result: analysisResult,
        explanation: explanation
      })
      .eq('id', queueId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update analysis results in database');
    }

    console.log('✅ Analysis completed and saved successfully');

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in analyze-deepfake function:", error);
    
    // Try to update the queue item as failed
    try {
      const requestBody = await req.json().catch(() => ({}));
      if (requestBody.queueId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from('analysis_queue')
            .update({
              status: 'failed',
              explanation: error.message || 'Unknown error occurred'
            })
            .eq('id', requestBody.queueId);
        }
      }
    } catch (updateError) {
      console.error('Failed to update queue item as failed:', updateError);
    }
    
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
