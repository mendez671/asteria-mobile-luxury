'use client';

import { useState } from 'react';

export default function TestApiButton() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

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

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-tag-dark-purple/90 backdrop-blur-sm p-4 rounded-lg border border-tag-gold/30 max-w-sm">
      <h3 className="text-tag-gold font-medium mb-3">API Test Console</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="w-full bg-gradient-to-r from-tag-gold to-tag-gold-light text-tag-dark-purple px-4 py-2 rounded font-medium disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run Full Diagnostics'}
        </button>
        
        <button
          onClick={testSimpleMessage}
          disabled={testing}
          className="w-full bg-tag-dark-purple border border-tag-gold/30 text-tag-gold px-4 py-2 rounded font-medium disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Simple Message'}
        </button>
      </div>
      
      {results && (
        <div className="bg-black/50 p-3 rounded text-xs text-tag-cream max-h-40 overflow-y-auto">
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
      
      <div className="text-xs text-tag-gold/60 mt-2">
        Check browser console for detailed logs
      </div>
    </div>
  );
} 