'use client';

import { useState } from 'react';

export default function TestApiButton() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(true);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('🔍 Running API diagnostics...');
      
      // Test 1: Diagnostic endpoint
      const diagResponse = await fetch('/api/diagnose');
      const diagData = await diagResponse.json();
      
      console.log('Diagnostic results:', diagData);
      
      // Test 2: Simple chat test
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello Asteria, are you working?',
          memberID: 'test-user'
        })
      });
      
      const chatData = await chatResponse.json();
      console.log('Chat test results:', chatData);
      console.log('Chat response properties:', Object.keys(chatData));
      console.log('Chat response.response:', chatData.response);
      console.log('Chat serviceCategory:', chatData.serviceCategory);
      
      setResults({
        diagnostics: diagData,
        chatTest: chatData,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('Test failed:', error);
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const testSimpleMessage = async () => {
    setTesting(true);
    
    try {
      console.log('💬 Testing simple message...');
      
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMessage: 'I need a restaurant reservation for tonight'
        })
      });
      
      const data = await response.json();
      console.log('Simple message test:', data);
      console.log('Simple test properties:', Object.keys(data));
      console.log('Simple test success:', data.success);
      console.log('Simple test message:', data.message);
      
      setResults({
        simpleTest: data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('Simple test failed:', error);
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg transition-all duration-300 ${isMinimized ? 'w-12 h-12' : 'w-80 max-w-sm'}`}>
      {isMinimized ? (
        // Minimized state - just a small button
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors"
          title="Open API Test Console"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      ) : (
        // Expanded state - full console
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-cyan-400 font-medium text-sm">API Console</h3>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            <button
              onClick={runDiagnostics}
              disabled={testing}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-2 rounded text-xs font-medium disabled:opacity-50 hover:from-cyan-500 hover:to-blue-500 transition-all duration-200"
            >
              {testing ? 'Testing...' : 'Full Diagnostics'}
            </button>
            
            <button
              onClick={testSimpleMessage}
              disabled={testing}
              className="w-full bg-slate-800 border border-cyan-500/30 text-cyan-300 px-3 py-2 rounded text-xs font-medium disabled:opacity-50 hover:bg-slate-700 transition-all duration-200"
            >
              {testing ? 'Testing...' : 'Simple Test'}
            </button>
          </div>
          
          {results && (
            <div className="bg-black/50 p-3 rounded text-xs text-slate-300 max-h-32 overflow-y-auto">
              <pre>{JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 