
import { supabase } from '../integrations/supabase/client';

interface QueueItem {
  file_name: string;
  file_type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  user_session: string;
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
      const { data, error } = await supabase
        .from('analysis_queue')
        .insert([
          {
            file_name: fileName,
            file_type: fileType,
            status: 'queued',
            user_session: getSessionId(),
            progress: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding to queue:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to add to queue:', err);
      return null;
    }
  };

  const updateQueueItem = async (id: string, updates: Partial<QueueItem>) => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating queue item:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to update queue item:', err);
      return null;
    }
  };

  const completeQueueItem = async (id: string, success: boolean = true) => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue')
        .update({
          status: success ? 'completed' : 'failed',
          progress: 100,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error completing queue item:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to complete queue item:', err);
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
