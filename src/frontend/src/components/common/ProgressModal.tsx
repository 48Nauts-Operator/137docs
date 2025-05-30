import React from 'react';
import { X, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  progress: {
    status: 'processing' | 'completed' | 'error';
    total: number;
    processed: number;
    skipped: number;
    errors: number;
    message?: string;
    details?: Array<{
      document_id: number;
      status: string;
      tenant?: string;
      message?: string;
      confidence?: number;
    }>;
  };
}

const ProgressModal: React.FC<ProgressModalProps> = ({ isOpen, onClose, title, progress }) => {
  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const progressPercentage = progress.total > 0 
    ? Math.round(((progress.processed + progress.skipped + progress.errors) / progress.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
            disabled={progress.status === 'processing'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-secondary-600 dark:text-secondary-400 mb-2">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          {progress.message && (
            <div className={`text-sm ${getStatusColor()} mb-4`}>
              {progress.message}
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-secondary-900 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {progress.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {progress.processed}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Processed</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {progress.skipped}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Skipped</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {progress.errors}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
            </div>
          </div>

          {/* Details Section */}
          {progress.details && progress.details.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                Processing Details
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {progress.details.slice(-10).map((detail, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-900 rounded text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-secondary-500">Doc #{detail.document_id}</span>
                      {detail.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {detail.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {detail.status === 'no_match' && (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-right">
                      {detail.tenant && (
                        <div className="text-secondary-700 dark:text-secondary-300">
                          → {detail.tenant}
                        </div>
                      )}
                      {detail.confidence && (
                        <div className="text-xs text-secondary-500">
                          {Math.round(detail.confidence * 100)}% confidence
                        </div>
                      )}
                      {detail.message && !detail.tenant && (
                        <div className="text-xs text-secondary-500">
                          {detail.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {progress.details.length > 10 && (
                <div className="text-xs text-secondary-500 mt-2 text-center">
                  Showing last 10 of {progress.details.length} items
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-secondary-200 dark:border-secondary-700">
          <button
            onClick={onClose}
            disabled={progress.status === 'processing'}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-md text-sm font-medium transition-colors"
          >
            {progress.status === 'processing' ? 'Processing...' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal; 