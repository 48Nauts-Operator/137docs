import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useDocuments } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const ProcessingQueue: React.FC = () => {
  const { documents = [], loading } = useDocuments({ status: 'processing' });

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Processing Now
          {!loading && <Badge>{documents.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        )}
        {!loading && documents.length === 0 && (
          <p className="text-sm text-secondary-500 dark:text-secondary-400">Queue is empty.</p>
        )}
        {!loading && documents.slice(0, 5).map((d: any) => (
          <div key={d.id} className="flex items-center justify-between text-sm">
            <span className="truncate max-w-[60%]">{d.title || d.filename}</span>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              {formatDistanceToNow(new Date(d.updated_at || d.created_at), { addSuffix: true })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProcessingQueue; 