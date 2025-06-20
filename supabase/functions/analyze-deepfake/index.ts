
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

    console.log(`🔍 STARTING ANALYSIS: ${fileName} (${fileType}) - Queue ID: ${queueId}`);
    
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
    
    // VERY STRICT prompt specifically for deepfake detection
    const analysisPrompt = `You are an EXPERT deepfake detection AI. Analyze this ${fileType.startsWith('image') ? 'image' : fileType.startsWith('video') ? 'video' : 'audio'} VERY CAREFULLY for AI generation or deepfake manipulation.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. You MUST respond EXACTLY in this format:
RESULT: [REAL or FAKE]
CONFIDENCE: [number from 1-100]
EXPLANATION: [detailed analysis]

2. Mark as FAKE if you detect ANY of these AI generation signs:
- Unrealistic skin (too smooth, plastic-like, no pores/texture)
- Perfect/artificial teeth that look generated
- Unnatural lighting that doesn't match the scene
- Digital artifacts around face/hair boundaries
- Eyes with strange reflections or unnatural appearance
- Background inconsistencies or artificial blur
- Face that looks "too perfect" or artificially enhanced
- Any signs of digital manipulation
- Synthetic or computer-generated appearance
- Impossible facial features or proportions
- Overly symmetric faces (real faces have natural asymmetry)

3. Mark as REAL only if you see:
- Natural skin texture with visible pores/imperfections
- Realistic lighting with proper shadows
- Natural facial asymmetry and imperfections
- Realistic background interactions
- Normal camera grain/noise patterns
- Genuine human characteristics

4. BE EXTREMELY STRICT - If there's ANY doubt about authenticity, mark as FAKE
5. Modern AI can create very realistic images - look for subtle signs
6. Pay special attention to skin texture, lighting consistency, and digital artifacts

Analyze this ${fileType.startsWith('image') ? 'image' : 'media'} now and determine if it's AI-generated/deepfake:`;
    
    // Update progress
    await supabase
      .from('analysis_queue')
      .update({ progress: 50 })
      .eq('id', queueId);
    
    console.log(`📡 Calling Gemini API for analysis...`);
    
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
      console.error(`❌ Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }

    const result = await geminiResponse.json();
    
    // Process the response
    const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!analysisText) {
      console.error('❌ Invalid response structure:', result);
      throw new Error("Invalid response from AI analysis service");
    }
    
    console.log(`🤖 RAW AI RESPONSE:\n${analysisText}\n`);
    
    // Parse the AI response with improved regex
    const resultMatch = analysisText.match(/RESULT:\s*(REAL|FAKE)/i);
    const confidenceMatch = analysisText.match(/CONFIDENCE:\s*(\d+)/i);
    const explanationMatch = analysisText.match(/EXPLANATION:\s*(.*?)(?=\n\n|$)/is);
    
    const detectionResult = resultMatch ? resultMatch[1].toUpperCase() : 'UNKNOWN';
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
    const explanation = explanationMatch ? explanationMatch[1].trim() : analysisText;
    
    // DETERMINE if it's a deepfake - FAKE means deepfake detected
    const isDeepfake = detectionResult === 'FAKE';
    
    console.log(`🎯 PARSED RESULTS:
    - Detection Result: ${detectionResult}
    - Is Deepfake: ${isDeepfake}  
    - Confidence: ${confidence}
    - Explanation: ${explanation.substring(0, 100)}...`);
    
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

    console.log(`💾 SAVING TO DATABASE:
    - Queue ID: ${queueId}
    - is_deepfake: ${isDeepfake}
    - confidence: ${confidence}`);

    // Update the queue item with results
    const { data: updateData, error: updateError } = await supabase
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
      .eq('id', queueId)
      .select('*');

    if (updateError) {
      console.error('❌ DATABASE UPDATE ERROR:', updateError);
      throw new Error('Failed to update analysis results in database');
    }

    console.log(`✅ DATABASE UPDATE SUCCESS:`, updateData);
    console.log('✅ Analysis completed successfully');

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ ERROR in analyze-deepfake function:", error);
    
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
      console.error('❌ Failed to update queue item as failed:', updateError);
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
