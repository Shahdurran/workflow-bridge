import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-workflow-blue rounded-lg flex items-center justify-center">
            <Share className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WorkflowBridge</h1>
            <p className="text-sm text-gray-500">AI-Powered Automation Builder</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Features
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Templates
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Pricing
          </a>
          <Button className="bg-workflow-blue text-white hover:bg-blue-700" data-testid="button-get-started">
            Get Started
          </Button>
        </nav>
        
        <button className="md:hidden p-2" data-testid="button-mobile-menu">
          <div className="w-6 h-0.5 bg-gray-600 mb-1"></div>
          <div className="w-6 h-0.5 bg-gray-600 mb-1"></div>
          <div className="w-6 h-0.5 bg-gray-600"></div>
        </button>
      </div>
    </header>
  );
}
