import { Share } from "lucide-react";
import { FaTwitter, FaGithub, FaDiscord } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-workflow-blue rounded-lg flex items-center justify-center">
                <Share className="text-white" size={16} />
              </div>
              <span className="font-bold text-white">WorkflowBridge</span>
            </div>
            <p className="text-sm text-gray-400">
              Connecting workflows across all platforms with AI-powered automation.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Migration</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-3">Connect</h4>
            <div className="flex space-x-3 mb-4">
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors">
                <FaTwitter className="text-gray-300" size={14} />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors">
                <FaGithub className="text-gray-300" size={14} />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors">
                <FaDiscord className="text-gray-300" size={14} />
              </a>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                All systems operational
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 WorkflowBridge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
