import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Force dark mode by default (before first render)
document.documentElement.classList.add('dark');

const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);

// Add error boundary and debugging
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '20px', color: 'red', backgroundColor: 'white', fontFamily: 'monospace'}}>
          <h1>Application Error</h1>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          <details>
            <summary>Stack Trace</summary>
            <pre style={{fontSize: '12px', overflow: 'auto'}}>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => window.location.reload()} style={{padding: '10px', marginTop: '10px'}}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Render the actual app with error boundary
try {
  console.log('Starting DocAI React app...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('DocAI app rendered successfully');
} catch (error) {
  console.error('Failed to render DocAI app:', error);
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; color: red; background: white; font-family: monospace;">
      <h1>Critical React Error</h1>
      <p>Error: ${error}</p>
      <button onclick="window.location.reload()" style="padding: 10px; margin-top: 10px;">Reload Page</button>
    </div>
  `;
} 