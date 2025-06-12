'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 ErrorBoundary caught error:', error);
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 ErrorBoundary componentDidCatch:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or use provided fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default luxury-branded error UI
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          textAlign: 'center',
          padding: '24px',
          zIndex: 9999
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#0f172a',
            marginBottom: '24px'
          }}>
            A
          </div>
          
          <h2 style={{ 
            fontSize: '24px', 
            marginBottom: '16px',
            color: '#d4af37'
          }}>
            Welcome to Asteria
          </h2>
          
          <p style={{ 
            fontSize: '16px', 
            marginBottom: '24px',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>
            We're preparing your luxury experience. Please refresh the page.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
              color: '#0f172a',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Refresh Experience
          </button>
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{
              marginTop: '32px',
              padding: '16px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#cccccc',
              maxWidth: '600px'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                Debug Information
              </summary>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {this.state.error?.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 