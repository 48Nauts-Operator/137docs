import React, { useState, useEffect } from 'react';
import { Brain, TestTube, CheckCircle, XCircle, AlertCircle, Info, ExternalLink, Loader2, Zap } from 'lucide-react';
import { settingsApi } from '../../services/api';

interface LLMConfig {
  provider: string;
  api_key: string;
  api_url: string;
  model_tagger: string;
  model_enricher: string;
  model_analytics: string;
  model_responder: string;
  enabled: boolean;
  auto_tagging: boolean;
  auto_enrichment: boolean;
  external_enrichment: boolean;
  max_retries: number;
  retry_delay: number;
  backup_provider: string;
  backup_model: string;
  batch_size: number;
  concurrent_tasks: number;
  cache_responses: boolean;
  min_confidence_tagging: number;
  min_confidence_entity: number;
}

interface ConnectionTestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  availableModels: string[];
  debugInfo?: {
    provider: string;
    apiUrl: string;
    hasApiKey: boolean;
    testDetails: string[];
  };
}

interface LLMConfigSectionProps {
  onSave?: (config: LLMConfig) => void;
  className?: string;
}

const LLMConfigSection: React.FC<LLMConfigSectionProps> = ({ onSave, className = '' }) => {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'local',
    api_key: '',
    api_url: '',
    model_tagger: 'phi3',
    model_enricher: 'llama3',
    model_analytics: 'llama3',
    model_responder: '',
    enabled: false,
    auto_tagging: true,
    auto_enrichment: true,
    external_enrichment: false,
    max_retries: 3,
    retry_delay: 300,
    backup_provider: '',
    backup_model: '',
    batch_size: 5,
    concurrent_tasks: 2,
    cache_responses: true,
    min_confidence_tagging: 0.7,
    min_confidence_entity: 0.8,
  });

  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult>({
    status: 'idle',
    message: '',
    availableModels: [],
  });

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await settingsApi.getLlmConfig();
        if (data && data.config) {
          setConfig(prev => ({ ...prev, ...data.config }));
        }
      } catch (error) {
        console.error('Failed to load LLM config:', error);
      }
    };
    loadConfig();
  }, []);

  // Clear available models when provider changes
  useEffect(() => {
    setConnectionTest(prev => ({
      ...prev,
      availableModels: [],
      status: 'idle',
      message: '',
      debugInfo: undefined
    }));
  }, [config.provider]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Test connection
  const handleTestConnection = async () => {
    const testApiUrl = config.api_url || providerInfo.defaultUrl;
    const hasApiKey = Boolean(config.api_key);
    
    setConnectionTest({ 
      status: 'testing', 
      message: 'Testing connection...', 
      availableModels: [],
      debugInfo: {
        provider: config.provider,
        apiUrl: testApiUrl,
        hasApiKey,
        testDetails: [
          `Provider: ${providerInfo.name}`,
          `URL: ${testApiUrl}`,
          `API Key: ${hasApiKey ? 'Provided' : 'Not provided'}`,
          'Testing connectivity...'
        ]
      }
    });
    
    try {
      const result = await settingsApi.testLlmConnection(
        config.provider,
        config.api_url || undefined,
        config.api_key || undefined
      );
      
      setConnectionTest({
        status: result.status === 'success' ? 'success' : 'error',
        message: result.message,
        availableModels: result.available_models || [],
        debugInfo: {
          provider: config.provider,
          apiUrl: testApiUrl,
          hasApiKey,
          testDetails: [
            `Provider: ${providerInfo.name}`,
            `URL: ${testApiUrl}`,
            `API Key: ${hasApiKey ? 'Provided' : 'Not provided'}`,
            `Status: ${result.status}`,
            `Models found: ${result.available_models?.length || 0}`,
            ...(result.debug_info?.test_details || []),
            // Add backend response details for debugging
            result.status === 'error' ? `Backend Error: ${result.message}` : ''
          ].filter(Boolean)
        }
      });
    } catch (error: any) {
      console.error('Connection test error:', error);
      setConnectionTest({
        status: 'error',
        message: error.response?.data?.detail || error.message || 'Connection test failed',
        availableModels: [],
        debugInfo: {
          provider: config.provider,
          apiUrl: testApiUrl,
          hasApiKey,
          testDetails: [
            `Provider: ${providerInfo.name}`,
            `URL: ${testApiUrl}`,
            `API Key: ${hasApiKey ? 'Provided' : 'Not provided'}`,
            'Status: Failed',
            `Error: ${error.response?.data?.detail || error.message || 'Unknown error'}`,
            ...(error.response?.data?.debug_info?.test_details || [])
          ]
        }
      });
    }
  };

  // Save configuration
  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsApi.updateLlmConfig(config);
      if (onSave) {
        onSave(config);
      }
    } catch (error) {
      console.error('Failed to save LLM config:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'local':
        return {
          name: 'Local (Ollama)',
          description: 'Run models locally using Ollama. Privacy-first, no data leaves your machine.',
          setupUrl: 'https://ollama.ai',
          requiresApiKey: false,
          defaultUrl: 'http://host.docker.internal:11434',
        };
      case 'openai':
        return {
          name: 'OpenAI',
          description: 'Use OpenAI\'s GPT models. Requires API key and internet connection.',
          setupUrl: 'https://platform.openai.com/api-keys',
          requiresApiKey: true,
          defaultUrl: 'https://api.openai.com/v1',
        };
      case 'anthropic':
        return {
          name: 'Anthropic',
          description: 'Use Anthropic\'s Claude models. Requires API key and internet connection.',
          setupUrl: 'https://console.anthropic.com',
          requiresApiKey: true,
          defaultUrl: 'https://api.anthropic.com',
        };
      case 'litellm':
        return {
          name: 'LiteLLM Proxy',
          description: 'Connect to LiteLLM proxy server. Supports 100+ models from OpenAI, Anthropic, Cohere, and more. Requires a virtual API key (e.g., sk-1234).',
          setupUrl: 'https://docs.litellm.ai/docs/proxy/quick_start',
          requiresApiKey: true,
          defaultUrl: 'http://host.docker.internal:4000',
        };
      case 'custom':
        return {
          name: 'Custom API',
          description: 'Connect to any custom LLM API endpoint with OpenAI-compatible interface.',
          setupUrl: null,
          requiresApiKey: false,
          defaultUrl: '',
        };
      default:
        return {
          name: provider,
          description: '',
          setupUrl: null,
          requiresApiKey: false,
          defaultUrl: '',
        };
    }
  };

  const providerInfo = getProviderInfo(config.provider);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-primary-600" />
          <div>
            <h2 className="text-lg font-medium">AI/LLM Configuration</h2>
            <p className="text-sm text-secondary-500">Configure AI models for document processing</p>
          </div>
        </div>
        {/* Test Connection Button */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={connectionTest.status === 'testing'}
            className="btn-primary flex items-center space-x-2"
          >
            {connectionTest.status === 'testing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Test Connection</span>
              </>
            )}
          </button>
          
          {connectionTest.status === 'testing' && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm">Testing connection...</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Test Results */}
      {connectionTest.status !== 'idle' && (
        <div className={`p-4 rounded-lg border ${
          connectionTest.status === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          connectionTest.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {connectionTest.status === 'testing' && <Loader2 size={20} className="text-blue-500 animate-spin" />}
              {connectionTest.status === 'success' && <CheckCircle size={20} className="text-green-500" />}
              {connectionTest.status === 'error' && <AlertCircle size={20} className="text-red-500" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className={`font-medium ${
                  connectionTest.status === 'success' ? 'text-green-800 dark:text-green-200' :
                  connectionTest.status === 'error' ? 'text-red-800 dark:text-red-200' :
                  'text-blue-800 dark:text-blue-200'
                }`}>
                  {connectionTest.status === 'testing' && 'Testing connection...'}
                  {connectionTest.status === 'success' && 'Connection successful!'}
                  {connectionTest.status === 'error' && 'Connection failed'}
                </h4>
                
                {connectionTest.status === 'success' && connectionTest.availableModels.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    {connectionTest.availableModels.length} models found
                  </span>
                )}
              </div>

              {/* Enhanced Error Message */}
              {connectionTest.status === 'error' && connectionTest.message && (
                <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error Details:</p>
                  <p className="text-sm text-red-700 dark:text-red-300 font-mono break-words">
                    {connectionTest.message}
                  </p>
                  
                  {/* Common error solutions */}
                  {(connectionTest.message.includes('connection') || connectionTest.message.includes('timeout')) && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      <p className="font-medium">💡 Common solutions:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Check if the service is running at the specified URL</li>
                        <li>Verify the API URL format is correct</li>
                        <li>Ensure network connectivity and firewall settings</li>
                        {config.provider === 'litellm' && (
                          <li className="font-semibold text-red-700 dark:text-red-300">
                            🚨 For LiteLLM: Use <code className="bg-red-200 dark:bg-red-800 px-1 rounded">host.docker.internal:4000</code> instead of local IP addresses
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {connectionTest.message.includes('authentication') && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      <p className="font-medium">💡 Authentication issue:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Verify your API key is correct and active</li>
                        <li>Check if the API key has the required permissions</li>
                        <li>For LiteLLM, ensure you're using a virtual key (e.g., sk-1234)</li>
                      </ul>
                    </div>
                  )}
                  
                  {config.provider === 'litellm' && connectionTest.message.includes('192.168') && (
                    <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300 dark:border-yellow-700">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                        🔧 <strong>Docker Networking Issue Detected:</strong>
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        You're using a local IP address (<code>192.168.x.x</code>) which won't work from Docker containers.
                        Please use <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">host.docker.internal:4000</code> instead.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Debug Information */}
              {connectionTest.debugInfo && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Test Details:</p>
                  <div className="bg-secondary-100 dark:bg-secondary-800 rounded p-3 font-mono text-xs space-y-1">
                    {connectionTest.debugInfo.testDetails.map((detail, index) => (
                      <div key={index} className="text-secondary-700 dark:text-secondary-300">
                        {detail}
                      </div>
                    ))}
                  </div>
                  
                  {connectionTest.status === 'error' && (
                    <div className="mt-2 text-xs text-secondary-600 dark:text-secondary-400">
                      <p>Status: <span className="font-medium text-red-600 dark:text-red-400">error</span></p>
                      <p>Models found: <span className="font-medium">{connectionTest.availableModels.length}</span></p>
                    </div>
                  )}
                </div>
              )}

              {/* Success Information */}
              {connectionTest.status === 'success' && (
                <div className="space-y-2">
                  {connectionTest.availableModels.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Available Models:</p>
                      <div className="flex flex-wrap gap-1">
                        {connectionTest.availableModels.slice(0, 5).map((model, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            {model}
                          </span>
                        ))}
                        {connectionTest.availableModels.length > 5 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300">
                            +{connectionTest.availableModels.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✅ Connection established successfully! You can now configure models below.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Features Toggle - Moved to top */}
      <div className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-primary-500" />
          <div>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
              Enable AI Features
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Master switch for all AI/LLM functionality
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            checked={config.enabled}
            onChange={handleChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {/* Provider Configuration */}
      <div className="space-y-4">
        <h3 className="text-md font-medium">Provider Configuration</h3>
        
        <div>
          <label htmlFor="provider" className="form-label">AI Provider</label>
          <select
            id="provider"
            name="provider"
            className="form-input"
            value={config.provider}
            onChange={handleChange}
          >
            <option value="local">Ollama (Local)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="litellm">LiteLLM Proxy</option>
            <option value="custom">Custom API</option>
          </select>
          <p className="text-xs text-secondary-500 mt-1">{providerInfo.description}</p>
        </div>

        {/* Provider Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{providerInfo.name}:</strong> {providerInfo.description}
              </p>
              {providerInfo.setupUrl && (
                <a
                  href={providerInfo.setupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  <span>Setup Guide</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>

        {providerInfo.requiresApiKey && (
          <div>
            <label htmlFor="api_key" className="form-label">
              API Key
              {config.provider === 'litellm' && (
                <span className="text-xs text-secondary-500 ml-2">
                  (Use virtual key like sk-1234 for LiteLLM)
                </span>
              )}
            </label>
            <input
              type="password"
              id="api_key"
              name="api_key"
              className="form-input"
              value={config.api_key}
              onChange={handleChange}
              placeholder={config.provider === 'litellm' ? 'sk-1234' : 'Enter your API key'}
            />
            {config.provider === 'litellm' && (
              <p className="text-xs text-secondary-500 mt-1">
                LiteLLM uses virtual API keys. See{' '}
                <a 
                  href="https://docs.litellm.ai/docs/proxy/quick_start" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600"
                >
                  setup guide
                </a>
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="api_url" className="form-label">API URL</label>
          <input
            type="url"
            id="api_url"
            name="api_url"
            className="form-input"
            value={config.api_url}
            onChange={handleChange}
            placeholder={providerInfo.defaultUrl}
          />
          <p className="text-xs text-secondary-500 mt-1">
            Leave empty to use default: {providerInfo.defaultUrl}
          </p>
        </div>
      </div>

      {/* Model Configuration */}
      <div className="space-y-4">
        <h3 className="text-md font-medium">Model Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="model_tagger" className="form-label">Tagging Model</label>
            {connectionTest.availableModels.length > 0 ? (
              <select
                id="model_tagger"
                name="model_tagger"
                className="form-input"
                value={config.model_tagger}
                onChange={handleChange}
              >
                <option value="">Select a model...</option>
                {connectionTest.availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="model_tagger"
                name="model_tagger"
                className="form-input"
                value={config.model_tagger}
                onChange={handleChange}
                placeholder="phi3"
              />
            )}
            <p className="text-xs text-secondary-500 mt-1">
              Small model for document tagging
              {connectionTest.availableModels.length === 0 && (
                <span className="text-amber-600 dark:text-amber-400"> • Test connection to see available models</span>
              )}
            </p>
          </div>

          <div>
            <label htmlFor="model_enricher" className="form-label">Enrichment Model</label>
            {connectionTest.availableModels.length > 0 ? (
              <select
                id="model_enricher"
                name="model_enricher"
                className="form-input"
                value={config.model_enricher}
                onChange={handleChange}
              >
                <option value="">Select a model...</option>
                {connectionTest.availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="model_enricher"
                name="model_enricher"
                className="form-input"
                value={config.model_enricher}
                onChange={handleChange}
                placeholder="llama3"
              />
            )}
            <p className="text-xs text-secondary-500 mt-1">
              Mid-size model for field completion
              {connectionTest.availableModels.length === 0 && (
                <span className="text-amber-600 dark:text-amber-400"> • Test connection to see available models</span>
              )}
            </p>
          </div>

          <div>
            <label htmlFor="model_analytics" className="form-label">Analytics Model</label>
            {connectionTest.availableModels.length > 0 ? (
              <select
                id="model_analytics"
                name="model_analytics"
                className="form-input"
                value={config.model_analytics}
                onChange={handleChange}
              >
                <option value="">Select a model...</option>
                {connectionTest.availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="model_analytics"
                name="model_analytics"
                className="form-input"
                value={config.model_analytics}
                onChange={handleChange}
                placeholder="llama3"
              />
            )}
            <p className="text-xs text-secondary-500 mt-1">
              Model for analytics and summaries
              {connectionTest.availableModels.length === 0 && (
                <span className="text-amber-600 dark:text-amber-400"> • Test connection to see available models</span>
              )}
            </p>
          </div>

          <div>
            <label htmlFor="model_responder" className="form-label">Response Model (Pro)</label>
            {connectionTest.availableModels.length > 0 ? (
              <select
                id="model_responder"
                name="model_responder"
                className="form-input"
                value={config.model_responder}
                onChange={handleChange}
              >
                <option value="">Select a model...</option>
                {connectionTest.availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="model_responder"
                name="model_responder"
                className="form-input"
                value={config.model_responder}
                onChange={handleChange}
                placeholder="gpt-4"
              />
            )}
            <p className="text-xs text-secondary-500 mt-1">
              Large model for document responses
              {connectionTest.availableModels.length === 0 && (
                <span className="text-amber-600 dark:text-amber-400"> • Test connection to see available models</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Processing Options */}
      <div className="space-y-4">
        <h3 className="text-md font-medium">Processing Options</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto Tagging</h4>
              <p className="text-sm text-secondary-500">Automatically tag documents using AI</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="auto_tagging"
                className="sr-only peer"
                checked={config.auto_tagging}
                onChange={handleChange}
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto Enrichment</h4>
              <p className="text-sm text-secondary-500">Automatically complete missing fields</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="auto_enrichment"
                className="sr-only peer"
                checked={config.auto_enrichment}
                onChange={handleChange}
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">External Enrichment</h4>
              <p className="text-sm text-secondary-500">Use internet data for enrichment</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="external_enrichment"
                className="sr-only peer"
                checked={config.external_enrichment}
                onChange={handleChange}
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Cache Responses</h4>
              <p className="text-sm text-secondary-500">Cache AI responses for faster processing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="cache_responses"
                className="sr-only peer"
                checked={config.cache_responses}
                onChange={handleChange}
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200"
        >
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-6 border-t border-secondary-200 dark:border-secondary-700 pt-6">
          {/* Performance Settings */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Performance Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="batch_size" className="form-label">Batch Size</label>
                <input
                  type="number"
                  id="batch_size"
                  name="batch_size"
                  className="form-input"
                  value={config.batch_size}
                  onChange={handleChange}
                  min="1"
                  max="20"
                />
                <p className="text-xs text-secondary-500 mt-1">Documents processed per batch</p>
              </div>

              <div>
                <label htmlFor="concurrent_tasks" className="form-label">Concurrent Tasks</label>
                <input
                  type="number"
                  id="concurrent_tasks"
                  name="concurrent_tasks"
                  className="form-input"
                  value={config.concurrent_tasks}
                  onChange={handleChange}
                  min="1"
                  max="10"
                />
                <p className="text-xs text-secondary-500 mt-1">Parallel AI operations</p>
              </div>
            </div>
          </div>

          {/* Reliability Settings */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Reliability Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="max_retries" className="form-label">Max Retries</label>
                <input
                  type="number"
                  id="max_retries"
                  name="max_retries"
                  className="form-input"
                  value={config.max_retries}
                  onChange={handleChange}
                  min="1"
                  max="10"
                />
                <p className="text-xs text-secondary-500 mt-1">Retry attempts before fallback</p>
              </div>

              <div>
                <label htmlFor="retry_delay" className="form-label">Retry Delay (seconds)</label>
                <input
                  type="number"
                  id="retry_delay"
                  name="retry_delay"
                  className="form-input"
                  value={config.retry_delay}
                  onChange={handleChange}
                  min="60"
                  max="3600"
                />
                <p className="text-xs text-secondary-500 mt-1">Wait time between retries</p>
              </div>
            </div>
          </div>

          {/* Confidence Thresholds */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Confidence Thresholds</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="min_confidence_tagging" className="form-label">Min Confidence (Tagging)</label>
                <input
                  type="number"
                  id="min_confidence_tagging"
                  name="min_confidence_tagging"
                  className="form-input"
                  value={config.min_confidence_tagging}
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.1"
                />
                <p className="text-xs text-secondary-500 mt-1">Minimum confidence for auto-tagging</p>
              </div>

              <div>
                <label htmlFor="min_confidence_entity" className="form-label">Min Confidence (Entity)</label>
                <input
                  type="number"
                  id="min_confidence_entity"
                  name="min_confidence_entity"
                  className="form-input"
                  value={config.min_confidence_entity}
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.1"
                />
                <p className="text-xs text-secondary-500 mt-1">Minimum confidence for entity matching</p>
              </div>
            </div>
          </div>

          {/* Backup Configuration */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Backup Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="backup_provider" className="form-label">Backup Provider</label>
                <select
                  id="backup_provider"
                  name="backup_provider"
                  className="form-input"
                  value={config.backup_provider}
                  onChange={handleChange}
                >
                  <option value="">None</option>
                  <option value="local">Local (Ollama)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">Custom API</option>
                </select>
                <p className="text-xs text-secondary-500 mt-1">Fallback when primary fails</p>
              </div>

              <div>
                <label htmlFor="backup_model" className="form-label">Backup Model</label>
                {connectionTest.availableModels.length > 0 ? (
                  <select
                    id="backup_model"
                    name="backup_model"
                    className="form-input"
                    value={config.backup_model}
                    onChange={handleChange}
                  >
                    <option value="">Select a model...</option>
                    {connectionTest.availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="backup_model"
                    name="backup_model"
                    className="form-input"
                    value={config.backup_model}
                    onChange={handleChange}
                    placeholder="llama3"
                  />
                )}
                <p className="text-xs text-secondary-500 mt-1">
                  Model to use for backup provider
                  {connectionTest.availableModels.length === 0 && (
                    <span className="text-amber-600 dark:text-amber-400"> • Test connection to see available models</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-secondary-200 dark:border-secondary-700">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default LLMConfigSection; 