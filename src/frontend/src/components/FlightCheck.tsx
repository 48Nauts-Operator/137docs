import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  RefreshCw,
  Database,
  Brain,
  Server,
  Shield,
  BarChart3,
  Users,
  Settings,
  Zap,
  Clock,
  Activity
} from 'lucide-react';

interface CheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
  message: string;
  details?: Record<string, any>;
}

interface CategoryResult {
  name: string;
  tests_passed: number;
  tests_failed: number;
  checks: Record<string, CheckResult>;
}

interface FlightCheckResults {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'running';
  timestamp: string;
  duration_seconds: number;
  tests_passed: number;
  tests_failed: number;
  tests_total: number;
  check_type?: string;
  checks?: Record<string, CheckResult>;
  categories?: Record<string, CategoryResult>;
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

type CheckType = 'quick' | 'comprehensive' | 'deep';

const STATUS_ICONS = {
  healthy: CheckCircle,
  degraded: AlertTriangle,
  unhealthy: XCircle,
  disabled: AlertTriangle,
  running: Loader2
};

const STATUS_COLORS = {
  healthy: 'text-green-500',
  degraded: 'text-yellow-500',
  unhealthy: 'text-red-500',
  disabled: 'text-gray-500',
  running: 'text-blue-500'
};

const STATUS_VARIANTS = {
  healthy: 'default' as const,
  degraded: 'secondary' as const,
  unhealthy: 'destructive' as const,
  disabled: 'outline' as const,
  running: 'default' as const
};

const CATEGORY_ICONS = {
  'Critical Systems': Database,
  'AI & LLM Services': Brain,
  'File System & Processing': Server,
  'Multi-Tenant System': Users,
  'Analytics & Reporting': BarChart3,
  'Performance': Zap,
  'Security': Shield,
  'Integrations': Settings
};

const FlightCheck: React.FC = () => {
  const [results, setResults] = useState<FlightCheckResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCheck, setCurrentCheck] = useState<CheckType>('quick');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const runFlightCheck = async (checkType: CheckType) => {
    setLoading(true);
    setError(null);
    setCurrentCheck(checkType);

    try {
      const endpoint = checkType === 'quick' 
        ? '/api/flight-check/health'
        : `/api/flight-check/${checkType}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Check failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Flight check failed');
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    if (autoRefresh) {
      setAutoRefresh(false);
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    } else {
      setAutoRefresh(true);
      const interval = setInterval(() => {
        runFlightCheck('quick');
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    }
  };

  useEffect(() => {
    // Run initial quick check
    runFlightCheck('quick');

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const StatusIcon: React.FC<{ status: string; className?: string }> = ({ status, className = '' }) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || AlertTriangle;
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'text-gray-500';
    
    return (
      <Icon 
        className={`h-5 w-5 ${colorClass} ${status === 'running' ? 'animate-spin' : ''} ${className}`} 
      />
    );
  };

  const CategoryIcon: React.FC<{ categoryName: string; className?: string }> = ({ categoryName, className = '' }) => {
    const Icon = CATEGORY_ICONS[categoryName as keyof typeof CATEGORY_ICONS] || Settings;
    return <Icon className={`h-5 w-5 ${className}`} />;
  };

  const renderCheckDetails = (check: CheckResult) => {
    if (!check.details) return null;

    return (
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <details>
          <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
            View Details
          </summary>
          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(check.details, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    );
  };

  const renderQuickChecks = () => {
    if (!results?.checks) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(results.checks).map(([key, check]) => (
          <Card key={key} className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <StatusIcon status={check.status} />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {check.message}
              </p>
              {renderCheckDetails(check)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCategoryChecks = () => {
    if (!results?.categories) return null;

    return (
      <div className="space-y-6">
        {Object.entries(results.categories).map(([categoryKey, category]) => (
          <Card key={categoryKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CategoryIcon categoryName={category.name} />
                {category.name}
                <Badge variant={category.tests_failed === 0 ? 'default' : 'destructive'}>
                  {category.tests_passed}/{category.tests_passed + category.tests_failed}
                </Badge>
              </CardTitle>
              <CardDescription>
                {category.tests_passed} tests passed, {category.tests_failed} failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(category.checks).map(([checkKey, check]) => (
                  <div key={checkKey} className="flex items-start gap-3 p-3 border rounded-lg">
                    <StatusIcon status={check.status} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {checkKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {check.message}
                      </p>
                      {renderCheckDetails(check)}
                    </div>
                    <Badge variant={STATUS_VARIANTS[check.status]}>
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Flight Check</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive platform diagnostics and health monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={startAutoRefresh}
            className={autoRefresh ? 'bg-green-100 text-green-700' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Run Diagnostics
          </CardTitle>
          <CardDescription>
            Choose the type of diagnostic check to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => runFlightCheck('quick')}
              disabled={loading}
              variant={currentCheck === 'quick' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              {loading && currentCheck === 'quick' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Quick Check (30s)
            </Button>
            <Button
              onClick={() => runFlightCheck('comprehensive')}
              disabled={loading}
              variant={currentCheck === 'comprehensive' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              {loading && currentCheck === 'comprehensive' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Comprehensive (5m)
            </Button>
            <Button
              onClick={() => runFlightCheck('deep')}
              disabled={loading}
              variant={currentCheck === 'deep' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              {loading && currentCheck === 'deep' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Deep Diagnostic (15m)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.status} />
                System Status: {results.status.toUpperCase()}
              </CardTitle>
              <CardDescription>
                Last check: {new Date(results.timestamp).toLocaleString()} • 
                Duration: {results.duration_seconds}s • 
                Type: {results.check_type || currentCheck}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tests Passed</span>
                    <span>{results.tests_passed}/{results.tests_total}</span>
                  </div>
                  <Progress 
                    value={(results.tests_passed / results.tests_total) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-500">
                    {results.tests_passed}
                  </div>
                  <div className="text-sm text-gray-500">passed</div>
                </div>
                {results.tests_failed > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-500">
                      {results.tests_failed}
                    </div>
                    <div className="text-sm text-gray-500">failed</div>
                  </div>
                )}
              </div>

              {results.user && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <strong>User:</strong> {results.user.username} • 
                  <strong>Role:</strong> {results.user.role}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              {results.checks && renderQuickChecks()}
              {results.categories && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">System Categories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(results.categories).map(([categoryKey, category]) => (
                      <Card key={categoryKey}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CategoryIcon categoryName={category.name} />
                            {category.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <Badge variant={category.tests_failed === 0 ? 'default' : 'destructive'}>
                              {category.tests_passed}/{category.tests_passed + category.tests_failed}
                            </Badge>
                            <StatusIcon 
                              status={category.tests_failed === 0 ? 'healthy' : 'degraded'} 
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="detailed" className="mt-6">
              {results.categories ? renderCategoryChecks() : renderQuickChecks()}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <div className="text-center">
                <p className="font-medium">Running {currentCheck} flight check...</p>
                <p className="text-sm text-gray-500 mt-1">
                  {currentCheck === 'quick' && 'This should take about 30 seconds'}
                  {currentCheck === 'comprehensive' && 'This may take up to 5 minutes'}
                  {currentCheck === 'deep' && 'This may take up to 15 minutes'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlightCheck; 