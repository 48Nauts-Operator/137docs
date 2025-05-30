import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { processingApi } from '../../services/api';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ProcessingStatus {
  processing: {
    count: number;
    documents: Array<{
      id: number;
      title: string;
      filename: string;
      created_at?: string;
      updated_at?: string;
    }>;
  };
  recent_failed: {
    count: number;
    documents: Array<{
      id: number;
      title: string;
      filename: string;
      updated_at?: string;
    }>;
  };
  recent_success: {
    count: number;
    documents: Array<{
      id: number;
      title: string;
      filename: string;
      updated_at?: string;
    }>;
  };
  watcher_active: boolean;
  stats: {
    recent_activity_count: number;
    processing_count: number;
    failed_count: number;
  };
}

const ProcessingQueue: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProcessingStatus = async () => {
    try {
      // Use the processingApi service which handles authentication automatically
      const data = await processingApi.getStatus();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching processing status:', err);
      setError(err.response?.data?.detail || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessingStatus();
    
    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchProcessingStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Processing Now
            <Badge variant="destructive">Error</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load processing status: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Processing Now
          {!loading && status && (
            <>
              <Badge variant={status.processing.count > 0 ? "default" : "secondary"}>
                {status.processing.count}
              </Badge>
              {status.watcher_active && (
                <Badge variant="outline" className="text-xs">
                  Watcher Active
                </Badge>
              )}
            </>
          )}
        </CardTitle>
        {/* Activity Queue Subheader */}
        <Link 
          to="/processing-activity" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors flex items-center gap-1 mt-1"
        >
          <span>Activity Queue</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        )}
        {!loading && status && status.processing.count === 0 && (
          <>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              Queue is empty.
            </p>
            {status.stats.recent_activity_count > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {status.stats.recent_activity_count} documents processed recently
              </p>
            )}
            {status.recent_failed.count > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {status.recent_failed.count} recent failures
              </p>
            )}
          </>
        )}
        {!loading && status && status.processing.documents.slice(0, 5).map((doc) => (
          <div key={doc.id} className="flex items-center justify-between text-sm">
            <span className="truncate max-w-[60%]" title={doc.filename}>
              {doc.title}
            </span>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              {doc.updated_at && formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
            </span>
          </div>
        ))}
        {!loading && status && status.processing.count > 5 && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
            +{status.processing.count - 5} more processing...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingQueue; 