/**
 * n8n Chat Page
 * 
 * Full-page chat interface for creating n8n workflows with Claude AI
 */

import { N8nChatContainer } from '@/components/chat/n8n-chat-container';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export const N8nChatPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  n8n Workflow Builder
                </h1>
                <p className="text-sm text-gray-600">
                  Create workflows with AI-powered assistance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface - Main Column */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg h-[calc(100vh-180px)]">
              <N8nChatContainer />
            </Card>
          </div>

          {/* Info Panel - Side Column */}
          <div className="space-y-6">
            {/* Features Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">✨ Features</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Real-time streaming responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Access to 500+ n8n nodes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Pre-built workflow templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Automatic workflow validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>One-click deployment to n8n</span>
                </li>
              </ul>
            </Card>

            {/* Tips Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h3 className="font-semibold text-blue-900 mb-4">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>Be specific about your automation goals</li>
                <li>Mention the apps/services you want to connect</li>
                <li>Describe your trigger conditions clearly</li>
                <li>Ask to see templates for similar use cases</li>
              </ul>
            </Card>

            {/* Example Workflows */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📋 Popular Workflows</h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                  Email automation
                </div>
                <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                  Social media posting
                </div>
                <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                  Data synchronization
                </div>
                <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                  Webhook processing
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nChatPage;

