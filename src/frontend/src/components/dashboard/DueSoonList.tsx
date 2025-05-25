import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useDocuments } from '../../services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const DueSoonList: React.FC = () => {
  // fetch unpaid with due_date within 7 days or overdue
  const { documents = [], loading } = useDocuments({ status: 'unpaid', due_soon: 7 });

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Due Soon
          {!loading && <Badge>{documents.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <Skeleton className="h-20 w-full" />}
        {!loading && documents.filter((d:any)=>{
          const dt = new Date(d.due_date);
          return !isNaN(dt.getTime());
        }).slice(0,5).map((d:any)=> {
          const dt = new Date(d.due_date);
          return (
            <div key={d.id} className="flex items-start justify-between text-sm">
              <div>
                <p className="font-medium truncate max-w-[160px]">{d.title || d.filename}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  Due {format(dt, 'PPP')}
                </p>
              </div>
              <Badge variant={dt<new Date()? 'destructive':'secondary'}>
                {dt<new Date()? 'Overdue':'Unpaid'}
              </Badge>
            </div>
          );
        })}
        <Button variant="outline" size="sm" asChild className="mt-2">
          <Link to="/invoices?filter=due">Review Invoices</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default DueSoonList; 