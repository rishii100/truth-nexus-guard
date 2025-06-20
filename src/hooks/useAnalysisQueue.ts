
import { supabase } from '../integrations/supabase/client';

interface QueueItem {
  file_name: string;
  file_type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  user_session: string;
  is_deepfake?: boolean;
  confidence?: number;
  analysis_result?: any;
  explanation?: string;
}

interface QueueUpdate {
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  is_deepfake?: boolean;
  confidence?: number;
  analysis_result?: any;
  explanation?: string;
  completed_at?: string;
}

export const useAnalysisQueue = () => {
  const getSessionId = () => {
    let sessionId = localStorage.getItem('analysis_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analysis_session_id', sessionId);
    }
    return sessionId;
  };

  const addToQueue = async (fileName: string, fileType: string) => {
    try {
      console.log('🔄 Adding to queue:', { fileName, fileType, session: getSessionId() });
      
      const { data, error } = await supabase
        .from('analysis_queue')
        .insert([
          {
            file_name: fileName,
            file_type: fileType,
            status: 'queued',
            user_session: getSessionId(),
            progress: 0,
            is_deepfake: false,
            confidence: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding to queue:', error);
        return null;
      }

      console.log('✅ Successfully added to queue:', data);
      return data;
    } catch (err) {
      console.error('❌ Failed to add to queue:', err);
      return null;
    }
  };

  const updateQueueItem = async (id: string, updates: QueueUpdate) => {
    try {
      console.log('🔄 Updating queue item:', id, updates);
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
        ...updates
      };

      const { data, error } = await supabase
        .from('analysis_queue')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating queue item:', error);
        return null;
      }

      console.log('✅ Successfully updated queue item:', data);
      return data;
    } catch (err) {
      console.error('❌ Failed to update queue item:', err);
      return null;
    }
  };

  const completeQueueItem = async (id: string, success: boolean = true, analysisResult?: any) => {
    try {
      const updateData: any = {
        status: success ? 'completed' : 'failed',
        progress: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (analysisResult) {
        updateData.is_deepfake = analysisResult.isDeepfake;
        updateData.confidence = analysisResult.confidence;
        updateData.analysis_result = analysisResult;
        updateData.explanation = analysisResult.explanation;
      }

      const { data, error } = await supabase
        .from('analysis_queue')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error completing queue item:', error);
        return null;
      }

      console.log('✅ Successfully completed queue item:', data);
      return data;
    } catch (err) {
      console.error('❌ Failed to complete queue item:', err);
      return null;
    }
  };

  return {
    addToQueue,
    updateQueueItem,
    completeQueueItem,
    getSessionId
  };
};
