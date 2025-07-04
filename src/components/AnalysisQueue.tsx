
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Clock, CheckCircle, XCircle, Loader2, FileText, Shield, AlertTriangle } from 'lucide-react';

interface QueueItem {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  progress: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  is_deepfake: boolean | null;
  confidence: number | null;
  analysis_result: any;
  explanation: string | null;
  user_session: string;
}

const AnalysisQueue = () => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate or get session ID for tracking
  const getSessionId = () => {
    let sessionId = localStorage.getItem('analysis_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analysis_session_id', sessionId);
    }
    return sessionId;
  };

  useEffect(() => {
    const sessionId = getSessionId();
    
    // Fetch initial queue items
    const fetchQueueItems = async () => {
      try {
        const { data, error } = await supabase
          .from('analysis_queue')
          .select('*')
          .eq('user_session', sessionId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching queue items:', error);
          return;
        }

        console.log('📋 Fetched queue items:', data);
        setQueueItems(data || []);
      } catch (err) {
        console.error('Failed to fetch queue items:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueueItems();

    // Set up real-time subscription
    const channel = supabase
      .channel('analysis-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_queue',
          filter: `user_session=eq.${sessionId}`
        },
        (payload) => {
          console.log('🔄 Real-time queue update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setQueueItems(prev => [payload.new as QueueItem, ...prev.slice(0, 9)]);
          } else if (payload.eventType === 'UPDATE') {
            setQueueItems(prev => 
              prev.map(item => 
                item.id === payload.new.id ? payload.new as QueueItem : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setQueueItems(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDetectionResult = (item: QueueItem) => {
    if (item.status !== 'completed') {
      return null;
    }

    console.log(`🔍 ANALYZING DETECTION for ${item.file_name}:`);
    console.log(`- Database is_deepfake: ${item.is_deepfake}`);
    console.log(`- Database confidence: ${item.confidence}`);
    console.log(`- analysis_result:`, item.analysis_result);

    let isDeepfake = false;
    
    // Strategy 1: Check analysis_result.isDeepfake (most reliable)
    if (item.analysis_result && typeof item.analysis_result === 'object') {
      if ('isDeepfake' in item.analysis_result) {
        isDeepfake = item.analysis_result.isDeepfake === true;
        console.log(`✅ Using analysis_result.isDeepfake: ${isDeepfake}`);
      } else if ('result' in item.analysis_result) {
        // Strategy 2: Check analysis_result.result
        isDeepfake = item.analysis_result.result === 'FAKE';
        console.log(`✅ Using analysis_result.result=${item.analysis_result.result}: ${isDeepfake}`);
      }
    }
    
    // Strategy 3: Fallback to database column
    if (item.analysis_result === null || item.analysis_result === undefined) {
      isDeepfake = item.is_deepfake === true;
      console.log(`⚠️ Fallback to is_deepfake column: ${isDeepfake}`);
    }

    console.log(`🎯 FINAL DECISION for ${item.file_name}: ${isDeepfake ? 'DEEPFAKE' : 'AUTHENTIC'}`);

    return (
      <div className="flex items-center gap-2 mt-2">
        {isDeepfake ? (
          <>
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-red-700">
              Deepfake Detected
            </span>
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-green-700">
              Authentic
            </span>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <h3 className="text-lg font-semibold">Loading Analysis Queue...</h3>
        </div>
      </div>
    );
  }

  if (queueItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Analysis Queue</h3>
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No analyses in queue</p>
          <p className="text-sm">Upload a file to start analyzing for deepfakes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Analysis Queue</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live Updates
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {queueItems.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <div>
                  <p className="font-medium text-sm truncate max-w-48" title={item.file_name}>
                    {item.file_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{item.file_type}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                  item.status
                )}`}
              >
                {item.status}
              </span>
            </div>
            
            {item.status === 'processing' && item.progress && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {getDetectionResult(item)}
            
            <div className="mt-2 text-xs text-gray-400">
              {new Date(item.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisQueue;
