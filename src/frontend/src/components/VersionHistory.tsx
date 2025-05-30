import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Zap, 
  BarChart, 
  Bot, 
  Users, 
  Shield,
  Layers,
  Activity,
  Calendar
} from 'lucide-react';

const versionHistory = [
  {
    version: '0.92.0',
    date: 'May 30, 2025',
    title: 'Document Processing Rule Engine',
    status: 'current',
    features: [
      {
        icon: <Settings className="w-4 h-4" />,
        title: 'Visual Rule Builder',
        description: 'Intuitive drag-and-drop interface for creating automation rules with real-time validation'
      },
      {
        icon: <Zap className="w-4 h-4" />,
        title: 'Smart Automation',
        description: 'Automated document classification, tenant assignment, and workflow processing based on flexible conditions'
      },
      {
        icon: <Activity className="w-4 h-4" />,
        title: 'Real-time Processing Monitor',
        description: 'Live dashboard showing document processing status with detailed step-by-step tracking'
      },
      {
        icon: <Layers className="w-4 h-4" />,
        title: 'Priority-based Execution',
        description: 'Rules execute in order of importance with comprehensive action support and usage analytics'
      },
      {
        icon: <BarChart className="w-4 h-4" />,
        title: 'Rule Analytics',
        description: 'Track rule effectiveness and optimization opportunities with match statistics'
      }
    ]
  },
  {
    version: '0.91.0',
    date: 'May 27, 2025',
    title: 'Vendor Analytics Feature',
    status: 'previous',
    features: [
      {
        icon: <BarChart className="w-4 h-4" />,
        title: 'Dynamic Vendor Insights',
        description: 'One-click vendor analytics with interactive charts and spending analysis'
      },
      {
        icon: <Bot className="w-4 h-4" />,
        title: 'Missing Invoice Detection',
        description: 'AI-powered pattern recognition identifies gaps in vendor billing cycles'
      },
      {
        icon: <Activity className="w-4 h-4" />,
        title: 'Frequency Analysis',
        description: 'Automatic categorization of vendor billing patterns and anomaly detection'
      }
    ]
  },
  {
    version: '0.90.0',
    date: 'May 25, 2025',
    title: 'LLM Integration & Multi-Provider Support',
    status: 'previous',
    features: [
      {
        icon: <Bot className="w-4 h-4" />,
        title: 'Multi-Provider AI Support',
        description: 'Ollama (local), OpenAI, Anthropic, and LiteLLM integration with privacy-first local processing'
      },
      {
        icon: <Shield className="w-4 h-4" />,
        title: 'Automated Document Analysis',
        description: 'AI-powered content extraction, tagging, and metadata analysis with real-time processing'
      },
      {
        icon: <Settings className="w-4 h-4" />,
        title: 'Complete AI Configuration',
        description: 'Settings UI for LLM configuration with connection testing and provider switching'
      }
    ]
  },
  {
    version: '0.89.0',
    date: 'May 22, 2025',
    title: 'Multi-Tenant System',
    status: 'previous',
    features: [
      {
        icon: <Users className="w-4 h-4" />,
        title: 'Complete Tenant Management',
        description: 'Company/individual profile management with automatic document-to-tenant assignment'
      },
      {
        icon: <Bot className="w-4 h-4" />,
        title: 'AI Tenant Extraction',
        description: 'Intelligent recipient detection and matching with fuzzy search algorithms'
      },
      {
        icon: <Activity className="w-4 h-4" />,
        title: 'Seamless Context Switching',
        description: 'Dynamic tenant switching with automatic document filtering and organization'
      }
    ]
  }
];

const VersionHistory: React.FC = () => {
  const currentVersion = versionHistory[0];
  
  return (
    <div className="space-y-6">
      {/* Current Version Highlight */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-900">
              Current Version: {currentVersion.version}
            </CardTitle>
            <Badge variant="default" className="bg-blue-600">
              {currentVersion.date}
            </Badge>
          </div>
          <p className="text-blue-700 font-medium">{currentVersion.title}</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {currentVersion.features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="text-blue-600 mt-0.5">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">{feature.title}</h4>
                  <p className="text-sm text-blue-700">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Updates</h3>
        {versionHistory.slice(1).map((version, index) => (
          <Card key={index} className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">
                  Version {version.version}
                </CardTitle>
                <Badge variant="outline" className="text-gray-600">
                  {version.date}
                </Badge>
              </div>
              <p className="text-gray-700 font-medium">{version.title}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {version.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <div className="text-gray-500 mt-0.5">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Stats */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-lg text-green-900">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-700">100%</div>
              <div className="text-sm text-green-600">Core Features</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">59</div>
              <div className="text-sm text-green-600">Completed Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">8</div>
              <div className="text-sm text-green-600">Major Releases</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">0</div>
              <div className="text-sm text-green-600">Known Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VersionHistory; 