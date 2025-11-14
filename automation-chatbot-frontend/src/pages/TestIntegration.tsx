import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useWorkflow } from '@/hooks/useWorkflow';
import { checkHealth } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function TestIntegration() {
  const sessionId = `test_session_${Date.now()}`;
  const { messages, isLoading: chatLoading, sendMessage, error: chatError } = useChat(sessionId);
  const { 
    currentWorkflow, 
    isGenerating, 
    generate, 
    validate,
    exportFile,
    error: workflowError 
  } = useWorkflow();
  
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `✅ ${message}`]);
  };

  const addError = (message: string) => {
    setTestResults(prev => [...prev, `❌ ${message}`]);
  };

  const testHealthCheck = async () => {
    try {
      const health = await checkHealth();
      setHealthStatus(health);
      addResult('Health check passed');
    } catch (error) {
      addError('Health check failed');
    }
  };

  const testChat = async () => {
    try {
      await sendMessage('I want to send an email when a Google Form is submitted');
      addResult('Chat message sent successfully');
    } catch (error) {
      addError('Chat message failed');
    }
  };

  const testWorkflowGeneration = async () => {
    try {
      const response = await generate(
        'zapier',
        {
          trigger: { app: 'Google Forms', event: 'New Response' },
          actions: [{ app: 'Gmail', event: 'Send Email' }],
        },
        {
          form_id: 'test-form-123',
          email_recipient: 'test@example.com',
          email_subject: 'New Form Submission',
          email_body: 'You have a new form submission!',
        },
        'Test Form to Email'
      );
      addResult(`Workflow generated: ${response.workflow.id}`);
    } catch (error) {
      addError('Workflow generation failed');
    }
  };

  const testValidation = async () => {
    if (!currentWorkflow) {
      addError('No workflow to validate. Generate one first.');
      return;
    }
    try {
      const result = await validate(currentWorkflow.workflow_json, currentWorkflow.platform);
      if (result.valid) {
        addResult('Workflow validation passed');
      } else {
        addError(`Validation failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      addError('Validation request failed');
    }
  };

  const testExport = async () => {
    if (!currentWorkflow) {
      addError('No workflow to export. Generate one first.');
      return;
    }
    try {
      await exportFile(currentWorkflow.id);
      addResult('Workflow exported successfully');
    } catch (error) {
      addError('Export failed');
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testHealthCheck();
    await new Promise(r => setTimeout(r, 500));
    await testChat();
    await new Promise(r => setTimeout(r, 500));
    await testWorkflowGeneration();
    await new Promise(r => setTimeout(r, 500));
    await testValidation();
    await new Promise(r => setTimeout(r, 500));
    await testExport();
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">API Integration Testing</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={testHealthCheck} className="w-full">
              Test Health Check
            </Button>
            <Button onClick={testChat} disabled={chatLoading} className="w-full">
              Test Chat
            </Button>
            <Button onClick={testWorkflowGeneration} disabled={isGenerating} className="w-full">
              Test Workflow Generation
            </Button>
            <Button onClick={testValidation} className="w-full">
              Test Validation
            </Button>
            <Button onClick={testExport} className="w-full">
              Test Export
            </Button>
            <Button onClick={runAllTests} variant="default" className="w-full mt-4">
              🚀 Run All Tests
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No tests run yet</p>
              ) : (
                testResults.map((result, i) => (
                  <div key={i}>{result}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {healthStatus && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(healthStatus, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {messages.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Chat Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded ${
                    msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <div className="font-semibold text-sm">{msg.role}</div>
                  <div>{msg.content}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(currentWorkflow, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {(chatError || workflowError) && (
        <Card className="mt-6 border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            {chatError && <div className="text-red-600">Chat: {chatError}</div>}
            {workflowError && <div className="text-red-600">Workflow: {workflowError}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

